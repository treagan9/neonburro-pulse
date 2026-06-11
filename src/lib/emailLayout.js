// src/lib/emailLayout.js
// Shared light-mode email shell so every Pulse email (invoice, reminder, PIN,
// admin notifications) leads with the same banner and shares one frame.
// Pure template literals. Imports the email palette from emailTokens.js.

import { EMAIL } from './emailTokens.js';

// The wide crew banner masthead, edge to edge.
export const emailBanner = () => `
  <tr>
    <td style="line-height:0;background:${EMAIL.card};">
      <img src="${EMAIL.banner}" alt="NeonBurro" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
    </td>
  </tr>`;

// A small mono label + accent bar header used inside bodies.
export const emailEyebrow = (label, color = EMAIL.signalDeep) => `
  <div style="color:${color};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">${label}</div>
  <div style="width:48px;height:2px;background:${EMAIL.signal};margin:0 0 18px 0;border-radius:1px;"></div>`;

// Shared footer.
export const emailFooter = () => `
  <tr>
    <td style="padding:18px 40px;border-top:1px solid ${EMAIL.line};text-align:center;">
      <div style="color:${EMAIL.inkMuted};font-size:11px;">Real people. Clear responses.</div>
      <div style="color:${EMAIL.inkFaint};font-size:10px;margin-top:6px;">Powered by Neon Burro</div>
      <div style="margin-top:4px;">
        <a href="https://neonburro.com/" style="color:${EMAIL.signalDeep};font-size:11px;text-decoration:none;font-weight:600;">neonburro.com</a>
      </div>
    </td>
  </tr>`;

// Full light shell. Pass the inner <tr>...</tr> content between banner + footer.
export const emailShell = (content, { includeBanner = true, includeFooter = true } = {}) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NeonBurro</title>
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
          ${includeBanner ? emailBanner() : ''}
          ${content}
          ${includeFooter ? emailFooter() : ''}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export default emailShell;
