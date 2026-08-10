// src/theme/layout.js
// SENTINEL: NB_PULSE_LAYOUT_V1
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
// Pulse is a tool. It already spends 240px on a sidebar, its rows are dense and
// its readers are working rather than reading, so the rail is tighter and the
// sheet is wider. The SHAPE is identical, the values are tuned.
//
// No oxford commas, no em dashes.

// ── the rail ────────────────────────────────────────────────────────────────
// ONE desktop value. base 20px, md and up 28px. Tighter than the studio because
// the sidebar is already holding the left margin for us.
export const RAIL = { base: 5, md: 7 };
export const RAIL_PX = { base: 20, md: 28 };

// ── the sheet ───────────────────────────────────────────────────────────────
// Caps a data table so it cannot run 3000px wide. It does NOT centre it.
export const SHEET = '1560px';

// ── the sidebar ─────────────────────────────────────────────────────────────
export const SIDEBAR_W = '236px';
export const SIDEBAR_W_COLLAPSED = '68px';

// ── the bottom bar ──────────────────────────────────────────────────────────
// Height plus the safe area. Pages pad by this so nothing hides under the tabs.
export const TABBAR_H = '64px';
export const TABBAR_PAD = 'calc(64px + env(safe-area-inset-bottom) + 16px)';

// ── measure ─────────────────────────────────────────────────────────────────
export const MEASURE = '620px';

// ── rhythm ──────────────────────────────────────────────────────────────────
export const BAND_Y = { base: 6, md: 9 };
export const STACK = { base: 8, md: 12 };

// ── motion ──────────────────────────────────────────────────────────────────
// One curve for the whole app. Heavy ease out, leaves fast and lands almost
// still. Everything that moves in Pulse uses this or it does not move.
export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const FAST = '160ms';
export const SLOW = '260ms';

export default {
  RAIL, RAIL_PX, SHEET, SIDEBAR_W, SIDEBAR_W_COLLAPSED,
  TABBAR_H, TABBAR_PAD, MEASURE, BAND_Y, STACK, EASE, FAST, SLOW,
};
