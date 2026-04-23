// src/theme/colors.js
// NeonBurro design system — unified palette
// Used by both Pulse admin and the public client portal.
// Surfaces go from near-black canvas up through layered tones.
// Accents are jewelry — used deliberately, not as wallpaper.

const colors = {
  // Brand cyan — primary interactive color
  brand: {
    50: '#E0FFFF',
    100: '#B3FFFF',
    200: '#80FFFF',
    300: '#4DFFFF',
    400: '#26F2F2',
    500: '#00E5E5',
    600: '#00B8B8',
    700: '#008A8A',
    800: '#005C5C',
    900: '#002E2E',
  },

  // Surface scale — from near-black canvas up through elevated surfaces.
  // Use 950 for the canvas, 900/850 for cards, 800/700 for elevated states.
  // Steps 50-500 are for text/foreground elements.
  surface: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#252525',   // Surface 3 — hover/active
    850: '#1C1C1C',   // Surface 2 — elevated cards, modals
    900: '#141414',   // Surface 1 — cards
    950: '#0A0A0A',   // Canvas — base background
  },

  // Accent colors — used one per view, deliberately
  accent: {
    neon: '#39FF14',      // Success, active, live, "funded"
    banana: '#FFE500',    // Warnings, pending, admin impersonation
    coral: '#FF3366',     // Destructive, errors, overdue
    purple: '#8B5CF6',    // Messages, communication
    cool: '#00B8E6',      // Info
    warm: '#FF6B00',      // Reserved — use rarely
  },

  // Status colors — full + muted pairs for badges, chips, subtle callouts
  status: {
    green: '#39FF14',
    greenMuted: '#1A3A1A',
    gold: '#FFE500',
    goldMuted: '#3D3520',
    red: '#FF3366',
    redMuted: '#4A1A2A',
    blue: '#00B8E6',
    blueMuted: '#1A2A3D',
    purple: '#8B5CF6',
    purpleMuted: '#2D2640',
    gray: '#808080',
    grayMuted: '#252525',
  },

  // Semantic aliases for direct use in sx props
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.65)',
    tertiary: 'rgba(255, 255, 255, 0.45)',
    muted: 'rgba(255, 255, 255, 0.30)',
    deepMuted: 'rgba(255, 255, 255, 0.15)',
  },

  divider: {
    soft: 'rgba(255, 255, 255, 0.06)',
    medium: 'rgba(255, 255, 255, 0.10)',
    accent: 'rgba(0, 229, 229, 0.15)',
  },
};

export default colors;
