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
// 2026-04-27: converted to ESM to match repo standard and to import
// the shared invoiceEmailTemplate (which is ESM-only).

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { buildInvoiceEmailHTML } from '../../src/lib/invoiceEmailTemplate.js';

const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_EMAIL = 'NeonBurro <hello@neonburro.com>';

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

// Rebuild the original client email from a stored invoice_snapshot.
// Used when rendered_html is missing (invoices sent before that column
// was being populated). The result is logically equivalent to the
// original send: same line items, same totals, same pay link.
const rebuildHtmlFromSnapshot = async ({ invoice, snapshot }) => {
  if (!snapshot) return null;

  // Refetch client + project to feed the template — the snapshot has
  // names but the template expects full records.
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

// ============================================================
// REMINDER EMAIL — editorial NeonBurro voice
// ============================================================
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

// ============================================================
// RESEND HANDLER
// Tries rendered_html first; falls back to rebuilding from
// invoice_snapshot so all historical invoices remain resendable.
// ============================================================
const handleResend = async ({ invoiceId, userId }) => {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(name, email, company)')
    .eq('id', invoiceId)
    .maybeSingle();

  if (!invoice) throw new Error('Invoice not found');
  if (invoice.cancelled_at) throw new Error('Cannot resend a cancelled invoice');
  if (!invoice.clients?.email) throw new Error('Client has no email on file');

  // Get the most recent stored history row
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

  // Prefer the stored HTML for byte-identical resend; fall back to
  // rebuilding from the JSON snapshot if rendered_html was never written.
  let html = lastHistory.rendered_html;
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

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
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
      rebuilt_from_snapshot: !lastHistory.rendered_html,
    },
  });

  return { success: true, recipient: recipientEmail, send_type: 'resend' };
};

// ============================================================
// REMINDER HANDLER — custom subject + body, fresh nudge email
// ============================================================
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

  // Pull admin display name for signature
  let adminName = 'The NeonBurro Team';
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', userId)
      .maybeSingle();
    if (profile) adminName = profile.display_name || profile.username || adminName;
  }

  const amountDue =
    parseFloat(invoice.total || 0) - parseFloat(invoice.total_paid || 0);

  // Reuse last pay token if one exists; reminders should keep the original link working
  const payUrl = invoice.pay_token
    ? `https://neonburro.com/pay/${invoice.pay_token}/`
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
      subject,
    },
  });

  return { success: true, recipient: invoice.clients.email, send_type: 'reminder' };
};

// ============================================================
// HANDLER
// ============================================================
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