// netlify/functions/publish-blog-post.js
// SENTINEL: NB_PULSE_PUBLISH_BLOG_V1
//
// The publish button for the blog. Pulse is where posts are written, the
// studio site is where they live, and this function is the bridge between
// the two. Three actions, all POST, all session gated:
//
//   publish    mark the row published, wake the studio build, draft socials
//   unpublish  mark the row draft, wake the studio build so the post leaves
//   redraft    regenerate the social drafts without touching the post
//
// The studio side of the bridge is scripts/db-posts.mjs in the neonburro
// repo. Its build pulls every published row and writes it as an .mdx file,
// so a published post gets the same share page, sitemap entry, rss item and
// og card as a hand written one. Waking that build is one POST to a Netlify
// build hook, the url lives in BUILD_HOOK_URL on the Pulse site. Until that
// env var is set publishing still works, the row flips and the response says
// the studio was not woken, so the next studio deploy picks it up instead.
//
// Social drafts follow the Volt pattern from draft-invoice.js, a direct
// fetch to Anthropic with a single forced tool so the answer is always the
// shape the socials panel wants. One draft per platform, x telegram reddit
// and pump.fun, written in the house voice which is spelled out in the
// system prompt below. Drafts land in blog_social_drafts, rows with status
// posted are kept as history, unposted drafts are replaced on every run.
//
// Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY and
// BUILD_HOOK_URL on the Pulse site. The first two gate the door, the last
// two each degrade gracefully when missing.
//
// No oxford commas, no em dashes.

import { createClient } from '@supabase/supabase-js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BUILD_HOOK_URL = process.env.BUILD_HOOK_URL;
const MODEL = 'claude-sonnet-5';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supa = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const PLATFORMS = ['x', 'telegram', 'reddit', 'pumpfun'];

// The house voice, the same laws the site itself is written under. The model
// gets them spelled out because a draft that breaks them is a draft nobody
// can paste.
const SYSTEM = `You draft social posts for Neon Burro, a small digital studio in Ridgway Colorado on the western slope. A blog post just published on neonburro.com and you write one draft for each platform pointing at it.

The house voice, these are laws not preferences:
- everything lowercase, titles included
- calm plainspoken and dry, specific over grand
- no exclamation points, no hype, no marketing voice
- no oxford commas, no em dashes and no en dashes, do not use a colon as sentence punctuation
- burro characters are named lowercase with a trailing period, for example "epoch." or "cypher.", and are never called donkeys
- the word hue-man is always spelled with an interpunct as hue•man
- the word dashboard is banned
- never talk about price, returns, gains or urgency, never promise anything financial, never say buy
- real places anchor the writing, Ridgway, the western slope, the San Juans

Per platform:
- x: under 260 characters plus the link on its own last line. One or two quiet sentences.
- telegram: a short paragraph, three or four sentences, then the link on its own last line. Slightly warmer, this audience already holds the coin.
- reddit: the first line is a lowercase title, then a blank line, then two short paragraphs in the same voice, then the link. No title prefix words like "title".
- pumpfun: two or three short sentences for the coin page audience, the burro believers. Plain about what shipped and where to read it. The link last.

Every draft carries the post url exactly as given. Always answer by calling the draft_socials tool.`;

const TOOL = {
  name: 'draft_socials',
  description: 'Return one social draft per platform.',
  input_schema: {
    type: 'object',
    properties: {
      drafts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            platform: { type: 'string', enum: PLATFORMS },
            body: { type: 'string', description: 'the full paste ready text of the post' },
          },
          required: ['platform', 'body'],
        },
      },
    },
    required: ['drafts'],
  },
};

const draftSocials = async (post) => {
  const liveUrl = `https://neonburro.com/blog/${post.slug}/`;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'draft_socials' },
      messages: [{
        role: 'user',
        content: `The post url: ${liveUrl}\n\nTitle: ${post.title}\n\nExcerpt: ${post.excerpt || '(none)'}\n\nAuthor burro: ${post.burro || 'epoch'}\n\nThe post body:\n\n${String(post.body_mdx || '').slice(0, 12000)}`,
      }],
    }),
  });
  if (!res.ok) {
    console.error('Anthropic error:', await res.text());
    return null;
  }
  const data = await res.json();
  const toolUse = (data.content || []).find((b) => b.type === 'tool_use' && b.name === 'draft_socials');
  const drafts = toolUse?.input?.drafts;
  return Array.isArray(drafts) ? drafts.filter((d) => PLATFORMS.includes(d.platform) && d.body) : null;
};

const wakeStudio = async () => {
  if (!BUILD_HOOK_URL) return 'BUILD_HOOK_URL is not set, the studio was not woken, the next deploy picks this up';
  try {
    const res = await fetch(BUILD_HOOK_URL, { method: 'POST' });
    return res.ok ? null : `the build hook answered ${res.status}`;
  } catch {
    return 'the build hook was unreachable';
  }
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!supa || !token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Sign in to publish.' }) };
  }
  const { data: userData, error: authErr } = await supa.auth.getUser(token);
  if (authErr || !userData?.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Sign in to publish.' }) };
  }

  // Publishing reaches the public site, so a valid session is not enough,
  // the caller has to hold a staff role in profiles.
  const { data: profile } = await supa
    .from('profiles').select('role').eq('id', userData.user.id).single();
  if (!['super_admin', 'admin', 'manager'].includes(profile?.role)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Publishing needs a staff role.' }) };
  }

  try {
    const { action, post_id: postId } = JSON.parse(event.body || '{}');
    if (!postId || !['publish', 'unpublish', 'redraft'].includes(action)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Send an action and a post_id.' }) };
    }

    const { data: post, error: postErr } = await supa
      .from('blog_posts').select('*').eq('id', postId).single();
    if (postErr || !post) {
      return { statusCode: 404, body: JSON.stringify({ error: 'That post does not exist.' }) };
    }

    const notes = [];

    if (action === 'unpublish') {
      await supa.from('blog_posts')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('id', postId);
      const hookNote = await wakeStudio();
      if (hookNote) notes.push(hookNote);
      return { statusCode: 200, body: JSON.stringify({ ok: true, status: 'draft', notes }) };
    }

    if (action === 'publish') {
      const publishedAt = post.published_at || new Date().toISOString();
      await supa.from('blog_posts')
        .update({ status: 'published', published_at: publishedAt, updated_at: new Date().toISOString() })
        .eq('id', postId);
      post.status = 'published';
      post.published_at = publishedAt;
      const hookNote = await wakeStudio();
      if (hookNote) notes.push(hookNote);
    }

    // Both publish and redraft end with fresh social drafts.
    let socials = [];
    if (!ANTHROPIC_API_KEY) {
      notes.push('ANTHROPIC_API_KEY is not set, no social drafts this time');
    } else {
      const drafts = await draftSocials(post);
      if (!drafts || !drafts.length) {
        notes.push('the model did not return social drafts, try redrafting');
      } else {
        // Posted rows are history and stay. Unposted drafts are replaced.
        await supa.from('blog_social_drafts')
          .delete().eq('post_id', postId).eq('status', 'draft');
        const { data: inserted } = await supa.from('blog_social_drafts')
          .insert(drafts.map((d) => ({ post_id: postId, platform: d.platform, body: d.body })))
          .select();
        socials = inserted || [];
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        status: post.status,
        liveUrl: `https://neonburro.com/blog/${post.slug}/`,
        socialsDrafted: socials.length,
        notes,
      }),
    };
  } catch (err) {
    console.error('publish-blog-post error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Publishing hit an error.' }) };
  }
};
