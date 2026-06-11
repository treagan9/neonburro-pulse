// src/lib/emailTokens.js
// Single source of truth for colors + assets used in EMAIL HTML.
// Emails cannot read the Chakra theme, so this mirrors the brand palette as raw
// hex for template literals. Edit here to retune every email at once.
//
// ALL emails (client + admin) use one light system: bone surfaces, near-black
// ink, warm brown accents, Topo Lime signal, banana for amounts due. Every
// email leads with the wide crew banner.

export const EMAIL = {
  // Signal — Topo Lime (replaced cyan #00E5E5 everywhere)
  signal:       '#C5D957',
  signalDeep:   '#A6B84A',  // for text on light, passes contrast better

  // Accents
  banana:     '#FFE500',
  bananaDeep: '#9A8B00',  // banana text on light (legible)
  coral:      '#C2402F',  // overdue / destructive on light

  // Funding-mode colors (legible on light surfaces)
  fundFull:    '#6F8A1F',  // Fund in Full (deep lime, readable on bone)
  fundDeposit: '#9A7B00',  // 50% to Start (deep banana)
  fundConfirm: '#6B5245',  // Confirm Scope (burro hide brown)

  // Light surfaces — every email
  page:     '#E8E0D4',  // Ridge Bone, outer page
  card:     '#F3EDE3',  // Sun Paper, main card
  raised:   '#FFFFFF',  // inner panels
  line:     '#DDD2C2',  // Ivory Dust, borders
  lineSoft: '#EBE3D6',  // faint inner rules

  // Ink (text) — warm near-blacks and browns
  ink:      '#241A16',  // Night Tack, primary
  inkSec:   '#4A382F',  // Canyon Stitch, secondary
  inkMuted: '#6B5245',  // Burro Hide, labels/muted
  inkFaint: '#9A8574',  // faintest meta

  // Brand assets
  banner: 'https://pulse.neonburro.com/neon-burro-email-banner.png',
  logo:   'https://pulse.neonburro.com/neon-burro-email-logo.png',
};

export default EMAIL;
