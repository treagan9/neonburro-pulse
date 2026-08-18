// netlify/functions/send-appointment.js
// The notification half of the calendar. The app writes the appointment row
// itself (client-side, RLS), then calls this with the row id and three switches.
// This function owns everything that leaves the building:
//   1. builds a real .ics calendar file and a one-click Google Calendar link
//   2. emails the client the warm-paper invite with the .ics attached  (sendClient)
//   3. emails the team inbox a terse heads-up                          (notifyTeam)
//   4. drops a note into client_messages so it lands in their portal   (postPortal)
//   5. stamps client_notified_at (invite) or reminder_sent_at (reminder)
//   6. logs the whole thing to activity_log
//
// ESM on purpose so it can import the shared appointmentEmail template, the same
// way reply-to-form.js imports the reply template. All dates are formatted HERE
// in the appointment's stored zone and handed to the template as finished
// strings, so the invoice off-by-one can never come back.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY (all already set
// on the Pulse site, send-client-invite uses them), NOTIFICATION_EMAIL optional
// (falls back to hello@neonburro.com). No new secrets. No oxford commas.

import { createClient } from '@supabase/supabase-js';
import { buildAppointmentEmailHTML } from '../../src/lib/appointmentEmail.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TEAM_EMAIL = process.env.NOTIFICATION_EMAIL || 'hello@neonburro.com';

const FROM_EMAIL = 'NeonBurro <hello@neonburro.com>';
const REPLY_TO = 'hello@neonburro.com';
const PULSE_CAL_URL = 'https://pulse.neonburro.com/calendar/';

const TYPE_VERB = { call: 'Phone call', video: 'Video call', in_person: 'In-person meeting' };

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── formatting, all in the appointment's zone ───────────────────────────────
const fmtDay = (iso, tz) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: tz,
  });

const fmtTime = (iso, tz) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: tz,
  });

const fmtZone = (iso, tz) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(iso));
  return parts.find((p) => p.type === 'timeZoneName')?.value || '';
};

const buildTimeLine = (startIso, endIso, tz) =>
  `${fmtTime(startIso, tz)} – ${fmtTime(endIso, tz)} ${fmtZone(startIso, tz)}`.trim();

// ── .ics + Google Calendar link ─────────────────────────────────────────────
const toUTCStamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const escICS = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

