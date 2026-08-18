// src/lib/replyEmailTemplate.js
// The warm-paper reply a lead receives when the team answers a form submission.
// Shared, like the invoice template, so the preview in the Forms reply modal is
// literally what the person gets. Used by:
//   - netlify/functions/reply-to-form.js (server, ESM)
//   - src/pages/Forms/index.jsx (the reply modal preview iframe)
//
// A note, not an invoice: a clean cream card, the wordmark with its lime period,
// a kicker, the greeting, the message, a signature, and the line that matters
// most, that they can reply straight back to it. All colors resolve from
// emailTokens.js. No oxford commas, no dashes.

import { EMAIL } from './emailTokens.js';

const SANS = "'Geist','Geist Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";
const MONO = "'Geist Mono','JetBrains Mono',ui-monospace,'SF Mono',Menlo,monospace";

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const buildReplyEmailHTML = ({ recipientName, body, adminName, isFollowUp }) => {
  const safeName = escapeHtml(recipientName || 'there');
  const safeBody = escapeHtml(body).replace(/\n/g, '<br>');
  const safeAdmin = escapeHtml(adminName || 'The Neon Burro team');
  const kicker = isFollowUp ? 'Following up' : 'A note from Neon Burro';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Neon Burro</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL.page};font-family:${SANS};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL.page};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${EMAIL.sheet};border-radius:16px;overflow:hidden;">
        <tr><td style="padding:38px 34px;">
          <div style="font-family:${SANS};font-size:20px;font-weight:600;letter-spacing:-0.035em;color:${EMAIL.ink};">neonburro<span style="color:${EMAIL.signal};">.</span></div>
          <div style="font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${EMAIL.limeDeep};margin-top:18px;">${kicker}</div>
          <div style="font-family:${SANS};font-size:22px;font-weight:600;color:${EMAIL.ink};margin-top:8px;line-height:1.3;">Hi ${safeName},</div>
          <div style="font-family:${SANS};font-size:15px;line-height:1.75;color:${EMAIL.inkSec};margin-top:18px;">${safeBody}</div>
          <div style="margin-top:30px;padding-top:20px;border-top:1px solid ${EMAIL.hair};">
            <div style="font-family:${SANS};font-size:14px;font-weight:600;color:${EMAIL.ink};">${safeAdmin}</div>
            <div style="font-family:${SANS};font-size:12.5px;color:${EMAIL.inkMuted};margin-top:3px;">
              <a href="https://neonburro.com/" style="color:${EMAIL.limeDeep};text-decoration:none;">neonburro.com</a> &nbsp;&bull;&nbsp; (970) 973-8550
            </div>
          </div>
        </td></tr>
      </table>
      <div style="max-width:560px;margin-top:16px;font-family:${SANS};font-size:11px;line-height:1.6;color:${EMAIL.inkFaint};text-align:center;">
        You can reply straight back to this email. We read every response.
      </div>
    </td></tr>
  </table>
</body>
</html>`;
};

export default buildReplyEmailHTML;
