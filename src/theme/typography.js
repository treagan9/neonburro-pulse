// src/theme/typography.js
// NeonBurro design system — type scale
// Three voices: display (Inter), body (Inter), mono (JetBrains Mono).
// Plus Fraunces for marquee numbers and editorial moments.
//
// Fraunces is loaded via Google Fonts as a variable font (weights 100-900).
// Use it deliberately — for money amounts, big stats, editorial headlines.
// Don't use it for UI chrome.

export const typography = {
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace",
    display: "'Fraunces', Georgia, 'Times New Roman', serif",
  },

  // Scale — use keys liberally, values match design doc
  // Mobile scales down via responsive array syntax at the component level
  fontSizes: {
    '3xs': '10px',   // Mobile label
    '2xs': '11px',   // Desktop label
    'xs': '13px',    // Small body
    'sm': '15px',    // Compact body
    'md': '16px',    // Base body (never go smaller on mobile)
    'lg': '18px',    // Body L, intro paragraphs
    'xl': '22px',    // Display S mobile
    '2xl': '28px',   // Display S desktop, Display M mobile
    '3xl': '32px',   // Fraunces mobile, Display M transition
    '4xl': '36px',   // Display M desktop, Fraunces medium
    '5xl': '44px',   // Display XL mobile, Display L mobile transition
    '6xl': '48px',   // Display L desktop, Fraunces large
    '7xl': '56px',
    '8xl': '64px',   // Display XL desktop, hero client name
    '9xl': '80px',
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
    tight: 1.1,      // Display
    snug: 1.2,       // Large text
    normal: 1.35,    // Body L
    base: 1.5,       // Body default
    relaxed: 1.625,  // Long form
    loose: 1.75,
  },

  letterSpacings: {
    tightest: '-0.04em',   // Display XL
    tighter: '-0.03em',    // Display L
    tight: '-0.02em',      // Display M/S
    snug: '-0.01em',       // Body L
    normal: '0',           // Body
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.15em',      // Labels (uppercase mono feel)
  },

  // Semantic text styles — use these in components instead of stacking props
  // Access via theme.textStyles.displayXl etc., OR apply via <Text textStyle="displayXl">
  textStyles: {
    displayXl: {
      fontFamily: 'body',
      fontSize: ['5xl', '5xl', '8xl'],     // Mobile 44px → Desktop 64px
      fontWeight: 700,
      lineHeight: 'tight',
      letterSpacing: 'tightest',
    },
    displayL: {
      fontFamily: 'body',
      fontSize: ['4xl', '4xl', '6xl'],     // Mobile 36px → Desktop 48px
      fontWeight: 700,
      lineHeight: 'tight',
      letterSpacing: 'tighter',
    },
    displayM: {
      fontFamily: 'body',
      fontSize: ['2xl', '2xl', '4xl'],     // Mobile 28px → Desktop 36px
      fontWeight: 600,
      lineHeight: 'snug',
      letterSpacing: 'tight',
    },
    displayS: {
      fontFamily: 'body',
      fontSize: ['xl', 'xl', '2xl'],       // Mobile 22px → Desktop 28px
      fontWeight: 600,
      lineHeight: 'snug',
      letterSpacing: 'tight',
    },

    // Fraunces editorial for numbers and money
    frauncesHero: {
      fontFamily: 'display',
      fontSize: ['5xl', '5xl', '8xl'],
      fontWeight: 700,
      lineHeight: 'tight',
      letterSpacing: 'tight',
      fontVariationSettings: "'opsz' 144",
    },
    frauncesLarge: {
      fontFamily: 'display',
      fontSize: ['3xl', '3xl', '5xl'],
      fontWeight: 600,
      lineHeight: 'snug',
      letterSpacing: 'tight',
      fontVariationSettings: "'opsz' 72",
    },
    frauncesMedium: {
      fontFamily: 'display',
      fontSize: ['2xl', '2xl', '3xl'],
      fontWeight: 600,
      lineHeight: 'snug',
      letterSpacing: 'tight',
      fontVariationSettings: "'opsz' 48",
    },

    bodyL: {
      fontFamily: 'body',
      fontSize: ['md', 'md', 'lg'],        // Mobile 16px → Desktop 18px
      fontWeight: 500,
      lineHeight: 'normal',
      letterSpacing: 'snug',
    },
    bodyM: {
      fontFamily: 'body',
      fontSize: 'md',                       // Always 16px minimum
      fontWeight: 400,
      lineHeight: 'base',
    },
    bodyS: {
      fontFamily: 'body',
      fontSize: 'xs',                       // 13px
      fontWeight: 400,
      lineHeight: 'base',
    },

    label: {
      fontFamily: 'mono',
      fontSize: ['3xs', '3xs', '2xs'],     // Mobile 10px → Desktop 11px
      fontWeight: 600,
      letterSpacing: 'widest',
      textTransform: 'uppercase',
    },
    metadata: {
      fontFamily: 'mono',
      fontSize: 'xs',                       // 13px
      fontWeight: 500,
      letterSpacing: 'normal',
    },
  },
};

export default typography;
