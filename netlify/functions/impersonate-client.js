// netlify/functions/impersonate-client.js
// Admin-only: mint an impersonation session token that lets an admin view
// the client portal as a specific client for a short, audited window.
//
// Flow:
//   1. Admin's Pulse session sends Authorization: Bearer <supabase_jwt>
//   2. We verify the JWT, extract user_id
//   3. We check their profiles.role is admin or owner
//   4. We generate a 32-byte random token, hash it with sha256
//   5. We call mint_impersonation_session(token_hash, ...)
//   6. We return { token, redirect_url, expires_at, session_id }
//   7. Admin's browser opens neonburro.com/account/?impersonate=<token>
//
// The raw token exists only in this response and the admin's browser tab.
// The DB only ever sees the hash.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORTAL_URL = 'https://neonburro.com/account/';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const getClientIp = (event) =>
  event.headers['x-nf-client-connection-ip'] ||
  event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  'unknown';

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
    // 1. Extract and verify the admin's Supabase JWT
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing authorization' }),
      };
    }

    const jwt = authHeader.slice(7);
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !userData?.user) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid session' }),
      };
    }

    const adminUserId = userData.user.id;

    // 2. Parse request body
    const { client_id, duration_minutes, reason } = JSON.parse(event.body || '{}');

    if (!client_id) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'client_id is required' }),
      };
    }

    // 3. Generate token + hash
    // 32 bytes = 256 bits of entropy. Base64url-encoded for URL safety.
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 4. Mint the session via RPC (role check happens inside the function)
    const { data: sessionId, error: mintError } = await supabase.rpc(
      'mint_impersonation_session',
      {
        p_token_hash: tokenHash,
        p_admin_user_id: adminUserId,
        p_client_id: client_id,
        p_duration_minutes: duration_minutes || 30,
        p_ip_address: getClientIp(event),
        p_user_agent: event.headers['user-agent'] || null,
        p_reason: reason || null,
      }
    );

    if (mintError) {
      console.error('mint_impersonation_session error:', mintError);
      // Surface clean errors to the user, log details server-side
      const publicMessage = mintError.message.includes('not authorized')
        ? 'You are not authorized to impersonate clients'
        : mintError.message.includes('Client not found')
        ? 'Client not found'
        : 'Could not start impersonation session';

      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: publicMessage }),
      };
    }

    // 5. Build the redirect URL
    const redirectUrl = `${PORTAL_URL}?impersonate=${encodeURIComponent(rawToken)}`;

    // 6. Return the raw token ONCE — admin's browser uses it, then forgets it
    const expiresAt = new Date(Date.now() + (duration_minutes || 30) * 60 * 1000).toISOString();

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        session_id: sessionId,
        token: rawToken,
        redirect_url: redirectUrl,
        expires_at: expiresAt,
      }),
    };
  } catch (err) {
    console.error('impersonate-client error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Something went wrong' }),
    };
  }
};