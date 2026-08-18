// src/lib/appointmentEmail.js
// The warm-paper meeting invite, shared like the invoice and reply templates so
// what the operator previews is exactly what lands. Two audiences off one
// builder:
//   audience: 'client'  the invite the client receives (hero when-block, the
//                        type-specific detail, join button or address, add-to-
//                        calendar, a reply-to-move-it line)
//   audience: 'admin'   the internal heads-up to the team inbox (no CTA, just
//                        the facts and who booked it)
//
// PURE. Every date and time string is preformatted by send-appointment.js in the
// appointment's stored zone, so this file never touches Date math and can never
// reintroduce the off-by-one. Colors resolve from emailTokens.js.
//
// TYPE_ACCENT mirrors the three hues in src/pages/Calendar/calendarConstants.js.
// Emails cannot read the app theme (same reason emailTokens exists), so the three
// values live here too. If a hue changes there, change it here. No oxford commas,
// no dashes.

import { EMAIL } from './emailTokens.js';

const SANS = "'Geist','Geist Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";
const MONO = "'Geist Mono','JetBrains Mono',ui-monospace,'SF Mono',Menlo,monospace";

const TYPE_ACCENT = { call: '#6B5245', video: '#2E6E6E', in_person: '#9A7B00' };

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const nl2br = (s) => escapeHtml(s).replace(/\n/g, '<br>');

