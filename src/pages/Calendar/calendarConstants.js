// src/pages/Calendar/calendarConstants.js
// SENTINEL: NB_CALENDAR_V1
//
// Everything the calendar needs that is not JSX: the three meeting types with
// their hues, the duration menu, the month-matrix builder, a few date helpers
// and the video-room generator. Kept pure so the page, the grid and the modal
// all read the SAME source and never drift on what a "video" appointment is or
// what color a call chip should be.
//
// THE THREE TYPE HUES are semantic, not the brand accent. Lime (#C5D957) is
// spent once per screen on the primary action and the today marker. A meeting
// type needs its own quiet color so a glance at the grid reads call vs video vs
// in-person without a legend: call is Burro Hide brown (grounded, a voice),
// video is the one cool teal on the whole warm page (a screen's glow), in-person
// is deep gold (the warm, special one, someone is coming to the ridge). If you
// change these, change nothing else, they are deliberately distinct from lime
// and from each other on cream.
//
// TIME MODEL, the trap that bit the invoices: the admin picks a wall-clock date
// and time and we interpret it in the BROWSER's local zone (the operator sits in
// Ridgway), store the absolute instant as ISO, and stamp the resolved zone name
// onto the row. The invite email and the .ics both render FROM that instant, so
// the client sees the meeting in their own zone and nobody is off by an hour.
// combineLocal is the one place that parses "YYYY-MM-DD" + "HH:MM" as local time.

export const MEETING_TYPES = [
  {
    id: 'call',
    label: 'Call',
    verb: 'Phone call',
    accent: '#6B5245',
    tint: 'rgba(107,82,69,0.10)',
    hint: 'A voice call. We ring you at the number on file.',
  },
  {
    id: 'video',
    label: 'Video',
    verb: 'Video call',
    accent: '#2E6E6E',
    tint: 'rgba(46,110,110,0.11)',
    hint: 'A private room link is generated and sent with the invite.',
  },
  {
    id: 'in_person',
    label: 'In person',
    verb: 'In person',
    accent: '#9A7B00',
    tint: 'rgba(154,123,0,0.11)',
    hint: 'Somewhere real. Add the address so it lands in the invite.',
  },
];

export const TYPE_BY_ID = Object.fromEntries(MEETING_TYPES.map((t) => [t.id, t]));

export const typeOf = (id) => TYPE_BY_ID[id] || MEETING_TYPES[0];

export const DURATIONS = [
  { min: 15, label: '15 min' },
  { min: 30, label: '30 min' },
  { min: 45, label: '45 min' },
  { min: 60, label: '1 hour' },
  { min: 90, label: '1.5 hours' },
  { min: 120, label: '2 hours' },
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Local YYYY-MM-DD for a Date, never the UTC slice (that is the off-by-one).
export const ymd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const sameYMD = (a, b) => ymd(a) === ymd(b);

// Parse an admin-entered date + time as LOCAL wall time. Returns a real Date
// (absolute instant). Storage is .toISOString() on the caller side.
export const combineLocal = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr || '09:00'}`);

// A month as weeks of 7 day-cells, weeks starting Sunday, always 6 rows so the
// grid never changes height as you page through the year.
export const buildMonthMatrix = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const weeks = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w += 1) {
    const week = [];
    for (let d = 0; d < 7; d += 1) {
      week.push({
        date: new Date(cursor),
        iso: ymd(cursor),
        inMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

// Short local time like "2:00 PM". Used all over the grid and cards.
export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export const fmtTimeRange = (startIso, endIso) => `${fmtTime(startIso)} – ${fmtTime(endIso)}`;

export const fmtDayLong = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

// A stable, unguessable Jitsi room. No account, no key, works in any browser on
// any device and can be embedded later. Named so the operator recognizes it in a
// notification: NeonBurro-<client>-<token>.
export const buildVideoRoom = (clientName) => {
  const slug = String(clientName || 'meeting')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'meeting';
  let token = '';
  try {
    token = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  } catch (e) {
    token = Math.abs(Date.now()).toString(36);
  }
  return `https://meet.jit.si/NeonBurro-${slug}-${token}`;
};

// Given a start instant + duration minutes, the end instant ISO.
export const endFrom = (startIso, minutes) =>
  new Date(new Date(startIso).getTime() + minutes * 60000).toISOString();
