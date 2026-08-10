// src/theme/layout.js
// SENTINEL: NB_PULSE_LAYOUT_V2
//
// ── THE INVARIANT, SAME AS THE STUDIO ───────────────────────────────────────
//
//   Content is LEFT ALIGNED, not centred. Every page in Pulse starts on the
//   same x, at every viewport width, and that x is one number.
//
// V1 of AppShell used maxW 1400px with mx auto and a five step gutter
// (base 4, sm 5, md 6, lg 8, xl 10). Two consequences, both bad in a tool
// somebody stares at for six hours a day.
//
//   1. On a wide monitor the whole app drifted to the middle of the screen
//      while the sidebar stayed pinned left, so the gap between the nav and
//      the content grew as the window did.
//   2. Five gutter steps means the left edge of the content moves four times
//      between a phone and a desktop, so nothing ever lines up with anything
//      for long enough to be learned.
//
// One rail. One sheet. Left aligned. Same decision the marketing site made and
// for the same reason, which is that a fixed element can only match a fixed
// left edge.
//
// ── WHY THE NUMBERS DIFFER FROM THE STUDIO ──────────────────────────────────
// neonburro.com is a magazine and runs a 40px rail against a 1680px sheet.
// Pulse is a tool. It already spends 236px on a sidebar, its rows are dense and
// its readers are working rather than reading, so the rail is tighter and the
// sheet is wider. The SHAPE is identical, the values are tuned.
//
// No oxford commas, no em dashes.

// ── the rail ────────────────────────────────────────────────────────────────
export const RAIL = { base: 5, md: 7 };
export const RAIL_PX = { base: 20, md: 28 };

// ── the sheet ───────────────────────────────────────────────────────────────
export const SHEET = '1560px';

// ── the sidebar ─────────────────────────────────────────────────────────────
export const SIDEBAR_W = '236px';
export const SIDEBAR_W_COLLAPSED = '68px';

// ── the bottom bar ──────────────────────────────────────────────────────────
export const TABBAR_H = '64px';
export const TABBAR_PAD = 'calc(64px + env(safe-area-inset-bottom) + 16px)';

// ── measure ─────────────────────────────────────────────────────────────────
export const MEASURE = '620px';

// ── rhythm ──────────────────────────────────────────────────────────────────
export const BAND_Y = { base: 6, md: 9 };
export const STACK = { base: 8, md: 12 };

// ── motion ──────────────────────────────────────────────────────────────────
export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const FAST = '160ms';
export const SLOW = '260ms';

// ── FLUID TYPE ──────────────────────────────────────────────────────────────
//
// Breakpoint type jumps. At 767px a heading is 26px and at 768px it is 44px, so
// there is one pixel of window width where the whole page reorganises itself.
// Nobody sees that on a phone or on a desktop. Everybody sees it on a tablet, on
// a split screen, and every time somebody drags a window.
//
// fluid() interpolates instead. The value grows continuously between a small
// viewport and the sheet, then stops. Below 380px it holds the minimum so a
// small phone never gets unreadable, above 1560px it holds the maximum so a
// television does not get a headline you can read from the kitchen.
//
// Use it for anything whose size should track the window: headings, hero
// numbers, section titles. Do NOT use it for body copy, labels or table text.
// Those want one size everywhere, because a row of data that changes size as
// you resize the window is a row that is harder to scan, and 14px is 14px for a
// reason at every width.
export const fluid = (min, max, minVw = 380, maxVw = 1560) =>
  `clamp(${min}px, calc(${min}px + ${max - min} * ((100vw - ${minVw}px) / ${maxVw - minVw})), ${max}px)`;

// The scale. Named by job rather than by size, so a component asks for what it
// is instead of guessing a number.
export const TYPE = {
  hero: fluid(30, 60),     // the one number or phrase a page is about
  title: fluid(21, 32),    // page and section titles
  section: fluid(15, 18),  // sub heads inside a section
  body: '14px',            // fixed. see the note above
  small: '13px',
  label: '11px',
  micro: '9px',
};

export default {
  RAIL, RAIL_PX, SHEET, SIDEBAR_W, SIDEBAR_W_COLLAPSED,
  TABBAR_H, TABBAR_PAD, MEASURE, BAND_Y, STACK, EASE, FAST, SLOW, fluid, TYPE,
};
