// netlify/functions/validate-impersonation.js
// Public endpoint: exchanges a raw impersonation token for a client context.
// Called by the client portal at neonburro.com/account/ when the URL contains
// ?impersonate=<raw_token> or when the portal has a token in sessionStorage.
//
// Flow:
//   1. Receive { token } in POST body
//   2. sha256 the token
//   3. Call validate_impersonation_session RPC (checks expiry, revocation, updates last_used_at)
//   4. If valid, fetch the client record to hydrate the portal
//   5. Return { session, client } so the portal can render read-only
//
// The RPC-side only returns session metadata (session_id, client_id, expires_at,
// admin_display_name). We do the additional client fetch here so the portal
// gets everything it needs in one round trip.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { token } = JSON.parse(event.body || '{}');

    if (!token || typeof token !== 'string' || token.length < 16) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    // Hash the token — DB only stores hashes, never raw
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Validate via RPC. This also updates last_used_at atomically.
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'validate_impersonation_session',
      { p_token_hash: tokenHash }
    );

    if (rpcError) {
      console.error('validate_impersonation_session error:', rpcError);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Validation failed' }),
      };
    }

    // RPC returns an array (table function). Empty = invalid/expired/revoked.
    if (!rpcData || rpcData.length === 0) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Session invalid, expired, or revoked',
          code: 'SESSION_INVALID',
        }),
      };
    }

    const session = rpcData[0];

    // Fetch the client record to hydrate the portal
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        email,
        company,
        phone,
        avatar_url,
        website,
        status,
        balance,
        tags,
        created_at,
        last_activity_at
      `)
      .eq('id', session.r_client_id)
      .maybeSingle();

    if (clientError || !client) {
      console.error('Client fetch error:', clientError);
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Client record not found' }),
      };
    }

    // Return everything the portal needs to render
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        session: {
          id: session.r_session_id,
          client_id: session.r_client_id,
          expires_at: session.r_expires_at,
          admin_display_name: session.r_admin_display_name,
          is_impersonation: true,
        },
        client,
      }),
    };
  } catch (err) {
    console.error('validate-impersonation error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Something went wrong' }),
    };
  }
};