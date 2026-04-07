// netlify/functions/send-invoice.js
// NeonBurro Pulse - Invoice Email Sender
// Generates pay_token for magic link client access
// Dark NeonBurro email theme with cyan/banana accents
// Client + admin emails via Resend
// Invoice snapshots + activity logging

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HERO_IMG = 'https://pulse.neonburro.com/cimarron-range-neon.png';
const LOGO_IMG = 'https://pulse.neonburro.com/neon-burro-email-logo.png';
const SMS_BURRO = 'https://pulse.neonburro.com/main-sms-burro.webp';
const FROM_EMAIL = 'NeonBurro <invoices@neonburro.com>';
const ADMIN_FROM = 'NeonBurro Pulse <notifications@neonburro.com>';
const ADMIN_TO = ['hello@neonburro.com'];
const PAY_BASE = 'https://neonburro.com/pay';

const currency = (val) =>
  `$${parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const getMST = () => new Date().toLocaleString('en-US', {
  timeZone: 'America/Denver',
  month: 'short', day: 'numeric', year: 'numeric',
  hour: 'numeric', minute: '2-digit', hour12: true,
}) + ' MT';

const getDueNow = (item) => {
  const amount = parseFloat(item.amount || 0);
  const paid = parseFloat(item.payment_amount || 0);
  const mode = item.payment_mode || 'approve_only';
  if (mode === 'pay_full') return Math.max(0, amount - paid);
  if (mode === 'deposit_50') return Math.max(0, (amount * 0.5) - paid);
  return 0;
};

const getFundingLabel = (mode) => {
  if (mode === 'deposit_50') return '50% to Start';
  if (mode === 'pay_full') return 'Fund in Full';
  return 'Confirm Scope';
};

const generatePayToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Supabase REST helpers
const sbFetch = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${res.status} ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const sbGet = (table, query) => sbFetch(`${table}?${query}`);
const sbUpdate = (table, id, data) => sbFetch(`${table}?id=eq.${id}`, {
  method: 'PATCH',
  body: JSON.stringify(data),
});
const sbInsert = (table, data) => sbFetch(table, {
  method: 'POST',
  body: JSON.stringify(data),
  prefer: 'return=minimal',
});

const sendEmail = async (from, to, subject, html, replyTo) => {
  const payload = { from, to: Array.isArray(to) ? to : [to], subject, html };
  if (replyTo) payload.reply_to = replyTo;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Email send failed');
  return result;
};

const emailShell = (content) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 8px !important; }
      .outer { border-radius: 0 !important; width: 100% !important; }
      .body-pad { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:28px 12px;">
    <tr>
      <td align="center">
        <table class="outer" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#0A0A0A;border-radius:16px;overflow:hidden;border:1px solid #1f1f1f;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const buildClientEmail = ({ invoice, client, project, lineItems, totalAmount, totalDueNow, invoiceDate, payUrl }) => {
  const itemsHTML = lineItems.map((item, idx) => {
    const amount = parseFloat(item.amount || 0);
    const dueNow = getDueNow(item);
    const mode = item.payment_mode || 'approve_only';
    const modeColor = mode === 'pay_full' ? '#39FF14' : mode === 'deposit_50' ? '#FFE500' : '#737373';
    const modeBg = mode === 'pay_full' ? 'rgba(57,255,20,0.1)' : mode === 'deposit_50' ? 'rgba(255,229,0,0.1)' : 'rgba(128,128,128,0.1)';

    return `
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #1f1f1f;">
          <div style="color:#737373;font-size:10px;font-family:monospace;font-weight:700;margin-bottom:4px;">${item.sprint_number || `SPRINT ${String(idx + 1).padStart(2, '0')}`}</div>
          <div style="color:#ffffff;font-weight:700;font-size:15px;line-height:1.3;margin-bottom:4px;">${item.title}</div>
          ${item.description ? `<div style="color:#a0a0a0;font-size:13px;line-height:1.6;margin-bottom:8px;">${item.description}</div>` : ''}
          <div style="display:inline-block;background:${modeBg};color:${modeColor};font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;border:1px solid ${modeColor}40;margin-bottom:10px;">${getFundingLabel(mode)}</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1f1f1f;padding-top:8px;">
            <tr>
              <td style="padding:3px 0;color:#737373;font-size:11px;">Sprint value</td>
              <td style="padding:3px 0;text-align:right;color:#ffffff;font-weight:700;font-family:monospace;font-size:14px;">${currency(amount)}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;color:#737373;font-size:11px;">To push forward</td>
              <td style="padding:3px 0;text-align:right;">
                ${dueNow > 0
                  ? `<span style="color:#FFE500;font-weight:700;font-family:monospace;font-size:14px;">${currency(dueNow)}</span>`
                  : `<span style="color:#737373;font-size:10px;font-weight:600;">Scope confirmed</span>`}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('');

  return emailShell(`
    <tr><td style="line-height:0;"><img src="${HERO_IMG}" alt="NeonBurro" width="600" style="display:block;width:100%;height:auto;max-height:200px;object-fit:cover;" /></td></tr>
    <tr>
      <td class="body-pad" style="padding:32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td><img src="${LOGO_IMG}" alt="NeonBurro" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:50%;" /></td>
            <td style="text-align:right;vertical-align:bottom;"><div style="color:#00E5E5;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Invoice</div></td>
          </tr>
        </table>
        <div style="width:48px;height:2px;background:#00E5E5;margin:0 0 18px 0;border-radius:1px;"></div>
        <h1 style="margin:0 0 6px 0;color:#ffffff;font-size:28px;font-weight:800;line-height:1.2;letter-spacing:-0.02em;">${invoice.invoice_number}</h1>
        <div style="color:#737373;font-size:13px;margin-bottom:6px;">${invoiceDate}</div>
        <div style="color:#525252;font-size:11px;margin-bottom:24px;">Issued by <span style="color:#a0a0a0;font-weight:600;">The Burroship, LLC</span></div>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <tr><td style="padding:18px 20px;">
            <div style="margin-bottom:12px;">
              <div style="color:#737373;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Prepared For</div>
              <div style="color:#ffffff;font-size:16px;font-weight:700;">${client.name}</div>
              ${client.email ? `<div style="color:#a0a0a0;font-size:13px;margin-top:2px;">${client.email}</div>` : ''}
            </div>
            ${project ? `
            <div>
              <div style="color:#737373;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Project</div>
              <div style="color:#ffffff;font-size:14px;font-weight:600;">${project.name}</div>
              ${project.project_number ? `<div style="color:#00E5E5;font-size:12px;font-family:monospace;font-weight:600;margin-top:2px;">${project.project_number}</div>` : ''}
            </div>` : ''}
          </td></tr>
        </table>

        <div style="color:#00E5E5;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Sprints</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <tbody>${itemsHTML}</tbody>
          <tr>
            <td style="padding:18px 20px;background:#141414;border-top:2px solid #1f1f1f;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#a0a0a0;font-size:13px;font-weight:600;">Total Project Value</td>
                  <td style="text-align:right;color:#ffffff;font-size:18px;font-weight:800;font-family:monospace;">${currency(totalAmount)}</td>
                </tr>
                ${totalDueNow > 0 ? `
                <tr>
                  <td style="padding-top:6px;color:#FFE500;font-size:13px;font-weight:700;">To Push Forward</td>
                  <td style="padding-top:6px;text-align:right;color:#FFE500;font-size:16px;font-weight:800;font-family:monospace;">${currency(totalDueNow)}</td>
                </tr>` : ''}
              </table>
            </td>
          </tr>
        </table>

        ${totalDueNow > 0 ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#141414;border:1px solid #1f1f1f;border-radius:12px;padding:28px 20px;text-align:center;">
            <div style="color:#737373;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:10px;">To Push Forward</div>
            <div style="color:#FFE500;font-size:40px;font-weight:800;font-family:monospace;line-height:1;margin-bottom:14px;">${currency(totalDueNow)}</div>
            <div style="color:#737373;font-size:12px;margin-bottom:4px;">ACH bank transfer, credit card, Apple Pay, Google Pay or check</div>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="text-align:center;">
            <a href="${payUrl}" style="display:inline-block;background:#00E5E5;color:#0A0A0A;text-decoration:none;padding:16px 44px;border-radius:100px;font-weight:800;font-size:15px;">Approve and Push Forward</a>
            <div style="margin-top:10px;color:#737373;font-size:11px;">Secure payment via Stripe</div>
          </td></tr>
        </table>

        <!-- Mail a Check option -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td style="background:#0A0A0A;border:1px solid #1f1f1f;border-radius:12px;padding:20px 24px;">
            <div style="color:#FFE500;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Prefer to mail a check?</div>
            <div style="color:#a0a0a0;font-size:13px;line-height:1.6;margin-bottom:12px;">
              Make checks payable to <span style="color:#ffffff;font-weight:700;">The Burroship, LLC</span> and include invoice <span style="color:#00E5E5;font-family:monospace;font-weight:600;">${invoice.invoice_number}</span> in the memo.
            </div>
            <div style="background:#141414;border:1px solid #1f1f1f;border-radius:8px;padding:14px 16px;">
              <div style="color:#ffffff;font-size:13px;font-weight:700;margin-bottom:2px;">The Burroship, LLC</div>
              <div style="color:#a0a0a0;font-size:13px;">P.O. Box 2111</div>
              <div style="color:#a0a0a0;font-size:13px;">Ridgway, CO 81432</div>
            </div>
          </td></tr>
        </table>` : `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td style="background:#141414;border:1px solid #1f1f1f;border-radius:12px;padding:24px;text-align:center;">
            <div style="color:#ffffff;font-size:16px;font-weight:700;margin-bottom:4px;">Scope Confirmed</div>
            <div style="color:#737373;font-size:13px;">No payment due at this time</div>
          </td></tr>
        </table>`}

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:top;">
                <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Questions?</div>
                <div style="color:#ffffff;font-size:14px;font-weight:700;margin-bottom:2px;">NeonBurro</div>
                <div style="color:#737373;font-size:12px;">Ridgway, Colorado</div>
              </td>
              <td style="vertical-align:top;text-align:right;">
                <img src="${SMS_BURRO}" alt="NeonBurro" width="60" style="display:block;margin-left:auto;border-radius:8px;" />
              </td>
            </tr></table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              <tr>
                <td style="padding:4px 0;color:#737373;font-size:12px;border-top:1px solid #1f1f1f;">Email</td>
                <td style="padding:4px 0;text-align:right;border-top:1px solid #1f1f1f;"><a href="mailto:hello@neonburro.com" style="color:#00E5E5;font-size:12px;font-weight:600;text-decoration:none;">hello@neonburro.com</a></td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#737373;font-size:12px;border-top:1px solid #1f1f1f;">Phone</td>
                <td style="padding:4px 0;text-align:right;border-top:1px solid #1f1f1f;"><a href="tel:9709738550" style="color:#00E5E5;font-size:12px;font-weight:600;font-family:monospace;text-decoration:none;">(970) 973-8550</a></td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px;border-top:1px solid #1f1f1f;text-align:center;">
        <div style="color:#737373;font-size:11px;">Real people. Clear responses.</div>
        <div style="color:#525252;font-size:10px;margin-top:6px;">Neon Burro · Powered by The Burroship, LLC</div>
        <div style="margin-top:4px;"><a href="https://neonburro.com/" style="color:#00E5E5;font-size:11px;text-decoration:none;font-weight:600;">neonburro.com</a></div>
      </td>
    </tr>
  `);
};

const buildAdminEmail = ({ invoice, client, project, lineItems, totalAmount, totalDueNow }) => {
  const itemsHTML = lineItems.map((item) => {
    const amount = parseFloat(item.amount || 0);
    const mode = item.payment_mode || 'approve_only';
    const modeLabel = mode === 'pay_full' ? 'FULL' : mode === 'deposit_50' ? '50%' : 'CONFIRM';
    const modeColor = mode === 'pay_full' ? '#39FF14' : mode === 'deposit_50' ? '#FFE500' : '#737373';
    return `
      <tr style="border-bottom:1px solid #1f1f1f;">
        <td style="padding:10px 14px;color:#ffffff;font-size:13px;font-weight:700;vertical-align:top;">${item.title}</td>
        <td style="padding:10px 14px;text-align:center;vertical-align:top;"><span style="color:${modeColor};font-size:10px;font-weight:700;background:${modeColor}18;padding:2px 8px;border-radius:100px;">${modeLabel}</span></td>
        <td style="padding:10px 14px;text-align:right;color:#ffffff;font-size:13px;font-weight:700;font-family:monospace;vertical-align:top;">${currency(amount)}</td>
      </tr>`;
  }).join('');

  return emailShell(`
    <tr><td style="line-height:0;"><img src="${HERO_IMG}" alt="NeonBurro" width="600" style="display:block;width:100%;height:auto;max-height:160px;object-fit:cover;" /></td></tr>
    <tr>
      <td style="background:#141414;border-bottom:2px solid #00E5E5;padding:20px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>
            <div style="color:#00E5E5;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Invoice Sent</div>
            <div style="color:#ffffff;font-size:22px;font-weight:800;font-family:monospace;">${invoice.invoice_number}</div>
            <div style="color:#737373;font-size:11px;margin-top:2px;">${getMST()}</div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            ${totalDueNow > 0
              ? `<div style="background:#FFE500;color:#0A0A0A;font-size:11px;font-weight:800;padding:5px 14px;border-radius:100px;">${currency(totalDueNow)} due</div>`
              : `<div style="background:#1f1f1f;color:#737373;font-size:11px;font-weight:700;padding:5px 14px;border-radius:100px;">Scope only</div>`}
          </td>
        </tr></table>
      </td>
    </tr>
    <tr>
      <td class="body-pad" style="padding:28px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:14px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Client</div>
                <div style="color:#ffffff;font-size:14px;font-weight:700;">${client.name}</div>
                <div style="color:#a0a0a0;font-size:12px;">${client.email || ''}</div>
              </td>
              <td style="text-align:right;">
                <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Project</div>
                <div style="color:#ffffff;font-size:14px;font-weight:700;">${project?.name || 'No project'}</div>
                ${project?.project_number ? `<div style="color:#00E5E5;font-size:12px;font-family:monospace;">${project.project_number}</div>` : ''}
              </td>
            </tr></table>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1f1f1f;border-radius:10px;overflow:hidden;margin-bottom:20px;">
          <thead><tr style="background:#141414;border-bottom:1px solid #1f1f1f;">
            <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:700;color:#737373;text-transform:uppercase;">Item</th>
            <th style="padding:8px 14px;text-align:center;font-size:10px;font-weight:700;color:#737373;text-transform:uppercase;">Funding</th>
            <th style="padding:8px 14px;text-align:right;font-size:10px;font-weight:700;color:#737373;text-transform:uppercase;">Amount</th>
          </tr></thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:14px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="color:#a0a0a0;font-size:12px;padding:3px 0;">Total</td><td style="text-align:right;color:#ffffff;font-size:16px;font-weight:800;font-family:monospace;padding:3px 0;">${currency(totalAmount)}</td></tr>
              <tr style="border-top:1px solid #1f1f1f;"><td style="color:#FFE500;font-size:13px;font-weight:700;padding:6px 0 0;">Due Now</td><td style="text-align:right;color:#FFE500;font-size:18px;font-weight:800;font-family:monospace;padding:6px 0 0;">${totalDueNow > 0 ? currency(totalDueNow) : '$0'}</td></tr>
            </table>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="text-align:center;">
          <a href="https://pulse.neonburro.com/invoicing/" style="display:inline-block;background:#00E5E5;color:#0A0A0A;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:800;font-size:13px;">View in Pulse</a>
        </td></tr></table>
      </td>
    </tr>
    <tr><td style="padding:14px 40px;border-top:1px solid #1f1f1f;text-align:center;">
      <div style="color:#737373;font-size:11px;">NeonBurro Pulse · ${getMST()}</div>
    </td></tr>
  `);
};

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  if (!RESEND_API_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Email not configured' }) };
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database not configured' }) };

  try {
    const { invoiceId } = JSON.parse(event.body);
    if (!invoiceId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invoice ID required' }) };

    // Fetch invoice
    const invoices = await sbGet('invoices', `id=eq.${invoiceId}&select=*`);
    const invoice = invoices?.[0];
    if (!invoice) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Invoice not found' }) };

    // Fetch line items
    const lineItems = await sbGet('invoice_items', `invoice_id=eq.${invoiceId}&order=sort_order`);

    // Fetch client
    let client = { name: 'Client', email: '' };
    if (invoice.client_id) {
      const clients = await sbGet('clients', `id=eq.${invoice.client_id}&select=*`);
      if (clients?.[0]) client = clients[0];
    }

    // Fetch project
    let project = null;
    if (invoice.project_id) {
      const projects = await sbGet('projects', `id=eq.${invoice.project_id}&select=*`);
      if (projects?.[0]) project = projects[0];
    }

    if (!client.email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Client has no email address' }) };
    }

    const items = lineItems || [];
    const totalAmount = items.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const totalDueNow = items.reduce((sum, i) => sum + getDueNow(i), 0);
    const invoiceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Generate pay token for magic link
    const payToken = generatePayToken();
    const payUrl = `${PAY_BASE}/?token=${payToken}`;

    const now = new Date().toISOString();

    // Update invoice with pay_token and status
    await sbUpdate('invoices', invoiceId, {
      status: 'sent',
      sent_at: now,
      total: totalAmount,
      pay_token: payToken,
      updated_at: now,
    });

    // Send client email
    const clientHtml = buildClientEmail({ invoice, client, project, lineItems: items, totalAmount, totalDueNow, invoiceDate, payUrl });
    const clientResult = await sendEmail(
      FROM_EMAIL,
      [client.email],
      `Invoice ${invoice.invoice_number} - ${project?.name || client.name}`,
      clientHtml
    );

    // Save snapshot
    const snapshot = {
      invoice_number: invoice.invoice_number,
      invoice_date: invoiceDate,
      client_name: client.name,
      client_email: client.email,
      project_name: project?.name,
      project_number: project?.project_number,
      line_items: items.map((item) => ({
        sprint_number: item.sprint_number,
        title: item.title,
        description: item.description,
        amount: parseFloat(item.amount || 0),
        payment_mode: item.payment_mode,
        due_now: getDueNow(item),
      })),
      totals: { total: totalAmount, due_now: totalDueNow },
      pay_url: payUrl,
    };

    await sbInsert('invoice_history', {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      sent_at: now,
      sent_to: client.email,
      amount: totalAmount,
      method: 'email',
      invoice_snapshot: snapshot,
      notes: `Sent via Resend (ID: ${clientResult.id})`,
    });

    // Activity log
    await sbInsert('activity_log', {
      action: 'invoice_sent',
      entity_type: 'invoice',
      entity_id: invoice.id,
      metadata: {
        invoice_number: invoice.invoice_number,
        client_name: client.name,
        total: totalAmount,
        due_now: totalDueNow,
        email_id: clientResult.id,
      },
      created_at: now,
    });

    // Admin notification (fire and forget)
    const adminHtml = buildAdminEmail({ invoice, client, project, lineItems: items, totalAmount, totalDueNow });
    sendEmail(
      ADMIN_FROM,
      ADMIN_TO,
      `Invoice Sent: ${invoice.invoice_number} - ${client.name}`,
      adminHtml,
      client.email
    ).catch((err) => console.error('Admin email failed:', err));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        emailId: clientResult.id,
        invoiceNumber: invoice.invoice_number,
        totalAmount,
        totalDueNow,
        payUrl,
      }),
    };

  } catch (error) {
    console.error('send-invoice error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};