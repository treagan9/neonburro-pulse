// netlify/functions/resend-invoice.js
// Handles two send types beyond the initial send:
//   - resend:    Re-fire the same email (uses stored rendered_html when
//                available, falls back to rebuilding from invoice_snapshot
//                so historical invoices that pre-date the rendered_html
//                column can still be resent)
//   - reminder:  Editorial nudge with custom subject + body
//
// Always logs to invoice_history with send_type so the editor can
// show a complete timeline of every send.
//
// 2026-04-27 (1): converted to ESM, imports shared invoiceEmailTemplate.
// 2026-04-27 (2): admin audit notifications on resend + reminder.
// 2026-04-27 (3): per-invoice CC list passed to Resend (current state).

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { buildInvoiceEmailHTML } from '../../src/lib/invoiceEmailTemplate.js';

const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_EMAIL = 'NeonBurro <hello@neonburro.com>';
const ADMIN_FROM = 'NeonBurro Pulse <notifications@neonburro.com>';
const ADMIN_TO = ['hello@neonburro.com'];

const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

// ---------- helpers ----------

const escapeHtml = (s) => String(s || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatCurrency = (n) => {
  const num = parseFloat(n || 0);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const getMST = () =>
  new Date().toLocaleString('en-US', {
    timeZone: 'America/Denver',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' MT';

const sanitizeCcList = (raw, primaryEmail) => {
  if (!Array.isArray(raw)) return [];
  const primary = String(primaryEmail || '').trim().toLowerCase();
  const seen = new Set();
  const out = [];
  for (const entry of raw) {
    const e = String(entry || '').trim().toLowerCase();
    if (!e) continue;
    if (e === primary) continue;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) continue;
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  return out;
};

const fetchAdminName = async (userId) => {
  if (!userId) return 'Pulse';
  const { data } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return 'Pulse';
  return data.display_name || data.username || 'Pulse';
};

const rebuildHtmlFromSnapshot = async ({ invoice, snapshot }) => {
  if (!snapshot) return null;

  let client = {
    name: snapshot.client_name || 'Client',
    email: snapshot.client_email || '',
    company: snapshot.client_company || null,
  };
  if (invoice.client_id) {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', invoice.client_id)
      .maybeSingle();
    if (data) client = data;
  }

  let project = null;
  if (invoice.project_id) {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', invoice.project_id)
      .maybeSingle();
    if (data) project = data;
  } else if (snapshot.project_name) {
    project = {
      name: snapshot.project_name,
      project_number: snapshot.project_number,
    };
  }

  const lineItems = (snapshot.line_items || []).map((item) => ({
    sprint_number: item.sprint_number,
    title: item.title,
    description: item.description,
    amount: item.amount,
    payment_mode: item.payment_mode,
    is_billable: true,
  }));

  return buildInvoiceEmailHTML({
    invoice,
    client,
    project,
    lineItems,
    invoiceDate: snapshot.invoice_date || new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
    payUrl: snapshot.pay_url || (invoice.pay_token
      ? `https://neonburro.com/pay/?token=${invoice.pay_token}`
      : 'https://neonburro.com/account/'),
  });
};

// ---------- client-facing reminder email ----------

const buildReminderEmail = ({
  recipientName,
  bodyText,
  invoiceNumber,
  amountDue,
  payUrl,
  adminName,
}) => {
  const safeName = escapeHtml(recipientName || 'there');
  const safeBody = escapeHtml(bodyText).replace(/\n/g, '<br>');
  const safeAdmin = escapeHtml(adminName || 'The NeonBurro Team');
  const safeNumber = escapeHtml(invoiceNumber);
  const safeAmount = formatCurrency(amountDue);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#0a0a0a;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 28px;">
          <div style="margin-bottom:24px;">
            <img src="https://pulse.neonburro.com/neon-burro-email-logo.png" alt="NeonBurro" width="44" height="44" style="border-radius:50%;display:block;" />
          </div>

          <div style="color:#FFE500;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">A gentle signal from NeonBurro</div>

          <div style="color:#ffffff;font-size:24px;font-weight:800;margin-bottom:6px;line-height:1.25;">Hi ${safeName},</div>

          <div style="color:#a0a0a0;font-size:15px;line-height:1.7;margin-bottom:28px;">${safeBody}</div>

          <table cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:12px;width:100%;margin-bottom:24px;">
            <tr>
              <td style="padding:18px 20px;">
                <div style="color:#737373;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Invoice</div>
                <div style="color:#ffffff;font-size:16px;font-weight:800;font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;">${safeNumber}</div>
              </td>
              <td style="padding:18px 20px;text-align:right;border-left:1px solid #1f1f1f;">
                <div style="color:#737373;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Due</div>
                <div style="color:#FFE500;font-size:16px;font-weight:800;font-family:'JetBrains Mono',monospace;">${safeAmount}</div>
              </td>
            </tr>
          </table>

          <a href="${payUrl}" style="display:block;background:#00E5E5;color:#0a0a0a;text-decoration:none;padding:16px 28px;border-radius:100px;font-weight:800;font-size:14px;text-align:center;letter-spacing:0.02em;">View &amp; Pay Invoice</a>

          <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1f1f1f;">
            <div style="color:#ffffff;font-size:14px;font-weight:700;margin-bottom:4px;">${safeAdmin}</div>
            <div style="color:#525252;font-size:12px;">
              <a href="https://neonburro.com/" style="color:#00E5E5;text-decoration:none;">neonburro.com</a> · (970) 973-8550
            </div>
          </div>
        </td></tr>
      </table>
      <div style="max-width:560px;margin-top:20px;color:#525252;font-size:11px;line-height:1.5;">
        Reply to this email if you have any questions about this invoice.
      </div>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
};

// ---------- admin audit email ----------

const buildAdminAuditEmail = ({
  action,
  invoice,
  client,
  recipientEmail,
  ccList,
  adminName,
  amountDue,
  reminderSubject,
  reminderBody,
  rebuiltFromSnapshot,
}) => {
  const safeNumber = escapeHtml(invoice.invoice_number);
  const safeClient = escapeHtml(client?.name || 'Client');
  const safeRecipient = escapeHtml(recipientEmail);
  const safeAdmin = escapeHtml(adminName);

  const accentColor = action === 'resend' ? '#00E5E5' : '#FFE500';
  const actionLabel = action === 'resend' ? 'Invoice Resent' : 'Reminder Sent';
  const actionSub = action === 'resend'
    ? `Same email re-delivered${rebuiltFromSnapshot ? ' (rebuilt from archived snapshot)' : ''}`
    : 'Editorial nudge dispatched';

  const ccBlock = ccList && ccList.length > 0
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #1f1f1f;border-radius:10px;margin-bottom:20px;">
        <tr><td style="padding:12px 16px;">
          <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">CC'd (${ccList.length})</div>
          <div style="color:#a0a0a0;font-size:12px;line-height:1.6;">${ccList.map(escapeHtml).join(' · ')}</div>
        </td></tr>
      </table>`
    : '';

  const reminderBlock = action === 'reminder'
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #1f1f1f;border-radius:10px;margin-bottom:20px;">
        <tr><td style="padding:14px 16px;">
          ${reminderSubject ? `
          <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Subject</div>
          <div style="color:#ffffff;font-size:13px;font-weight:600;margin-bottom:10px;">${escapeHtml(reminderSubject)}</div>
          ` : ''}
          <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Body</div>
          <div style="color:#a0a0a0;font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(reminderBody || '')}</div>
        </td></tr>
      </table>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${actionLabel}</title></head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:28px 12px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0A0A0A;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:#141414;border-bottom:2px solid ${accentColor};padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="color:${accentColor};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">${actionLabel}</div>
                  <div style="color:#ffffff;font-size:22px;font-weight:800;font-family:'JetBrains Mono',monospace;">${safeNumber}</div>
                  <div style="color:#737373;font-size:11px;margin-top:2px;">${getMST()} · by ${safeAdmin}</div>
                </td>
                <td style="text-align:right;vertical-align:top;">
                  <div style="background:${accentColor};color:#0A0A0A;font-size:11px;font-weight:800;padding:5px 14px;border-radius:100px;display:inline-block;">${formatCurrency(amountDue)} due</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 8px 32px;">
            <div style="color:#a0a0a0;font-size:13px;line-height:1.6;margin-bottom:20px;">${actionSub}.</div>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:10px;margin-bottom:20px;">
              <tr><td style="padding:14px 16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Client</div>
                      <div style="color:#ffffff;font-size:14px;font-weight:700;">${safeClient}</div>
                      <div style="color:#a0a0a0;font-size:12px;">${safeRecipient}</div>
                    </td>
                    <td style="text-align:right;">
                      <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Sent By</div>
                      <div style="color:#ffffff;font-size:14px;font-weight:700;">${safeAdmin}</div>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            ${ccBlock}
            ${reminderBlock}

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="text-align:center;padding:8px 0 0 0;">
                <a href="https://pulse.neonburro.com/invoicing/?invoice=${invoice.id}" style="display:inline-block;background:${accentColor};color:#0A0A0A;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:800;font-size:13px;">View in Pulse</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 32px;border-top:1px solid #1f1f1f;text-align:center;">
            <div style="color:#737373;font-size:11px;">Pulse · ${getMST()}</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ---------- resend handler ----------

const handleResend = async ({ invoiceId, userId }) => {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(name, email, company)')
    .eq('id', invoiceId)
    .maybeSingle();

  if (!invoice) throw new Error('Invoice not found');
  if (invoice.cancelled_at) throw new Error('Cannot resend a cancelled invoice');
  if (!invoice.clients?.email) throw new Error('Client has no email on file');

  const { data: lastHistory } = await supabase
    .from('invoice_history')
    .select('rendered_html, invoice_snapshot, sent_to')
    .eq('invoice_id', invoiceId)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastHistory) {
    throw new Error('No prior send found for this invoice. Use the Send button instead.');
  }

  let html = lastHistory.rendered_html;
  const rebuiltFromSnapshot = !html;
  if (!html) {
    html = await rebuildHtmlFromSnapshot({
      invoice,
      snapshot: lastHistory.invoice_snapshot,
    });
  }

  if (!html) {
    throw new Error(
      'Could not rebuild this invoice email. The original snapshot is missing. Use the Send button to generate a fresh email.'
    );
  }

  const recipientEmail = lastHistory.sent_to || invoice.clients.email;
  // CC list comes from CURRENT invoice state, not the historical snapshot —
  // so if you added CCs after the original send, the resend includes them.
  const ccList = sanitizeCcList(invoice.cc_emails, recipientEmail);

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    cc: ccList.length > 0 ? ccList : undefined,
    reply_to: 'hello@neonburro.com',
    subject: `Invoice ${invoice.invoice_number} from NeonBurro (resent)`,
    html,
  });

  if (result.error) throw new Error(result.error.message || 'Resend failed');

  await supabase.from('invoice_history').insert({
    invoice_id: invoiceId,
    sent_at: new Date().toISOString(),
    sent_to: recipientEmail,
    sent_by: userId || null,
    send_type: 'resend',
    rendered_html: html,
    invoice_snapshot: lastHistory.invoice_snapshot,
    notes: ccList.length > 0 ? `cc: ${ccList.join(', ')}` : null,
  });

  await supabase.from('activity_log').insert({
    user_id: userId || null,
    action: 'invoice_sent',
    entity_type: 'invoice',
    entity_id: invoiceId,
    metadata: {
      invoice_number: invoice.invoice_number,
      client_name: invoice.clients?.name,
      send_type: 'resend',
      recipient_email: recipientEmail,
      cc_count: ccList.length,
      cc_emails: ccList,
      rebuilt_from_snapshot: rebuiltFromSnapshot,
    },
  });

  const adminName = await fetchAdminName(userId);
  const amountDue = parseFloat(invoice.total || 0) - parseFloat(invoice.total_paid || 0);
  const adminHtml = buildAdminAuditEmail({
    action: 'resend',
    invoice,
    client: invoice.clients,
    recipientEmail,
    ccList,
    adminName,
    amountDue,
    rebuiltFromSnapshot,
  });
  resend.emails.send({
    from: ADMIN_FROM,
    to: ADMIN_TO,
    reply_to: invoice.clients?.email || 'hello@neonburro.com',
    subject: `Invoice Resent: ${invoice.invoice_number} - ${invoice.clients?.name || 'Client'}${ccList.length > 0 ? ` (+${ccList.length} cc)` : ''}`,
    html: adminHtml,
  }).catch((err) => console.error('Admin resend notification failed:', err));

  return { success: true, recipient: recipientEmail, send_type: 'resend', ccCount: ccList.length };
};

// ---------- reminder handler ----------

const handleReminder = async ({ invoiceId, subject, body, userId }) => {
  if (!body || !body.trim()) throw new Error('Reminder body is required');

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(name, email, company)')
    .eq('id', invoiceId)
    .maybeSingle();

  if (!invoice) throw new Error('Invoice not found');
  if (invoice.cancelled_at) throw new Error('Cannot send reminder for a cancelled invoice');
  if (invoice.status === 'paid') throw new Error('Invoice is already paid');
  if (!invoice.clients?.email) throw new Error('Client has no email on file');

  const adminName = await fetchAdminName(userId);
  const ccList = sanitizeCcList(invoice.cc_emails, invoice.clients.email);

  const amountDue =
    parseFloat(invoice.total || 0) - parseFloat(invoice.total_paid || 0);

  const payUrl = invoice.pay_token
    ? `https://neonburro.com/pay/?token=${invoice.pay_token}`
    : 'https://neonburro.com/account/';

  const html = buildReminderEmail({
    recipientName: invoice.clients.name,
    bodyText: body,
    invoiceNumber: invoice.invoice_number,
    amountDue,
    payUrl,
    adminName,
  });

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: invoice.clients.email,
    cc: ccList.length > 0 ? ccList : undefined,
    reply_to: 'hello@neonburro.com',
    subject: subject || `A gentle reminder about ${invoice.invoice_number}`,
    html,
  });

  if (result.error) throw new Error(result.error.message || 'Reminder send failed');

  await supabase.from('invoice_history').insert({
    invoice_id: invoiceId,
    sent_at: new Date().toISOString(),
    sent_to: invoice.clients.email,
    sent_by: userId || null,
    send_type: 'reminder',
    reminder_subject: subject || null,
    reminder_body: body,
    rendered_html: html,
    notes: ccList.length > 0 ? `cc: ${ccList.join(', ')}` : null,
  });

  await supabase.from('activity_log').insert({
    user_id: userId || null,
    action: 'invoice_sent',
    entity_type: 'invoice',
    entity_id: invoiceId,
    metadata: {
      invoice_number: invoice.invoice_number,
      client_name: invoice.clients?.name,
      send_type: 'reminder',
      recipient_email: invoice.clients.email,
      cc_count: ccList.length,
      cc_emails: ccList,
      subject,
    },
  });

  const adminHtml = buildAdminAuditEmail({
    action: 'reminder',
    invoice,
    client: invoice.clients,
    recipientEmail: invoice.clients.email,
    ccList,
    adminName,
    amountDue,
    reminderSubject: subject,
    reminderBody: body,
  });
  resend.emails.send({
    from: ADMIN_FROM,
    to: ADMIN_TO,
    reply_to: invoice.clients?.email || 'hello@neonburro.com',
    subject: `Reminder Sent: ${invoice.invoice_number} - ${invoice.clients?.name || 'Client'}${ccList.length > 0 ? ` (+${ccList.length} cc)` : ''}`,
    html: adminHtml,
  }).catch((err) => console.error('Admin reminder notification failed:', err));

  return { success: true, recipient: invoice.clients.email, send_type: 'reminder', ccCount: ccList.length };
};

// ---------- handler ----------

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { invoiceId, action, subject, body, userId } = JSON.parse(event.body || '{}');

    if (!invoiceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'invoiceId required' }) };
    }
    if (!['resend', 'reminder'].includes(action)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'action must be "resend" or "reminder"' }) };
    }

    const result = action === 'resend'
      ? await handleResend({ invoiceId, userId })
      : await handleReminder({ invoiceId, subject, body, userId });

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error('resend-invoice error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Server error' }) };
  }
};