// One inset panel: label on top, value below. Used for when, where, about.
const panel = (label, valueHtml, accent) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.sheet2};border-radius:12px;margin-top:14px;${accent ? `border-left:3px solid ${accent};` : ''}">
    <tr><td style="padding:16px 18px;">
      <div style="font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL.inkMuted};margin-bottom:7px;">${label}</div>
      <div style="font-family:${SANS};font-size:15px;line-height:1.55;color:${EMAIL.ink};">${valueHtml}</div>
    </td></tr>
  </table>`;

export const buildAppointmentEmailHTML = (opts) => {
  const {
    audience = 'client',
    mode = 'invite',
    clientName, firstName, adminName,
    title, typeId, typeVerb,
    dayLine, timeLine,
    description, videoUrl, location, phone,
    calendarLink, pulseUrl,
  } = opts;

  const accent = TYPE_ACCENT[typeId] || EMAIL.inkMuted;
  const safeTitle = escapeHtml(title || 'Meeting');
  const whenHtml = `<span style="font-weight:600;">${escapeHtml(dayLine)}</span><br><span style="color:${EMAIL.inkSec};font-size:14px;">${escapeHtml(timeLine)}</span>`;

  // Type-specific detail block
  let detailPanel = '';
  if (typeId === 'video' && videoUrl) {
    detailPanel = panel('Where', `Video room. Nothing to install, it opens in your browser.`, accent) + `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr><td>
        <a href="${escapeHtml(videoUrl)}" style="display:inline-block;background:${EMAIL.signal};color:${EMAIL.limeInk};text-decoration:none;padding:14px 30px;border-radius:100px;font-family:${SANS};font-weight:700;font-size:15px;">Join the video room</a>
        <div style="font-family:${MONO};font-size:11px;color:${EMAIL.inkFaint};margin-top:9px;word-break:break-all;">${escapeHtml(videoUrl)}</div>
      </td></tr></table>`;
  } else if (typeId === 'in_person' && location) {
    detailPanel = panel('Where', nl2br(location), accent);
  } else if (typeId === 'call') {
    detailPanel = panel('Where', phone ? `A phone call. We ring you at ${escapeHtml(phone)}.` : 'A phone call. We ring you at the number on file.', accent);
  }

  const aboutPanel = description ? panel('What it is about', nl2br(description)) : '';

  // ADMIN copy: internal, terse, no CTA
  if (audience === 'admin') {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><title>Neon Burro</title></head>
<body style="margin:0;padding:0;background-color:${EMAIL.page};font-family:${SANS};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL.page};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:${EMAIL.sheet};border-radius:16px;overflow:hidden;">
        <tr><td style="padding:34px 32px;">
          <div style="font-family:${SANS};font-size:19px;font-weight:600;letter-spacing:-0.035em;color:${EMAIL.ink};">neonburro<span style="color:${EMAIL.signal};">.</span></div>
          <div style="font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${accent};margin-top:18px;">${mode === 'reminder' ? 'Reminder going out' : 'New appointment'} &bull; ${escapeHtml(typeVerb)}</div>
          <div style="font-family:${SANS};font-size:23px;font-weight:600;color:${EMAIL.ink};margin-top:7px;line-height:1.25;">${safeTitle}</div>
          <div style="font-family:${SANS};font-size:14px;color:${EMAIL.inkMuted};margin-top:6px;">with ${escapeHtml(clientName || 'a client')}</div>
          ${panel('When', whenHtml, accent)}
          ${detailPanel}
          ${aboutPanel}
          <div style="margin-top:22px;padding-top:16px;border-top:1px solid ${EMAIL.hair};font-family:${SANS};font-size:12.5px;color:${EMAIL.inkMuted};">
            Booked by ${escapeHtml(adminName || 'the team')}. ${pulseUrl ? `<a href="${escapeHtml(pulseUrl)}" style="color:${EMAIL.limeDeep};text-decoration:none;font-weight:600;">Open in Pulse</a>` : ''}
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  }

  // CLIENT copy: the invite
  const kicker = mode === 'reminder' ? 'A reminder' : "You're on the calendar";
  const lede = mode === 'reminder'
    ? `A quick reminder about your ${escapeHtml(typeVerb.toLowerCase())} with Neon Burro.`
    : `${escapeHtml(adminName || 'The Neon Burro team')} set up a ${escapeHtml(typeVerb.toLowerCase())} with you. Here are the details.`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><title>Neon Burro</title></head>
<body style="margin:0;padding:0;background-color:${EMAIL.page};font-family:${SANS};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL.page};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${EMAIL.sheet};border-radius:16px;overflow:hidden;">
        <tr><td style="padding:38px 34px;">
          <div style="font-family:${SANS};font-size:20px;font-weight:600;letter-spacing:-0.035em;color:${EMAIL.ink};">neonburro<span style="color:${EMAIL.signal};">.</span></div>
          <div style="font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${accent};margin-top:18px;">${kicker}</div>
          <div style="font-family:${SANS};font-size:24px;font-weight:600;color:${EMAIL.ink};margin-top:8px;line-height:1.25;">${safeTitle}</div>
          <div style="font-family:${SANS};font-size:15px;line-height:1.7;color:${EMAIL.inkSec};margin-top:12px;">Hi ${escapeHtml(firstName || 'there')}, ${lede}</div>

          ${panel('When', whenHtml, accent)}
          ${detailPanel}
          ${aboutPanel}

          ${calendarLink ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr><td>
            <a href="${escapeHtml(calendarLink)}" style="display:inline-block;background:transparent;color:${EMAIL.ink};text-decoration:none;padding:11px 22px;border-radius:100px;border:1px solid ${EMAIL.hair};font-family:${SANS};font-weight:600;font-size:13.5px;">Add to Google Calendar</a>
            <div style="font-family:${SANS};font-size:11.5px;color:${EMAIL.inkFaint};margin-top:8px;">A calendar file is attached too, for Apple Calendar and Outlook.</div>
          </td></tr></table>` : ''}

          <div style="margin-top:30px;padding-top:20px;border-top:1px solid ${EMAIL.hair};">
            <div style="font-family:${SANS};font-size:14px;font-weight:600;color:${EMAIL.ink};">${escapeHtml(adminName || 'The Neon Burro team')}</div>
            <div style="font-family:${SANS};font-size:12.5px;color:${EMAIL.inkMuted};margin-top:3px;">
              <a href="https://neonburro.com/" style="color:${EMAIL.limeDeep};text-decoration:none;">neonburro.com</a> &nbsp;&bull;&nbsp; (970) 973-8550
            </div>
          </div>
        </td></tr>
      </table>
      <div style="max-width:560px;margin-top:16px;font-family:${SANS};font-size:11px;line-height:1.6;color:${EMAIL.inkFaint};text-align:center;">
        Need to move it? Just reply to this email and we will sort it out.
      </div>
    </td></tr>
  </table>
</body></html>`;
};

export default buildAppointmentEmailHTML;
