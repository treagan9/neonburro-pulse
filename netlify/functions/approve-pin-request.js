// netlify/functions/approve-pin-request.js
// Called when admin clicks approval link from email
// Validates token, sends PIN to client, marks request as approved
//
// Two actions:
//   GET  with ?token=xxx -> returns request details (for the Pulse approval page to display)
//   POST with ?token=xxx&action=approve|deny -> executes the action

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const resend = new Resend(RESEND_API_KEY);

const escapeHtml = (s) => String(s || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildClientPinEmail = ({ clientName, pin }) => {
  const safeName = escapeHtml(clientName || 'there');
  const safePin = escapeHtml(pin);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your NeonBurro PIN</title></head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#0a0a0a;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:36px 28px;">
          <div style="margin-bottom:24px;">
            <img src="https://pulse.neonburro.com/neon-burro-email-logo.png" alt="NeonBurro" width="44" height="44" style="border-radius:50%;display:block;" />
          </div>
          
          <div style="color:#00E5E5;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Your Lookup PIN</div>
          <div style="color:#ffffff;font-size:24px;font-weight:800;margin-bottom:4px;">Hi ${safeName}</div>
          <div style="color:#a0a0a0;font-size:14px;line-height:1.6;margin-bottom:28px;">
            Here's your PIN to look up your invoices on neonburro.com. Keep it somewhere safe.
          </div>

          <div style="background:#141414;border:2px solid rgba(0,229,229,0.3);border-radius:16px;padding:32px 20px;margin-bottom:24px;text-align:center;">
            <div style="color:#525252;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Your PIN</div>
            <div style="color:#00E5E5;font-size:42px;font-weight:800;font-family:monospace;letter-spacing:10px;text-shadow:0 0 20px rgba(0,229,229,0.4);">${safePin}</div>
          </div>

          <div style="text-align:center;margin:24px 0;">
            <a href="https://neonburro.com/account/lookup/" style="display:inline-block;background:#00E5E5;color:#0a0a0a;text-decoration:none;padding:14px 32px;border-radius:100px;font-weight:800;font-size:14px;">Look Up My Invoices</a>
          </div>

          <div style="background:rgba(255,229,0,0.06);border:1px solid rgba(255,229,0,0.25);border-radius:10px;padding:14px 16px;margin-top:24px;">
            <div style="color:#FFE500;font-size:11px;font-weight:700;margin-bottom:4px;">🔒 Keep this private</div>
            <div style="color:#a0a0a0;font-size:11px;line-height:1.5;">
              Your PIN combined with your email lets anyone view your invoice history. Don't share this PIN with people you don't trust.
            </div>
          </div>

          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #1f1f1f;text-align:center;">
            <div style="color:#525252;font-size:11px;">
              Real people. Clear responses.<br>
              <a href="mailto:hello@neonburro.com" style="color:#00E5E5;text-decoration:none;">hello@neonburro.com</a> · (970) 973-8550
            </div>
            <div style="color:#333;font-size:10px;margin-top:10px;">
              Neon Burro · Powered by The Burroship, LLC
            </div>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
};

exports.handler = async (event) => {
  try {
    const token = event.queryStringParameters?.token;

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Token required' }),
      };
    }

    // GET: return request details for display
    if (event.httpMethod === 'GET') {
      const { data: request } = await supabase
        .from('pin_requests')
        .select('*, clients(id, name, email, company, portal_pin, lookup_pin)')
        .eq('approval_token', token)
        .maybeSingle();

      if (!request) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Request not found or already processed' }),
        };
      }

      if (request.status !== 'pending') {
        return {
          statusCode: 410,
          body: JSON.stringify({
            error: `This request has already been ${request.status}`,
            status: request.status,
          }),
        };
      }

      if (new Date(request.token_expires_at) < new Date()) {
        await supabase
          .from('pin_requests')
          .update({ status: 'expired' })
          .eq('id', request.id);

        return {
          statusCode: 410,
          body: JSON.stringify({ error: 'This request has expired' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          request: {
            id: request.id,
            email: request.email,
            created_at: request.created_at,
            request_ip: request.request_ip,
            client: request.clients ? {
              id: request.clients.id,
              name: request.clients.name,
              email: request.clients.email,
              company: request.clients.company,
            } : null,
          },
        }),
      };
    }

    // POST: execute approve or deny
    if (event.httpMethod === 'POST') {
      const { action } = JSON.parse(event.body || '{}');

      if (!['approve', 'deny'].includes(action)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
      }

      const { data: request } = await supabase
        .from('pin_requests')
        .select('*, clients(id, name, email, portal_pin, lookup_pin)')
        .eq('approval_token', token)
        .maybeSingle();

      if (!request || request.status !== 'pending') {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Request not found or already processed' }),
        };
      }

      if (new Date(request.token_expires_at) < new Date()) {
        return {
          statusCode: 410,
          body: JSON.stringify({ error: 'This request has expired' }),
        };
      }

      if (action === 'deny') {
        await supabase
          .from('pin_requests')
          .update({
            status: 'denied',
            approval_token: null,
            denial_reason: 'Denied by admin',
          })
          .eq('id', request.id);

        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, action: 'denied' }),
        };
      }

      // APPROVE: send the PIN to the client
      if (!request.clients) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'No client record linked to this request' }),
        };
      }

      const pin = request.clients.portal_pin || request.clients.lookup_pin;
      if (!pin) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Client has no PIN set. Please generate one first.' }),
        };
      }

      const html = buildClientPinEmail({
        clientName: request.clients.name,
        pin,
      });

      await resend.emails.send({
        from: 'NeonBurro <hello@neonburro.com>',
        to: request.clients.email,
        subject: 'Your NeonBurro PIN',
        html,
      });

      await supabase
        .from('pin_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approval_token: null, // invalidate token after use
        })
        .eq('id', request.id);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, action: 'approved' }),
      };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('approve-pin-request error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Something went wrong' }),
    };
  }
};