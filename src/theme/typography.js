// src/theme/typography.js
// NeonBurro Pulse — type scale, ONE font.
//
// Pulse used to run three faces: Geist Sans to read, JetBrains Mono for labels,
// Fraunces for marquee numbers. Tyler wanted one clean rounded family for the
// whole tool, numbers included, and no second font anywhere. That family is Rubik
// (rounded corners, geometric, crisp at 13px, clean numerals). Every token below
// points at it: body and heading read, `mono` still exists as a name so the
// uppercase tracked kickers keep working (they are Rubik now, not a monospace),
// and `display` is Rubik too so big numbers are the same clean face as everything
// else instead of a serif. Swapping the whole system to another font is a one line
// change here. Loaded in src/main.jsx. No oxford commas, no em dashes.

const RUBIK = "'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

export const typography = {
  fonts: {
    heading: RUBIK,
    body:    RUBIK,
    mono:    RUBIK,
    display: RUBIK,
  },

  fontSizes: {
    '3xs': '10px', '2xs': '11px', 'xs': '13px', 'sm': '15px', 'md': '16px',
    'lg': '18px', 'xl': '22px', '2xl': '28px', '3xl': '32px', '4xl': '36px',
    '5xl': '44px', '6xl': '48px', '7xl': '56px', '8xl': '64px', '9xl': '80px',
  },

  fontWeights: {
    normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800,
  },

  lineHeights: {
    none: 1, tight: 1.1, snug: 1.2, normal: 1.35, base: 1.5, relaxed: 1.625, loose: 1.75,
  },

  letterSpacings: {
    tightest: '-0.04em', tighter: '-0.03em', tight: '-0.02em', snug: '-0.01em',
    normal: '0', wide: '0.025em', wider: '0.05em', widest: '0.15em',
  },

  textStyles: {
    displayXl: { fontFamily: 'body', fontSize: ['5xl', '5xl', '8xl'], fontWeight: 700, lineHeight: 'tight', letterSpacing: 'tightest' },
    displayL:  { fontFamily: 'body', fontSize: ['4xl', '4xl', '6xl'], fontWeight: 700, lineHeight: 'tight', letterSpacing: 'tighter' },
    displayM:  { fontFamily: 'body', fontSize: ['2xl', '2xl', '4xl'], fontWeight: 600, lineHeight: 'snug', letterSpacing: 'tight' },
    displayS:  { fontFamily: 'body', fontSize: ['xl', 'xl', '2xl'], fontWeight: 600, lineHeight: 'snug', letterSpacing: 'tight' },

    frauncesHero:   { fontFamily: 'display', fontSize: ['5xl', '5xl', '8xl'], fontWeight: 700, lineHeight: 'tight', letterSpacing: 'tight', fontVariationSettings: "'opsz' 144" },
    frauncesLarge:  { fontFamily: 'display', fontSize: ['3xl', '3xl', '5xl'], fontWeight: 600, lineHeight: 'snug', letterSpacing: 'tight', fontVariationSettings: "'opsz' 72" },
    frauncesMedium: { fontFamily: 'display', fontSize: ['2xl', '2xl', '3xl'], fontWeight: 600, lineHeight: 'snug', letterSpacing: 'tight', fontVariationSettings: "'opsz' 48" },

    bodyL: { fontFamily: 'body', fontSize: ['md', 'md', 'lg'], fontWeight: 500, lineHeight: 'normal', letterSpacing: 'snug' },
    bodyM: { fontFamily: 'body', fontSize: 'md', fontWeight: 400, lineHeight: 'base' },
    bodyS: { fontFamily: 'body', fontSize: 'xs', fontWeight: 400, lineHeight: 'base' },

    label:    { fontFamily: 'mono', fontSize: ['3xs', '3xs', '2xs'], fontWeight: 600, letterSpacing: 'widest', textTransform: 'uppercase' },
    metadata: { fontFamily: 'mono', fontSize: 'xs', fontWeight: 500, letterSpacing: 'normal' },
  },
};

export default typography;