const buildICS = ({ id, title, description, location, startIso, endIso, organizerEmail, attendeeEmail, attendeeName, cancelled }) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Neon Burro//Pulse Calendar//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${cancelled ? 'CANCEL' : 'REQUEST'}`,
    'BEGIN:VEVENT',
    `UID:${id}@neonburro.com`,
    `DTSTAMP:${toUTCStamp(new Date().toISOString())}`,
    `DTSTART:${toUTCStamp(startIso)}`,
    `DTEND:${toUTCStamp(endIso)}`,
    `SUMMARY:${escICS(title)}`,
    description ? `DESCRIPTION:${escICS(description)}` : null,
    location ? `LOCATION:${escICS(location)}` : null,
    `ORGANIZER;CN=Neon Burro:mailto:${organizerEmail}`,
    attendeeEmail ? `ATTENDEE;CN=${escICS(attendeeName)};RSVP=TRUE:mailto:${attendeeEmail}` : null,
    `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
};

const buildGCalLink = ({ title, description, location, startIso, endIso }) => {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Meeting',
    dates: `${toUTCStamp(startIso)}/${toUTCStamp(endIso)}`,
    details: description || '',
    location: location || '',
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

const sendEmail = async ({ to, subject, html, attachments }) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, reply_to: REPLY_TO, subject, html, attachments }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${await res.text()}`);
  return res.json();
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const {
      appointmentId,
      mode = 'invite',
      sendClient = true,
      notifyTeam = true,
      postPortal = true,
      senderId = null,
      senderName = 'Neon Burro',
      bookedBy = null,
      personaId = null,
    } = JSON.parse(event.body || '{}');

    if (!appointmentId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'appointmentId required' }) };
    }

    const { data: appt, error: apptErr } = await supabase
      .from('appointments').select('*').eq('id', appointmentId).single();
    if (apptErr || !appt) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Appointment not found' }) };
    }

    let client = null;
    if (appt.client_id) {
      const { data } = await supabase.from('clients').select('*').eq('id', appt.client_id).single();
      client = data || null;
    }

    const tz = appt.timezone || 'America/Denver';
    const typeVerb = TYPE_VERB[appt.meeting_type] || 'Meeting';
    const dayLine = fmtDay(appt.starts_at, tz);
    const timeLine = buildTimeLine(appt.starts_at, appt.ends_at, tz);
    const locationForCal = appt.meeting_type === 'video' ? (appt.meeting_url || '') : (appt.location || '');

    const ics = buildICS({
      id: appt.id,
      title: appt.title,
      description: appt.description,
      location: locationForCal,
      startIso: appt.starts_at,
      endIso: appt.ends_at,
      organizerEmail: 'hello@neonburro.com',
      attendeeEmail: client?.email || null,
      attendeeName: client?.name || 'Guest',
    });
    const icsAttachment = {
      filename: 'neonburro-meeting.ics',
      content: Buffer.from(ics, 'utf8').toString('base64'),
      content_type: 'text/calendar; charset=utf-8; method=REQUEST',
    };
    const calendarLink = buildGCalLink({
      title: appt.title,
      description: appt.description,
      location: locationForCal,
      startIso: appt.starts_at,
      endIso: appt.ends_at,
    });

    const results = { client: false, team: false, portal: false };

    // 1. Client invite
    if (sendClient && client?.email) {
      const html = buildAppointmentEmailHTML({
        audience: 'client', mode,
        clientName: client.name, firstName: (client.name || '').split(' ')[0],
        adminName: senderName, title: appt.title, typeId: appt.meeting_type, typeVerb,
        dayLine, timeLine,
        description: appt.description, videoUrl: appt.meeting_url, location: appt.location, phone: client.phone,
        calendarLink,
      });
      await sendEmail({
        to: client.email.toLowerCase(),
        subject: `${mode === 'reminder' ? 'Reminder' : 'Meeting'}: ${appt.title} on ${fmtDay(appt.starts_at, tz)}`,
        html,
        attachments: [icsAttachment],
      });
      results.client = true;
    }

    // 2. Team heads-up
    if (notifyTeam) {
      const html = buildAppointmentEmailHTML({
        audience: 'admin', mode,
        clientName: client?.name, adminName: bookedBy || senderName,
        title: appt.title, typeId: appt.meeting_type, typeVerb,
        dayLine, timeLine,
        description: appt.description, videoUrl: appt.meeting_url, location: appt.location, phone: client?.phone,
        pulseUrl: PULSE_CAL_URL,
      });
      await sendEmail({
        to: TEAM_EMAIL,
        subject: `${mode === 'reminder' ? 'Reminder sent' : 'New appointment'}: ${appt.title}${client?.name ? ` with ${client.name}` : ''}`,
        html,
        attachments: [icsAttachment],
      });
      results.team = true;
    }

    // 3. Portal note into the client's message thread
    if (postPortal && appt.client_id) {
      const detail = appt.meeting_type === 'video'
        ? 'The video room link is in your email invite.'
        : appt.meeting_type === 'in_person' && appt.location
          ? `Where: ${appt.location}.`
          : 'We will call you at the time above.';
      const message = `I put a ${typeVerb.toLowerCase()} on the calendar: "${appt.title}" on ${dayLine} at ${fmtTime(appt.starts_at, tz)} ${fmtZone(appt.starts_at, tz)}. ${detail} Reply here if that time does not work and we will move it.`;
      const { error: msgErr } = await supabase.from('client_messages').insert({
        client_id: appt.client_id,
        sender_id: senderId,
        sender_type: 'team',
        sender_name: senderName,
        persona_id: personaId,
        message,
        read_by_team: true,
        read_by_client: false,
      });
      if (!msgErr) results.portal = true;
    }

    // 4. Stamp the row
    const stampField = mode === 'reminder' ? 'reminder_sent_at' : 'client_notified_at';
    await supabase.from('appointments')
      .update({ [stampField]: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', appt.id);

    // 5. Activity trail
    await supabase.from('activity_log').insert({
      action: mode === 'reminder' ? 'appointment_reminder_sent' : 'appointment_scheduled',
      entity_type: 'appointment',
      entity_id: appt.id,
      client_id: appt.client_id,
      user_id: senderId,
      category: 'transactional',
      metadata: { title: appt.title, type: appt.meeting_type, starts_at: appt.starts_at, results },
      created_at: new Date().toISOString(),
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, results }) };
  } catch (err) {
    console.error('send-appointment error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Failed to send appointment' }) };
  }
};
