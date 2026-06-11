// src/theme/colors.js
// NeonBurro Pulse — unified palette, aligned to the marketing repo.
// SENTINEL: NB_PULSE_COLORS_V2
//
// Discipline mirrors the marketing colors.js: the existing surface/brand/accent
// /status/text/divider keys keep their SHAPE so no component breaks. Values are
// repainted (cyan -> Topo Lime, cool -> slightly warmed near-black). Marketing
// aliases (accent.signal, brown ramp, alpenglow) are ADDED on top, opt-in.

const colors = {
  // Brand — repainted from cyan #00E5E5 to Topo Lime. Every brand.500 read in
  // the app now resolves to lime: buttons, focus, active rails, online dots.
  brand: {
    50:  '#F7FAE8',
    100: '#EEF5CC',
    200: '#E2EDA6',
    300: '#D6E588',
    400: '#D2E26B',  // hover / lit  (was cyan 400)
    500: '#C5D957',  // PRIMARY Topo Lime (was #00E5E5)
    600: '#A6B84A',  // pressed / dim
    700: '#85953A',
    800: '#5E6B29',
    900: '#3A4319',
  },

  // Surface — kept near-black for a data tool, warmed a few degrees toward the
  // marketing browns so it reads as the same family, not a cold clone.
  surface: {
    50:  '#FAF9F7',
    100: '#F5F3F0',
    200: '#E6E3DE',
    300: '#D4D0C9',
    400: '#A3A09A',
    500: '#757370',   // muted label text
    600: '#525049',
    700: '#403E39',   // borders / dividers strong
    800: '#252420',   // hover / active
    850: '#1C1B18',   // elevated cards, modals
    900: '#141312',   // cards
    950: '#0B0B0A',   // canvas (matches marketing surface.base #0B0B0C)
  },

  // Accent — neon repainted to Topo Lime so "live/active/funded" reads green
  // like the marketing online signal. banana kept for pending/impersonation,
  // coral for destructive, purple for messages, etc.
  accent: {
    neon:   '#C5D957',  // success / active / live / funded  (was #39FF14)
    banana: '#FFE500',  // warnings / pending / impersonation
    coral:  '#FF3366',  // destructive / errors / overdue
    purple: '#8B5CF6',  // messages / communication
    cool:   '#6C6F97',  // info  (was #00B8E6, now marketing Horizon Relay)
    warm:   '#C8893B',  // reserved, warm  (marketing-aligned amber)

    // Marketing alias. Topo Lime as the explicit live signal. New work reads
    // accent.signal so the intent ("this is the online color") is legible.
    signal:       '#C5D957',
    signalBright: '#D2E26B',
    signalDim:    '#A6B84A',
  },

  // Status — green pair repainted to lime to match. Muted pairs warmed slightly.
  status: {
    green:      '#C5D957',
    greenMuted: '#2A3017',
    gold:       '#FFE500',
    goldMuted:  '#3D3520',
    red:        '#FF3366',
    redMuted:   '#4A1A2A',
    blue:       '#6C6F97',
    blueMuted:  '#22232F',
    purple:     '#8B5CF6',
    purpleMuted:'#2D2640',
    gray:       '#808080',
    grayMuted:  '#252420',
  },

  text: {
    primary:   '#F4F3F1',   // matches marketing text.primary
    secondary: 'rgba(244,243,241,0.65)',
    tertiary:  'rgba(244,243,241,0.45)',
    muted:     'rgba(244,243,241,0.30)',
    deepMuted: 'rgba(244,243,241,0.15)',
  },

  divider: {
    soft:   'rgba(244,243,241,0.06)',
    medium: 'rgba(244,243,241,0.10)',
    accent: 'rgba(197,217,87,0.15)',  // lime, was cyan
  },

  // ---- MARKETING-ALIGNED ADDITIONS (opt-in, additive) ----
  // Burro material ramp, identical to marketing. For warm accents, avatars,
  // editorial tile tints, hero moments. Not for the working canvas.
  brown: {
    900: '#241A16',
    800: '#4A382F',
    700: '#6B5245',
    600: '#8A6857',
    500: '#A8846E',
    400: '#C39D7F',
  },

  // Alpenglow warm-light surfaces, identical to marketing. For any future
  // editorial / print / light-mode moment inside Pulse. Opt-in only.
  alpenglow: {
    base:   '#F3EDE3',
    raised: '#DDD2C2',
    sunken: '#E8E0D4',
    ink:    '#241A16',
    inkSecondary: '#4A382F',
    inkMuted: '#6B5245',
  },
};

export default colors;
