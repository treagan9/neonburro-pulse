// src/theme/typography.js
// NeonBurro Pulse — type scale, aligned to brand canon.
// Three voices: heading + body (Geist Sans, was Inter), mono (JetBrains Mono).
// Fraunces retained for marquee numbers and editorial moments (money, big stats).

export const typography = {
  fonts: {
    heading: "'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body:    "'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono:    "'JetBrains Mono', 'Geist Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace",
    display: "'Fraunces', Georgia, 'Times New Roman', serif",
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
