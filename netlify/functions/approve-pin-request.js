// netlify/functions/approve-pin-request.js
// Called when admin clicks approval link from email.
// Validates token, sends PIN to client, marks request approved.
// Light-mode email with banner, palette from src/lib/emailTokens.js.
//
//   GET  ?token=xxx                       -> request details for the Pulse page
//   POST ?token=xxx { action: approve|deny } -> executes the action

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const resend = new Resend(RESEND_API_KEY);

// Email palette mirrored here (CJS function can't import the ESM token file).
// Keep in sync with src/lib/emailTokens.js.
const C = {
  page: '#E8E0D4', card: '#F3EDE3', raised: '#FFFFFF', line: '#DDD2C2',
  ink: '#241A16', inkSec: '#4A382F', inkMuted: '#6B5245', inkFaint: '#9A8574',
  signal: '#C5D957', signalDeep: '#A6B84A', banana: '#FFE500', bananaDeep: '#9A8B00',
  banner: 'https://pulse.neonburro.com/neon-burro-email-banner.png',
};

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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your NeonBurro PIN</title></head>
<body style="margin:0;padding:0;background:${C.page};font-family:'Geist Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};padding:28px 12px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:${C.card};border:1px solid ${C.line};border-radius:16px;overflow:hidden;">
        <tr><td style="line-height:0;background:${C.card};">
          <img src="${C.banner}" alt="NeonBurro" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <div style="color:${C.signalDeep};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Your Lookup PIN</div>
          <div style="width:48px;height:2px;background:${C.signal};margin:0 0 18px 0;border-radius:1px;"></div>
          <div style="color:${C.ink};font-size:24px;font-weight:800;margin-bottom:4px;">Hi ${safeName}</div>
          <div style="color:${C.inkSec};font-size:14px;line-height:1.6;margin-bottom:28px;">
            Here's your PIN to look up your invoices on neonburro.com. Keep it somewhere safe.
          </div>

          <div style="background:${C.raised};border:1px solid ${C.line};border-radius:16px;padding:32px 20px;margin-bottom:24px;text-align:center;">
            <div style="color:${C.inkMuted};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Your PIN</div>
            <div style="color:${C.ink};font-size:42px;font-weight:800;font-family:'JetBrains Mono',monospace;letter-spacing:10px;">${safePin}</div>
          </div>

          <div style="text-align:center;margin:24px 0;">
            <a href="https://neonburro.com/account/lookup/" style="display:inline-block;background:${C.signal};color:${C.ink};text-decoration:none;padding:14px 32px;border-radius:100px;font-weight:800;font-size:14px;">Look Up My Invoices</a>
          </div>

          <div style="background:${C.raised};border:1px solid ${C.line};border-radius:10px;padding:14px 16px;margin-top:24px;">
            <div style="color:${C.bananaDeep};font-size:11px;font-weight:700;margin-bottom:4px;">Keep this private</div>
            <div style="color:${C.inkSec};font-size:11px;line-height:1.5;">
              Your PIN combined with your email lets anyone view your invoice history. Don't share this PIN with people you don't trust.
            </div>
          </div>

          <div style="margin-top:28px;padding-top:20px;border-top:1px solid ${C.line};text-align:center;">
            <div style="color:${C.inkMuted};font-size:11px;">
              Real people. Clear responses.<br>
              <a href="mailto:hello@neonburro.com" style="color:${C.signalDeep};text-decoration:none;">hello@neonburro.com</a> · (970) 973-8550
            </div>
            <div style="color:${C.inkFaint};font-size:10px;margin-top:10px;">
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
      return { statusCode: 400, body: JSON.stringify({ error: 'Token required' }) };
    }

    if (event.httpMethod === 'GET') {
      const { data: request } = await supabase
        .from('pin_requests')
        .select('*, clients(id, name, email, company, portal_pin, lookup_pin)')
        .eq('approval_token', token)
        .maybeSingle();

      if (!request) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Request not found or already processed' }) };
      }
      if (request.status !== 'pending') {
        return { statusCode: 410, body: JSON.stringify({ error: `This request has already been ${request.status}`, status: request.status }) };
      }
      if (new Date(request.token_expires_at) < new Date()) {
        await supabase.from('pin_requests').update({ status: 'expired' }).eq('id', request.id);
        return { statusCode: 410, body: JSON.stringify({ error: 'This request has expired' }) };
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

    if (event.httpMethod === 'POST') {
      const { action } = JSON.parse(event.body || '{}');
      if (!['approve', 'deny'].includes(action)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
      }

      const { data: request } = await supabase
        .from('pin_requests')
        .select('*, clients(id, name, email, portal_pin, lookup_pin)')
        .eq('approval_token', token)
        .maybeSingle();

      if (!request || request.status !== 'pending') {
        return { statusCode: 404, body: JSON.stringify({ error: 'Request not found or already processed' }) };
      }
      if (new Date(request.token_expires_at) < new Date()) {
        return { statusCode: 410, body: JSON.stringify({ error: 'This request has expired' }) };
      }

      if (action === 'deny') {
        await supabase.from('pin_requests')
          .update({ status: 'denied', approval_token: null, denial_reason: 'Denied by admin' })
          .eq('id', request.id);
        return { statusCode: 200, body: JSON.stringify({ success: true, action: 'denied' }) };
      }

      if (!request.clients) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No client record linked to this request' }) };
      }

      const pin = request.clients.portal_pin || request.clients.lookup_pin;
      if (!pin) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Client has no PIN set. Please generate one first.' }) };
      }

      const html = buildClientPinEmail({ clientName: request.clients.name, pin });

      await resend.emails.send({
        from: 'NeonBurro <hello@neonburro.com>',
        to: request.clients.email,
        subject: 'Your NeonBurro PIN',
        html,
      });

      await supabase.from('pin_requests')
        .update({ status: 'approved', approved_at: new Date().toISOString(), approval_token: null })
        .eq('id', request.id);

      return { statusCode: 200, body: JSON.stringify({ success: true, action: 'approved' }) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('approve-pin-request error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Something went wrong' }) };
  }
};
