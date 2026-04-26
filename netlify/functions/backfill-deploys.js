// netlify/functions/backfill-deploys.js
// One-shot historical sync of Netlify deploys into the netlify_deploys table.
//
// Usage:
//   GET https://pulse.neonburro.com/.netlify/functions/backfill-deploys
//   GET https://pulse.neonburro.com/.netlify/functions/backfill-deploys?days=30
//   GET https://pulse.neonburro.com/.netlify/functions/backfill-deploys?site=cimarronengineering
//
// Iterates every connected client_site, fetches its deploy history from
// Netlify API, upserts into netlify_deploys (idempotent via onConflict: 'id').
//
// Does NOT log to activity_log - we don't want hundreds of fake "deploy
// succeeded" notifications appearing in the team activity stream for old
// deploys. Webhook handles activity_log for live deploys going forward.
//
// Defaults: 30 days, all connected sites.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NETLIFY_PAT = process.env.NETLIFY_PAT;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NETLIFY_API = 'https://api.netlify.com/api/v1';

const netlifyFetch = async (path) => {
  const res = await fetch(`${NETLIFY_API}${path}`, {
    headers: {
      Authorization: `Bearer ${NETLIFY_PAT}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Netlify API ${res.status}: ${text}`);
  }
  return res.json();
};

// Match the shape used by netlify-deploy-webhook.js exactly so backfilled
// rows are indistinguishable from live webhook rows.
const mapDeployToRow = (d, clientSite) => ({
  id: d.id,
  netlify_site_id: clientSite.netlify_site_id,
  site_id: clientSite.id,
  client_id: clientSite.client_id,
  state: d.state,
  branch: d.branch,
  context: d.context,
  commit_ref: d.commit_ref,
  commit_url: d.commit_url,
  commit_message: d.title,
  committer: d.committer,
  deploy_url: d.deploy_url,
  permalink: d.links?.permalink,
  deploy_time: d.deploy_time,
  error_message: d.error_message,
  framework: d.framework,
  created_at: d.created_at,
  published_at: d.published_at,
});

exports.handler = async (event) => {
  const startedAt = Date.now();
  const params = event.queryStringParameters || {};
  const daysBack = parseInt(params.days || '30', 10);
  const siteFilter = params.site || null;

  if (!NETLIFY_PAT) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'NETLIFY_PAT env var not set' }),
    };
  }

  try {
    // 1. Load every connected client_site
    let sitesQuery = supabase
      .from('client_sites')
      .select('id, client_id, netlify_site_id, netlify_site_name, display_name');

    if (siteFilter) {
      sitesQuery = sitesQuery.eq('netlify_site_name', siteFilter);
    }

    const { data: sites, error: sitesError } = await sitesQuery;
    if (sitesError) throw new Error(`client_sites query failed: ${sitesError.message}`);

    if (!sites || sites.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: siteFilter
            ? `No client_site found with netlify_site_name '${siteFilter}'`
            : 'No client_sites registered yet',
          total_synced: 0,
          by_site: [],
        }),
      };
    }

    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const cutoffMs = cutoffDate.getTime();

    const bySite = [];
    let totalSynced = 0;
    let totalSkipped = 0;
    const errors = [];

    // 2. For each site, fetch + upsert deploys
    for (const site of sites) {
      try {
        const deploys = await netlifyFetch(
          `/sites/${site.netlify_site_id}/deploys?per_page=100`
        );

        // Filter to deploys within the cutoff window
        const recentDeploys = (deploys || []).filter((d) => {
          if (!d.created_at) return false;
          return new Date(d.created_at).getTime() >= cutoffMs;
        });

        if (recentDeploys.length === 0) {
          bySite.push({
            site: site.netlify_site_name,
            display_name: site.display_name,
            synced: 0,
            skipped: deploys?.length || 0,
            note: `No deploys in last ${daysBack} days`,
          });
          totalSkipped += deploys?.length || 0;
          continue;
        }

        const rows = recentDeploys.map((d) => mapDeployToRow(d, site));

        const { error: upsertError } = await supabase
          .from('netlify_deploys')
          .upsert(rows, { onConflict: 'id' });

        if (upsertError) {
          errors.push({
            site: site.netlify_site_name,
            error: upsertError.message,
          });
          bySite.push({
            site: site.netlify_site_name,
            display_name: site.display_name,
            synced: 0,
            error: upsertError.message,
          });
          continue;
        }

        bySite.push({
          site: site.netlify_site_name,
          display_name: site.display_name,
          synced: recentDeploys.length,
          skipped: (deploys?.length || 0) - recentDeploys.length,
        });

        totalSynced += recentDeploys.length;
        totalSkipped += (deploys?.length || 0) - recentDeploys.length;

        // Update last_synced_at on the client_site
        await supabase
          .from('client_sites')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', site.id);
      } catch (siteErr) {
        console.error(`Backfill failed for ${site.netlify_site_name}:`, siteErr);
        errors.push({
          site: site.netlify_site_name,
          error: siteErr.message,
        });
        bySite.push({
          site: site.netlify_site_name,
          display_name: site.display_name,
          synced: 0,
          error: siteErr.message,
        });
      }
    }

    const durationMs = Date.now() - startedAt;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: errors.length === 0,
        days_back: daysBack,
        site_filter: siteFilter,
        total_synced: totalSynced,
        total_skipped: totalSkipped,
        sites_processed: sites.length,
        errors: errors.length > 0 ? errors : undefined,
        by_site: bySite,
        duration_ms: durationMs,
      }, null, 2),
    };
  } catch (err) {
    console.error('backfill-deploys error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
