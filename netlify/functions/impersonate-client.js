// netlify/functions/impersonate-client.js
// Admin-only: mint an impersonation session token that lets an admin view
// the client portal as a specific client for a short, audited window.
//
// Updated post role hierarchy migration: now allows super_admin and admin.
//
// DIAGNOSTIC BUILD: when DEBUG_IMPERSONATE=true, response bodies include
// the actual values seen by the function so we can pinpoint the role check
// failure without guessing.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORTAL_URL = 'https://neonburro.com/account/';
const DEBUG = process.env.NODE_ENV !== 'production' || process.env.DEBUG_IMPERSONATE === 'true';

const ALLOWED_ROLES = ['super_admin', 'admin'];

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

const log = (level, step, data = {}) => {
  console.log(JSON.stringify({
    fn: 'impersonate-client',
    level,
    step,
    timestamp: new Date().toISOString(),
    ...data,
  }));
};

// Diagnostic helper: surface invisible characters in role strings
const inspectString = (s) => {
  if (s === null || s === undefined) return { value: s, type: typeof s };
  return {
    value: s,
    type: typeof s,
    length: s.length,
    json: JSON.stringify(s),
    char_codes: Array.from(s).map((c) => c.charCodeAt(0)),
  };
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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    log('error', 'env_missing', {
      has_url: !!SUPABASE_URL,
      has_key: !!SUPABASE_SERVICE_ROLE_KEY,
    });
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Server misconfigured',
        debug: 'Missing Supabase environment variables',
      }),
    };
  }

  try {
    log('info', 'invocation_start', {
      ip: getClientIp(event),
      build: 'diagnostic-2026-05-03',
      allowed_roles: ALLOWED_ROLES,
    });

    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log('warn', 'missing_auth_header');
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing authorization', code: 'NO_AUTH' }),
      };
    }

    const jwt = authHeader.slice(7);

    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);

    if (userError) {
      log('error', 'jwt_verify_failed', {
        error_message: userError.message,
        error_status: userError.status,
      });
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Invalid session',
          code: 'JWT_INVALID',
          ...(DEBUG && { debug: userError.message }),
        }),
      };
    }

    if (!userData?.user) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'No user in session', code: 'NO_USER' }),
      };
    }

    const adminUserId = userData.user.id;
    log('info', 'admin_authenticated', { admin_user_id: adminUserId });

    let parsed;
    try {
      parsed = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }

    const { client_id, duration_minutes, reason } = parsed;

    if (!client_id) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'client_id is required' }),
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, display_name')
      .eq('id', adminUserId)
      .maybeSingle();

    if (profileError) {
      log('error', 'profile_lookup_failed', {
        error_message: profileError.message,
        admin_user_id: adminUserId,
      });
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Could not verify your permissions',
          code: 'PROFILE_ERROR',
          ...(DEBUG && { debug: profileError.message }),
        }),
      };
    }

    if (!profile) {
      log('warn', 'profile_not_found', { admin_user_id: adminUserId });
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Your user has no profile record',
          code: 'NO_PROFILE',
          ...(DEBUG && { debug: { admin_user_id: adminUserId } }),
        }),
      };
    }

    const roleInspection = inspectString(profile.role);
    log('info', 'profile_loaded', {
      admin_user_id: adminUserId,
      profile_id: profile.id,
      display_name: profile.display_name,
      role_inspection: roleInspection,
      allowed_roles: ALLOWED_ROLES,
      includes_check: ALLOWED_ROLES.includes(profile.role),
    });

    if (!ALLOWED_ROLES.includes(profile.role)) {
      log('warn', 'role_not_authorized', {
        admin_user_id: adminUserId,
        role_inspection: roleInspection,
        allowed_roles: ALLOWED_ROLES,
      });
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `Your role (${profile.role || 'none'}) cannot impersonate clients`,
          code: 'ROLE_DENIED',
          ...(DEBUG && {
            debug: {
              role_inspection: roleInspection,
              allowed_roles: ALLOWED_ROLES,
              admin_user_id: adminUserId,
              profile_id: profile.id,
            },
          }),
        }),
      };
    }

    log('info', 'profile_verified', {
      role: profile.role,
      display_name: profile.display_name,
    });

    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

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
      log('error', 'rpc_mint_failed', {
        error_message: mintError.message,
        error_details: mintError.details,
        error_hint: mintError.hint,
        error_code: mintError.code,
        admin_user_id: adminUserId,
        client_id,
      });

      const publicMessage = mintError.message.includes('not authorized')
        ? 'You are not authorized to impersonate clients'
        : mintError.message.includes('Client not found')
        ? 'Client not found'
        : 'Could not start impersonation session';

      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: publicMessage,
          code: 'MINT_FAILED',
          ...(DEBUG && {
            debug: {
              message: mintError.message,
              details: mintError.details,
              hint: mintError.hint,
              pg_code: mintError.code,
            },
          }),
        }),
      };
    }

    log('info', 'session_minted', { session_id: sessionId });

    const redirectUrl = `${PORTAL_URL}?impersonate=${encodeURIComponent(rawToken)}`;
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
    log('error', 'unexpected_error', {
      error_message: err.message,
      error_stack: err.stack,
    });
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Something went wrong',
        code: 'UNEXPECTED',
        ...(DEBUG && { debug: err.message }),
      }),
    };
  }
};