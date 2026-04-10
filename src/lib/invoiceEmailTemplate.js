// src/lib/invoiceEmailTemplate.js
// Pure function that builds the client-facing invoice email HTML.
// Shared between:
//   - netlify/functions/send-invoice.js (server-side, Node ESM)
//   - src/pages/Invoicing/components/InvoicePreview.jsx (client-side, Vite)
//
// No React, no Chakra, no external dependencies. Just template literals.
// Edit this file to change what the client sees in their inbox AND in the Pulse preview.

const HERO_IMG = 'https://pulse.neonburro.com/cimarron-range-neon.png';
const LOGO_IMG = 'https://pulse.neonburro.com/neon-burro-email-logo.png';

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
  if (mode === 'pay_full') return '#39FF14';
  if (mode === 'deposit_50') return '#FFE500';
  return '#737373';
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
  const modeBg = `${modeColor}15`;
  const modeBorder = `${modeColor}40`;

  // Only show "to push forward" row when it differs from sprint value.
  // Fund in Full: value === due now, skip the second row (it's redundant).
  // 50% deposit: value !== due now, show both.
  // Confirm Scope: due now is 0, show "Scope confirmed" message.
  const showDueNowRow = mode === 'deposit_50' || mode === 'approve_only';

  return `
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid #1f1f1f;">
        <div style="color:#737373;font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:700;margin-bottom:4px;letter-spacing:0.05em;">
          ${escapeHtml(item.sprint_number || `SPRINT ${String(idx + 1).padStart(2, '0')}`)}
        </div>
        <div style="color:#ffffff;font-weight:700;font-size:15px;line-height:1.3;margin-bottom:${item.description ? '4px' : '10px'};">
          ${escapeHtml(item.title || 'Untitled Sprint')}
        </div>
        ${
          item.description
            ? `<div style="color:#a0a0a0;font-size:13px;line-height:1.6;margin-bottom:10px;">${escapeHtml(item.description)}</div>`
            : ''
        }
        <div style="display:inline-block;background:${modeBg};color:${modeColor};font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;border:1px solid ${modeBorder};margin-bottom:10px;letter-spacing:0.02em;">
          ${getFundingLabel(mode)}
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1f1f1f;padding-top:8px;">
          <tr>
            <td style="padding:3px 0;color:#737373;font-size:11px;">Sprint value</td>
            <td style="padding:3px 0;text-align:right;color:#ffffff;font-weight:700;font-family:'JetBrains Mono',monospace;font-size:14px;">${currency(amount)}</td>
          </tr>
          ${
            showDueNowRow
              ? `
          <tr>
            <td style="padding:3px 0;color:#737373;font-size:11px;">To push forward</td>
            <td style="padding:3px 0;text-align:right;">
              ${
                dueNow > 0
                  ? `<span style="color:#FFE500;font-weight:700;font-family:'JetBrains Mono',monospace;font-size:14px;">${currency(dueNow)}</span>`
                  : `<span style="color:#737373;font-size:10px;font-weight:600;">Scope confirmed</span>`
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
// SHELL
// ============================================================

const buildShell = (content) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NeonBurro Invoice</title>
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

// ============================================================
// MAIN TEMPLATE - exported
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
    <!-- Hero image - shorter for mobile -->
    <tr>
      <td style="line-height:0;">
        <img src="${HERO_IMG}" alt="NeonBurro" width="600" style="display:block;width:100%;height:auto;max-height:140px;object-fit:cover;" />
      </td>
    </tr>

    <!-- Main body -->
    <tr>
      <td class="body-pad" style="padding:32px 40px;">

        <!-- Logo + invoice label -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td>
              <img src="${LOGO_IMG}" alt="NeonBurro" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:50%;" />
            </td>
            <td style="text-align:right;vertical-align:bottom;">
              <div style="color:#00E5E5;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Invoice</div>
            </td>
          </tr>
        </table>

        <!-- Accent bar + invoice number -->
        <div style="width:48px;height:2px;background:#00E5E5;margin:0 0 18px 0;border-radius:1px;"></div>
        <h1 style="margin:0 0 6px 0;color:#ffffff;font-size:28px;font-weight:800;line-height:1.2;letter-spacing:-0.02em;">
          ${safeInvoiceNum}
        </h1>
        <div style="color:#737373;font-size:13px;margin-bottom:24px;">${escapeHtml(invoiceDate || '')}</div>

        <!-- Client + project card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <tr>
            <td style="padding:18px 20px;">
              <div style="margin-bottom:${project ? '12px' : '0'};">
                <div style="color:#737373;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;font-weight:700;">Prepared For</div>
                <div style="color:#ffffff;font-size:16px;font-weight:700;">${escapeHtml(client?.name || 'Client')}</div>
                ${client?.email ? `<div style="color:#a0a0a0;font-size:13px;margin-top:2px;">${escapeHtml(client.email)}</div>` : ''}
              </div>
              ${
                project
                  ? `
              <div>
                <div style="color:#737373;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;font-weight:700;">Project</div>
                <div style="color:#ffffff;font-size:14px;font-weight:600;">${escapeHtml(project.name)}</div>
                ${project.project_number ? `<div style="color:#00E5E5;font-size:12px;font-family:'JetBrains Mono',monospace;font-weight:600;margin-top:2px;">${escapeHtml(project.project_number)}</div>` : ''}
              </div>`
                  : ''
              }
            </td>
          </tr>
        </table>

        <!-- Sprints section -->
        ${
          hasMultipleSprints
            ? `<div style="color:#00E5E5;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Sprints</div>`
            : ''
        }
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <tbody>${itemsHTML}</tbody>

          <!-- Totals row -->
          <tr>
            <td style="padding:18px 20px;background:#141414;border-top:2px solid #1f1f1f;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#a0a0a0;font-size:13px;font-weight:600;">Total Project Value</td>
                  <td style="text-align:right;color:#ffffff;font-size:18px;font-weight:800;font-family:'JetBrains Mono',monospace;">${currency(totalAmount)}</td>
                </tr>
                ${
                  totalDueNow > 0
                    ? `
                <tr>
                  <td style="padding-top:6px;color:#FFE500;font-size:13px;font-weight:700;">To Push Forward</td>
                  <td style="padding-top:6px;text-align:right;color:#FFE500;font-size:18px;font-weight:800;font-family:'JetBrains Mono',monospace;">${currency(totalDueNow)}</td>
                </tr>`
                    : ''
                }
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA button (or scope confirmed block) -->
        ${
          totalDueNow > 0
            ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="text-align:center;">
              <a href="${escapeHtml(payUrl || '#')}" style="display:inline-block;background:#00E5E5;color:#0A0A0A;text-decoration:none;padding:18px 48px;border-radius:100px;font-weight:800;font-size:16px;letter-spacing:-0.01em;">Approve and Push Forward</a>
              <div style="margin-top:12px;color:#737373;font-size:11px;">ACH, credit card, Apple Pay, Google Pay, or check</div>
              <div style="margin-top:4px;color:#525252;font-size:10px;">Secure payment via Stripe</div>
            </td>
          </tr>
        </table>

        <!-- Mail a check option - only place The Burroship, LLC is shown -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:#0A0A0A;border:1px solid #1f1f1f;border-radius:12px;padding:20px 24px;">
              <div style="color:#FFE500;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Prefer to mail a check?</div>
              <div style="color:#a0a0a0;font-size:13px;line-height:1.6;margin-bottom:12px;">
                Make checks payable to <span style="color:#ffffff;font-weight:700;">The Burroship, LLC</span> and include invoice <span style="color:#00E5E5;font-family:'JetBrains Mono',monospace;font-weight:600;">${safeInvoiceNum}</span> in the memo.
              </div>
              <div style="background:#141414;border:1px solid #1f1f1f;border-radius:8px;padding:14px 16px;">
                <div style="color:#ffffff;font-size:13px;font-weight:700;margin-bottom:2px;">The Burroship, LLC</div>
                <div style="color:#a0a0a0;font-size:13px;">P.O. Box 2111</div>
                <div style="color:#a0a0a0;font-size:13px;">Ridgway, CO 81432</div>
              </div>
            </td>
          </tr>
        </table>`
            : `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:#141414;border:1px solid #1f1f1f;border-radius:12px;padding:28px 24px;text-align:center;">
              <div style="color:#ffffff;font-size:16px;font-weight:700;margin-bottom:4px;">Scope Confirmed</div>
              <div style="color:#737373;font-size:13px;">No payment due at this time</div>
            </td>
          </tr>
        </table>`
        }

        <!-- Questions contact card - no burro image, cleaner -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:18px 22px;">
              <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Questions?</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:3px 0;color:#737373;font-size:12px;">Email</td>
                  <td style="padding:3px 0;text-align:right;"><a href="mailto:hello@neonburro.com" style="color:#00E5E5;font-size:12px;font-weight:600;text-decoration:none;">hello@neonburro.com</a></td>
                </tr>
                <tr>
                  <td style="padding:3px 0;color:#737373;font-size:12px;">Phone</td>
                  <td style="padding:3px 0;text-align:right;"><a href="tel:9709738550" style="color:#00E5E5;font-size:12px;font-weight:600;font-family:'JetBrains Mono',monospace;text-decoration:none;">(970) 973-8550</a></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Lost this email? Lookup block -->
    <tr>
      <td style="padding:0 40px 20px 40px;background:#0a0a0a;">
        <div style="background:#141414;border:1px solid #1f1f1f;border-radius:10px;padding:14px 16px;text-align:center;">
          <div style="color:#525252;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">Lost this email?</div>
          <div style="color:#a0a0a0;font-size:11px;line-height:1.5;">
            Look up your invoices anytime at <a href="https://neonburro.com/account/lookup/" style="color:#00E5E5;text-decoration:none;font-weight:600;">neonburro.com/account/lookup</a>
            ${clientPin ? `<br>Your PIN: <strong style="color:#00E5E5;font-family:'JetBrains Mono',monospace;letter-spacing:2px;">${escapeHtml(clientPin)}</strong>` : ''}
          </div>
        </div>
      </td>
    </tr>

    <!-- Footer - lean, no LLC mention -->
    <tr>
      <td style="padding:18px 40px;border-top:1px solid #1f1f1f;text-align:center;">
        <div style="color:#737373;font-size:11px;">Real people. Clear responses.</div>
        <div style="color:#525252;font-size:10px;margin-top:6px;">Powered by Neon Burro</div>
        <div style="margin-top:4px;">
          <a href="https://neonburro.com/" style="color:#00E5E5;font-size:11px;text-decoration:none;font-weight:600;">neonburro.com</a>
        </div>
      </td>
    </tr>
  `;

  return buildShell(content);
};

export default buildInvoiceEmailHTML;