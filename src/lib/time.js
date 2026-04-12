// src/lib/time.js
// All timestamp formatting in Pulse goes through here
// Absolute times render in America/Denver (MST/MDT auto-switching for DST)
// Relative times are timezone-agnostic ("5 min ago" is the same everywhere)

import { formatDistanceToNow, parseISO } from 'date-fns';

const TZ = 'America/Denver';
const LOCALE = 'en-US';

// ============================================================
// PRIMITIVES
// ============================================================

const toDate = (input) => {
  if (input instanceof Date) return input;
  if (typeof input === 'string') return parseISO(input);
  if (typeof input === 'number') return new Date(input);
  return null;
};

// ============================================================
// ABSOLUTE FORMATS (always MST/MDT)
// ============================================================

/**
 * "Apr 10"
 */
export const formatDateShort = (input) => {
  const d = toDate(input);
  if (!d) return '';
  return d.toLocaleString(LOCALE, {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
  });
};

/**
 * "Apr 10, 2026"
 */
export const formatDate = (input) => {
  const d = toDate(input);
  if (!d) return '';
  return d.toLocaleString(LOCALE, {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * "1:34 PM"
 */
export const formatTime = (input) => {
  const d = toDate(input);
  if (!d) return '';
  return d.toLocaleString(LOCALE, {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * "Apr 10 at 1:34 PM"
 */
export const formatDateTime = (input) => {
  const d = toDate(input);
  if (!d) return '';
  const date = d.toLocaleString(LOCALE, {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleString(LOCALE, {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${date} at ${time}`;
};

/**
 * "Apr 10, 2026 at 1:34 PM MST"
 * Use when displaying formal/historical timestamps where "MST" signals intent
 */
export const formatFullMST = (input) => {
  const d = toDate(input);
  if (!d) return '';
  return `${formatDate(d)} at ${formatTime(d)} ${getTzAbbrev(d)}`;
};

/**
 * Returns "MST" or "MDT" depending on whether DST is active on that date
 */
export const getTzAbbrev = (input) => {
  const d = toDate(input);
  if (!d) return 'MST';
  // Use Intl's timeZoneName=short to get MST/MDT for the given date
  const parts = new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    timeZoneName: 'short',
  }).formatToParts(d);
  const tzPart = parts.find((p) => p.type === 'timeZoneName');
  return tzPart?.value || 'MST';
};

// ============================================================
// RELATIVE FORMATS (timezone-agnostic)
// ============================================================

/**
 * "5 minutes ago" / "in 2 hours" / "3 days ago"
 */
export const formatRelative = (input) => {
  const d = toDate(input);
  if (!d) return '';
  return formatDistanceToNow(d, { addSuffix: true });
};

/**
 * Smart default:
 * - Less than 24h ago: "5 min ago"
 * - More than 24h ago: "Apr 10 at 1:34 PM"
 *
 * Use this when you want compact but informative timestamps
 */
export const formatSmart = (input) => {
  const d = toDate(input);
  if (!d) return '';
  const now = Date.now();
  const diff = now - d.getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  if (diff < ONE_DAY && diff >= 0) {
    return formatRelative(d);
  }
  return formatDateTime(d);
};

// ============================================================
// SPECIALIZED
// ============================================================

/**
 * For form fields - yyyy-mm-dd in MST (for <input type="date">)
 */
export const toDateInputValue = (input) => {
  const d = toDate(input);
  if (!d) return '';
  const parts = new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${day}`;
};

/**
 * "2m 34s" - for build durations
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '—';
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  if (mins < 60) return `${mins}m ${rem}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
};
