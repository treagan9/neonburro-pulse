// src/lib/invoiceEmailTemplate.js
// Pure function that builds the client-facing invoice email HTML.
// Shared between:
//   - netlify/functions/send-invoice.js (server-side, Node ESM)
//   - src/pages/Invoicing/components/InvoicePreview.jsx (client-side, Vite)
//
// LIGHT MODE: bone surfaces, near-black ink, warm brown accents, Topo Lime
// signal, banana for amounts due. Leads with the wide crew banner. All colors
// resolve from src/lib/emailTokens.js so every email retunes from one place.

import { EMAIL } from './emailTokens.js';

// ============================================================
// HELPERS
// ============================================================

const currency = (val) =>
  `$${parseFloat(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export const getDueNow = (item) => {
  const amount = parseFloat(item.amount || 0);
  const paid = parseFloat(item.payment_amount || 0);
  const mode = item.payment_mode || 'approve_only';
  if (mode === 'pay_full') return Math.max(0, amount - paid);
  if (mode === 'deposit_50') return Math.max(0, (amount * 0.5) - paid);
  return 0;
};

export const getFundingLabel = (mode) => {
  if (mode === 'deposit_50') return '50% to Start';
  if (mode === 'pay_full') return 'Fund in Full';
  return 'Confirm Scope';
};

const getFundingColor = (mode) => {
  if (mode === 'pay_full') return EMAIL.fundFull;
  if (mode === 'deposit_50') return EMAIL.fundDeposit;
  return EMAIL.fundConfirm;
};

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// ============================================================
// SPRINT CARD
// ============================================================

const buildSprintCard = (item, idx) => {
  const amount = parseFloat(item.amount || 0);
  const dueNow = getDueNow(item);
  const mode = item.payment_mode || 'approve_only';
  const modeColor = getFundingColor(mode);
  const showDueNowRow = mode === 'deposit_50' || mode === 'approve_only';

  return `
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid ${EMAIL.lineSoft};">
        <div style="color:${EMAIL.inkMuted};font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:700;margin-bottom:4px;letter-spacing:0.05em;">
          ${escapeHtml(item.sprint_number || `SPRINT ${String(idx + 1).padStart(2, '0')}`)}
        </div>
        <div style="color:${EMAIL.ink};font-weight:700;font-size:15px;line-height:1.3;margin-bottom:${item.description ? '4px' : '10px'};">
          ${escapeHtml(item.title || 'Untitled Sprint')}
        </div>
        ${
          item.description
            ? `<div style="color:${EMAIL.inkSec};font-size:13px;line-height:1.6;margin-bottom:10px;">${escapeHtml(item.description)}</div>`
            : ''
        }
        <div style="display:inline-block;background:${EMAIL.raised};color:${modeColor};font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;border:1px solid ${modeColor}55;margin-bottom:10px;letter-spacing:0.02em;">
          ${getFundingLabel(mode)}
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${EMAIL.lineSoft};padding-top:8px;">
          <tr>
            <td style="padding:3px 0;color:${EMAIL.inkMuted};font-size:11px;">Sprint value</td>
            <td style="padding:3px 0;text-align:right;color:${EMAIL.ink};font-weight:700;font-family:'JetBrains Mono',monospace;font-size:14px;">${currency(amount)}</td>
          </tr>
          ${
            showDueNowRow
              ? `
          <tr>
            <td style="padding:3px 0;color:${EMAIL.inkMuted};font-size:11px;">To push forward</td>
            <td style="padding:3px 0;text-align:right;">
              ${
                dueNow > 0
                  ? `<span style="color:${EMAIL.bananaDeep};font-weight:700;font-family:'JetBrains Mono',monospace;font-size:14px;">${currency(dueNow)}</span>`
                  : `<span style="color:${EMAIL.inkMuted};font-size:10px;font-weight:600;">Scope confirmed</span>`
              }
            </td>
          </tr>`
              : ''
          }
        </table>
      </td>
    </tr>`;
};

// ============================================================
// SHELL — light, banner-led
// ============================================================

const buildShell = (content) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NeonBurro Invoice</title>
  <style>
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 0 !important; }
      .outer { border-radius: 0 !important; width: 100% !important; }
      .body-pad { padding: 24px 18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL.page};font-family:'Geist Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL.page};padding:28px 12px;">
    <tr>
      <td align="center">
        <table class="outer" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:${EMAIL.card};border-radius:16px;overflow:hidden;border:1px solid ${EMAIL.line};">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ============================================================
// MAIN TEMPLATE
// ============================================================

export const buildInvoiceEmailHTML = ({
  invoice,
  client,
  project,
  lineItems,
  invoiceDate,
  payUrl,
}) => {
  const items = lineItems || [];
  const totalAmount = items.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  const totalDueNow = items.reduce((sum, i) => sum + getDueNow(i), 0);
  const itemsHTML = items.map((item, idx) => buildSprintCard(item, idx)).join('');
  const hasMultipleSprints = items.length > 1;
  const clientPin = client?.portal_pin || client?.lookup_pin;
  const safeInvoiceNum = escapeHtml(invoice?.invoice_number || 'Invoice');

  const content = `
    <!-- Banner masthead - the wide crew image, edge to edge -->
    <tr>
      <td style="line-height:0;background:${EMAIL.card};">
        <img src="${EMAIL.banner}" alt="NeonBurro" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
      </td>
    </tr>

    <!-- Main body -->
    <tr>
      <td class="body-pad" style="padding:32px 40px;">

        <!-- Invoice label + accent -->
        <div style="color:${EMAIL.signalDeep};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Invoice</div>
        <div style="width:48px;height:2px;background:${EMAIL.signal};margin:0 0 18px 0;border-radius:1px;"></div>
        <h1 style="margin:0 0 6px 0;color:${EMAIL.ink};font-size:28px;font-weight:800;line-height:1.2;letter-spacing:-0.02em;">
          ${safeInvoiceNum}
        </h1>
        <div style="color:${EMAIL.inkMuted};font-size:13px;margin-bottom:24px;">${escapeHtml(invoiceDate || '')}</div>

        <!-- Client + project card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.raised};border:1px solid ${EMAIL.line};border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <tr>
            <td style="padding:18px 20px;">
              <div style="margin-bottom:${project ? '12px' : '0'};">
                <div style="color:${EMAIL.inkMuted};font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;font-weight:700;">Prepared For</div>
                <div style="color:${EMAIL.ink};font-size:16px;font-weight:700;">${escapeHtml(client?.name || 'Client')}</div>
                ${client?.email ? `<div style="color:${EMAIL.inkSec};font-size:13px;margin-top:2px;">${escapeHtml(client.email)}</div>` : ''}
              </div>
              ${
                project
                  ? `
              <div>
                <div style="color:${EMAIL.inkMuted};font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;font-weight:700;">Project</div>
                <div style="color:${EMAIL.ink};font-size:14px;font-weight:600;">${escapeHtml(project.name)}</div>
                ${project.project_number ? `<div style="color:${EMAIL.signalDeep};font-size:12px;font-family:'JetBrains Mono',monospace;font-weight:600;margin-top:2px;">${escapeHtml(project.project_number)}</div>` : ''}
              </div>`
                  : ''
              }
            </td>
          </tr>
        </table>

        <!-- Sprints -->
        ${
          hasMultipleSprints
            ? `<div style="color:${EMAIL.signalDeep};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Sprints</div>`
            : ''
        }
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL.line};border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <tbody>${itemsHTML}</tbody>
          <tr>
            <td style="padding:18px 20px;background:${EMAIL.raised};border-top:2px solid ${EMAIL.line};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:${EMAIL.inkSec};font-size:13px;font-weight:600;">Total Project Value</td>
                  <td style="text-align:right;color:${EMAIL.ink};font-size:18px;font-weight:800;font-family:'JetBrains Mono',monospace;">${currency(totalAmount)}</td>
                </tr>
                ${
                  totalDueNow > 0
                    ? `
                <tr>
                  <td style="padding-top:6px;color:${EMAIL.bananaDeep};font-size:13px;font-weight:700;">To Push Forward</td>
                  <td style="padding-top:6px;text-align:right;color:${EMAIL.bananaDeep};font-size:18px;font-weight:800;font-family:'JetBrains Mono',monospace;">${currency(totalDueNow)}</td>
                </tr>`
                    : ''
                }
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA or scope-confirmed -->
        ${
          totalDueNow > 0
            ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="text-align:center;">
              <a href="${escapeHtml(payUrl || '#')}" style="display:inline-block;background:${EMAIL.signal};color:${EMAIL.ink};text-decoration:none;padding:18px 48px;border-radius:100px;font-weight:800;font-size:16px;letter-spacing:-0.01em;">Approve and Push Forward</a>
              <div style="margin-top:12px;color:${EMAIL.inkMuted};font-size:11px;">ACH, credit card, Apple Pay, Google Pay, or check</div>
              <div style="margin-top:4px;color:${EMAIL.inkFaint};font-size:10px;">Secure payment via Stripe</div>
            </td>
          </tr>
        </table>

        <!-- Mail a check -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:${EMAIL.raised};border:1px solid ${EMAIL.line};border-radius:12px;padding:20px 24px;">
              <div style="color:${EMAIL.bananaDeep};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Prefer to mail a check?</div>
              <div style="color:${EMAIL.inkSec};font-size:13px;line-height:1.6;margin-bottom:12px;">
                Make checks payable to <span style="color:${EMAIL.ink};font-weight:700;">The Burroship, LLC</span> and include invoice <span style="color:${EMAIL.signalDeep};font-family:'JetBrains Mono',monospace;font-weight:600;">${safeInvoiceNum}</span> in the memo.
              </div>
              <div style="background:${EMAIL.card};border:1px solid ${EMAIL.line};border-radius:8px;padding:14px 16px;">
                <div style="color:${EMAIL.ink};font-size:13px;font-weight:700;margin-bottom:2px;">The Burroship, LLC</div>
                <div style="color:${EMAIL.inkSec};font-size:13px;">P.O. Box 2111</div>
                <div style="color:${EMAIL.inkSec};font-size:13px;">Ridgway, CO 81432</div>
              </div>
            </td>
          </tr>
        </table>`
            : `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:${EMAIL.raised};border:1px solid ${EMAIL.line};border-radius:12px;padding:28px 24px;text-align:center;">
              <div style="color:${EMAIL.ink};font-size:16px;font-weight:700;margin-bottom:4px;">Scope Confirmed</div>
              <div style="color:${EMAIL.inkMuted};font-size:13px;">No payment due at this time</div>
            </td>
          </tr>
        </table>`
        }

        <!-- Questions -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.raised};border:1px solid ${EMAIL.line};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:18px 22px;">
              <div style="color:${EMAIL.inkMuted};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Questions?</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:3px 0;color:${EMAIL.inkMuted};font-size:12px;">Email</td>
                  <td style="padding:3px 0;text-align:right;"><a href="mailto:hello@neonburro.com" style="color:${EMAIL.signalDeep};font-size:12px;font-weight:600;text-decoration:none;">hello@neonburro.com</a></td>
                </tr>
                <tr>
                  <td style="padding:3px 0;color:${EMAIL.inkMuted};font-size:12px;">Phone</td>
                  <td style="padding:3px 0;text-align:right;"><a href="tel:9709738550" style="color:${EMAIL.signalDeep};font-size:12px;font-weight:600;font-family:'JetBrains Mono',monospace;text-decoration:none;">(970) 973-8550</a></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Lookup block -->
    <tr>
      <td style="padding:0 40px 20px 40px;background:${EMAIL.card};">
        <div style="background:${EMAIL.raised};border:1px solid ${EMAIL.line};border-radius:10px;padding:14px 16px;text-align:center;">
          <div style="color:${EMAIL.inkFaint};font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">Lost this email?</div>
          <div style="color:${EMAIL.inkSec};font-size:11px;line-height:1.5;">
            Look up your invoices anytime at <a href="https://neonburro.com/account/lookup/" style="color:${EMAIL.signalDeep};text-decoration:none;font-weight:600;">neonburro.com/account/lookup</a>
            ${clientPin ? `<br>Your PIN: <strong style="color:${EMAIL.signalDeep};font-family:'JetBrains Mono',monospace;letter-spacing:2px;">${escapeHtml(clientPin)}</strong>` : ''}
          </div>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:18px 40px;border-top:1px solid ${EMAIL.line};text-align:center;">
        <div style="color:${EMAIL.inkMuted};font-size:11px;">Real people. Clear responses.</div>
        <div style="color:${EMAIL.inkFaint};font-size:10px;margin-top:6px;">Powered by Neon Burro</div>
        <div style="margin-top:4px;">
          <a href="https://neonburro.com/" style="color:${EMAIL.signalDeep};font-size:11px;text-decoration:none;font-weight:600;">neonburro.com</a>
        </div>
      </td>
    </tr>
  `;

  return buildShell(content);
};

export default buildInvoiceEmailHTML;
