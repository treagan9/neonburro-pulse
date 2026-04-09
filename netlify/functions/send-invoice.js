// netlify/functions/send-invoice.js
// NeonBurro Pulse - Invoice Email Sender
// Uses the shared template at src/lib/invoiceEmailTemplate.js for client email
// Admin notification email is defined inline below (much shorter than client email)

import { buildInvoiceEmailHTML, getDueNow } from '../../src/lib/invoiceEmailTemplate.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_EMAIL = 'NeonBurro <invoices@neonburro.com>';
const ADMIN_FROM = 'NeonBurro Pulse <notifications@neonburro.com>';
const ADMIN_TO = ['hello@neonburro.com'];
const PAY_BASE = 'https://neonburro.com/pay';

// ============================================================
// HELPERS
// ============================================================

const currency = (val) =>
  `$${parseFloat(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

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

const generatePayToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// ============================================================
// SUPABASE REST HELPERS
// ============================================================

const sbFetch = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation',
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
const sbUpdate = (table, id, data) =>
  sbFetch(`${table}?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
const sbInsert = (table, data) =>
  sbFetch(table, {
    method: 'POST',
    body: JSON.stringify(data),
    prefer: 'return=minimal',
  });

// ============================================================
// EMAIL SENDING
// ============================================================

const sendEmail = async (from, to, subject, html, replyTo) => {
  const payload = { from, to: Array.isArray(to) ? to : [to], subject, html };
  if (replyTo) payload.reply_to = replyTo;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Email send failed');
  return result;
};

// ============================================================
// ADMIN NOTIFICATION EMAIL (short, for the team)
// ============================================================

const buildAdminEmail = ({ invoice, client, project, lineItems, totalAmount, totalDueNow }) => {
  const itemsHTML = lineItems
    .map((item) => {
      const amount = parseFloat(item.amount || 0);
      const mode = item.payment_mode || 'approve_only';
      const modeLabel = mode === 'pay_full' ? 'FULL' : mode === 'deposit_50' ? '50%' : 'CONFIRM';
      const modeColor = mode === 'pay_full' ? '#39FF14' : mode === 'deposit_50' ? '#FFE500' : '#737373';
      return `
        <tr style="border-bottom:1px solid #1f1f1f;">
          <td style="padding:10px 14px;color:#ffffff;font-size:13px;font-weight:700;vertical-align:top;">${item.title || 'Untitled'}</td>
          <td style="padding:10px 14px;text-align:center;vertical-align:top;"><span style="color:${modeColor};font-size:10px;font-weight:700;background:${modeColor}18;padding:2px 8px;border-radius:100px;">${modeLabel}</span></td>
          <td style="padding:10px 14px;text-align:right;color:#ffffff;font-size:13px;font-weight:700;font-family:'JetBrains Mono',monospace;vertical-align:top;">${currency(amount)}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice Sent</title></head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:28px 12px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0A0A0A;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:#141414;border-bottom:2px solid #00E5E5;padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="color:#00E5E5;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Invoice Sent</div>
                  <div style="color:#ffffff;font-size:22px;font-weight:800;font-family:'JetBrains Mono',monospace;">${invoice.invoice_number}</div>
                  <div style="color:#737373;font-size:11px;margin-top:2px;">${getMST()}</div>
                </td>
                <td style="text-align:right;vertical-align:top;">
                  ${
                    totalDueNow > 0
                      ? `<div style="background:#FFE500;color:#0A0A0A;font-size:11px;font-weight:800;padding:5px 14px;border-radius:100px;display:inline-block;">${currency(totalDueNow)} due</div>`
                      : `<div style="background:#1f1f1f;color:#737373;font-size:11px;font-weight:700;padding:5px 14px;border-radius:100px;display:inline-block;">Scope only</div>`
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:10px;margin-bottom:20px;">
              <tr><td style="padding:14px 16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Client</div>
                      <div style="color:#ffffff;font-size:14px;font-weight:700;">${client.name}</div>
                      <div style="color:#a0a0a0;font-size:12px;">${client.email || ''}</div>
                    </td>
                    <td style="text-align:right;">
                      <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Project</div>
                      <div style="color:#ffffff;font-size:14px;font-weight:700;">${project?.name || 'No project'}</div>
                      ${project?.project_number ? `<div style="color:#00E5E5;font-size:12px;font-family:'JetBrains Mono',monospace;">${project.project_number}</div>` : ''}
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1f1f1f;border-radius:10px;overflow:hidden;margin-bottom:20px;">
              <thead>
                <tr style="background:#141414;border-bottom:1px solid #1f1f1f;">
                  <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:700;color:#737373;text-transform:uppercase;">Item</th>
                  <th style="padding:8px 14px;text-align:center;font-size:10px;font-weight:700;color:#737373;text-transform:uppercase;">Funding</th>
                  <th style="padding:8px 14px;text-align:right;font-size:10px;font-weight:700;color:#737373;text-transform:uppercase;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsHTML}</tbody>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:10px;margin-bottom:20px;">
              <tr><td style="padding:14px 16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#a0a0a0;font-size:12px;padding:3px 0;">Total</td>
                    <td style="text-align:right;color:#ffffff;font-size:16px;font-weight:800;font-family:'JetBrains Mono',monospace;padding:3px 0;">${currency(totalAmount)}</td>
                  </tr>
                  <tr style="border-top:1px solid #1f1f1f;">
                    <td style="color:#FFE500;font-size:13px;font-weight:700;padding:6px 0 0;">Due Now</td>
                    <td style="text-align:right;color:#FFE500;font-size:18px;font-weight:800;font-family:'JetBrains Mono',monospace;padding:6px 0 0;">${totalDueNow > 0 ? currency(totalDueNow) : '$0'}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="text-align:center;">
                <a href="https://pulse.neonburro.com/invoicing/" style="display:inline-block;background:#00E5E5;color:#0A0A0A;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:800;font-size:13px;">View in Pulse</a>
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

// ============================================================
// HANDLER
// ============================================================

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!RESEND_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Email not configured' }) };
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database not configured' }) };
  }

  try {
    const { invoiceId } = JSON.parse(event.body);
    if (!invoiceId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invoice ID required' }) };
    }

    // Fetch invoice
    const invoices = await sbGet('invoices', `id=eq.${invoiceId}&select=*`);
    const invoice = invoices?.[0];
    if (!invoice) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Invoice not found' }) };
    }

    // Fetch billable line items only (filter out WIP sprints)
    const allItems = await sbGet('invoice_items', `invoice_id=eq.${invoiceId}&order=sort_order`);
    const lineItems = (allItems || []).filter((item) => item.is_billable !== false);

    if (lineItems.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No billable sprints to send. Mark at least one sprint as billable.' }),
      };
    }

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

    const totalAmount = lineItems.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const totalDueNow = lineItems.reduce((sum, i) => sum + getDueNow(i), 0);
    const invoiceDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

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

    // Build and send client email using shared template
    const clientHtml = buildInvoiceEmailHTML({
      invoice,
      client,
      project,
      lineItems,
      invoiceDate,
      payUrl,
    });

    const clientResult = await sendEmail(
      FROM_EMAIL,
      [client.email],
      `Invoice ${invoice.invoice_number}${project?.name ? ` - ${project.name}` : ''}`,
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
      line_items: lineItems.map((item) => ({
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
    const adminHtml = buildAdminEmail({
      invoice,
      client,
      project,
      lineItems,
      totalAmount,
      totalDueNow,
    });
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