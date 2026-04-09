// src/theme/typography.js
// Matches neonburro.com public site typography
// Inter for UI, JetBrains Mono for technical/mono text

export const typography = {
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSizes: {
    '2xs': '11px',
    'xs': '13px',
    'sm': '15px',
    'md': '16px',
    'lg': '18px',
    'xl': '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '32px',
    '5xl': '40px',
    '6xl': '48px',
    '7xl': '60px',
    '8xl': '72px',
    '9xl': '96px',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeights: {
    none: 1,
    tight: 1.1,
    snug: 1.2,
    normal: 1.3,
    base: 1.5,
    relaxed: 1.625,
    loose: 1.75,
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

export default typography;