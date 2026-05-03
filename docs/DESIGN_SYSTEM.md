# NeonBurro Portal — Design System v1

**Date:** April 23, 2026
**Status:** Approved direction, execution in progress
**Scope:** Client portal (neonburro.com/account/) and Pulse admin (pulse.neonburro.com)

Both surfaces share this language. Same palette, same type, same motion. Admin gets more density, client gets more breathing room, but they feel like siblings.

---

## Voice

Editorial dark mode with fashion-tech signatures. Apple-grade polish, Substack-grade typography, a touch of Gentle Monster and Off-White DNA. Premium without being cold. Creative without being noisy. The portal should feel like a place clients want to visit, not a tool they have to use.

---

## Palette

### Surfaces
| Token | Value | Usage |
|---|---|---|
| Canvas base | `#0A0A0A` | Slightly warm black, reduces eye strain |
| Surface 1 | `#141414` | Cards, primary content containers |
| Surface 2 | `#1C1C1C` | Elevated cards, modals |
| Surface 3 | `#252525` | Hover states, active surfaces |

### Dividers and lines
| Token | Value | Usage |
|---|---|---|
| Divider soft | `rgba(255,255,255,0.06)` | Hairlines when needed |
| Divider medium | `rgba(255,255,255,0.10)` | Section breaks |
| Accent hairline | `rgba(0,229,229,0.15)` | Focus/active dividers |

### Text
| Token | Value | Usage |
|---|---|---|
| Primary | `#FFFFFF` | Headlines, primary content |
| Secondary | `rgba(255,255,255,0.65)` | Body text |
| Tertiary | `rgba(255,255,255,0.45)` | Metadata, supporting |
| Muted | `rgba(255,255,255,0.30)` | Placeholders, inactive |
| Deep muted | `rgba(255,255,255,0.15)` | Near-invisible decoration |

### Accents (used as jewelry, 30% less than current)
| Token | Value | Usage |
|---|---|---|
| Cyan | `#00E5E5` | Primary actions, brand identity |
| Neon green | `#39FF14` | Success, active, live, "funded" |
| Banana | `#FFE500` | Warnings, pending, admin impersonation |
| Red | `#FF3366` | Destructive, errors, overdue |
| Purple | `#8B5CF6` | Messages, communication |

**Rule:** one accent per view. If an accent appears it is a deliberate signal, not decoration.

---

## Typography

Three voices: display, body, mono. Plus Fraunces for marquee numbers.

### Fonts
- **Display and body:** Inter (system fallback)
- **Numbers (large):** Fraunces variable from Google Fonts, weights 500-800
- **Monospace:** JetBrains Mono, SF Mono fallback

### Desktop scale
| Role | Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| Display XL | 64px | 700 | -0.04em | Client name headers |
| Display L | 48px | 700 | -0.03em | Page headlines |
| Display M | 36px | 600 | -0.02em | Section heroes |
| Display S | 28px | 600 | -0.02em | Card headlines |
| Body L | 18px | 500 | -0.01em | Intro paragraphs |
| Body M | 16px | 400 | 0 | Standard body |
| Body S | 14px | 400 | 0 | Secondary body |
| Label | 11px | 600 | 0.15em | Uppercase mono feel |
| Metadata | 12px | 500 | 0 | Timestamps, IDs |
| Fraunces | 36-64px | 600-700 | -0.02em | Marquee numbers, money |

### Mobile scale (everything shrinks except body which stays readable)
| Role | Size | Weight |
|---|---|---|
| Display XL | 44px | 700 |
| Display L | 36px | 700 |
| Display M | 28px | 600 |
| Display S | 22px | 600 |
| Body L | 17px | 500 |
| Body M | 16px | 400 (never smaller, prevents iOS zoom) |
| Body S | 14px | 400 |
| Label | 10px | 600 |
| Fraunces | 32-44px | 600-700 |

### Rules
- Labels drop from weight 700 to 600. Less shouty.
- Monospace only for timestamps, IDs, currency with symbols, margin section labels.
- Period after headlines as editorial signature: "Hi Steve." not "Hi Steve"
- No ALL CAPS except on small labels.

---

## Spacing

4px base grid. Use these specifically:

| Token | Value |
|---|---|
| xs | 8px |
| sm | 16px |
| md | 24px |
| lg | 40px |
| xl | 64px |
| 2xl | 96px |

**Common pairings:**
- Card internal padding: 32px desktop, 20px mobile
- Section gap: 48-64px desktop, 32-40px mobile
- Page outer padding: 48px desktop, 20px mobile

**Rule:** when in doubt, add more space.

---

## Mobile design

Mobile is not a scaled-down desktop. It is a different product with the same soul. Think iOS apps at their best.

### Rules
1. **Native feel, not responsive feel.** Portal on iPhone should feel like an app Apple shipped.
2. **Bottom-up layout.** Primary actions at the bottom, thumb-reachable.
3. **Fewer elements per screen.** Desktop 4-across becomes mobile 2x2.
4. **Larger touch targets.** Minimum 44x44pt. Buttons 48px min, primary CTA 56px.
5. **Bigger text, not smaller.** Display scales down but body stays 16px minimum.
6. **Tab bar, not sidebar.** 5 destinations max.

### Bottom tab bar (client portal)
Replaces the sidebar. Background Surface 2 with backdrop blur. Height 56px plus safe-area-inset-bottom. Icons 22px, labels 10px below. Active state uses cyan icon plus subtle cyan dot above icon.

Destinations: Overview, Sprints, Messages, Payments, More.

### Mobile layout patterns
- **Stat cards:** 2x2 grid, 20px padding, generous height
- **Activity list:** full-bleed cards edge-to-edge
- **Headers:** hero collapses as you scroll, client name sticks in small header
- **Modals:** become bottom sheets, slide up, 85% viewport, rounded top 20px, drag handle
- **Inputs:** 48px min height, 16px+ font size, correct inputMode, enterKeyHint

### Gestures
- Swipe down on sheet to dismiss
- Pull-to-refresh on list views
- Haptic feedback on primary actions via navigator.vibrate

### Mobile motion
- Page transitions: slide in from right, 280ms, ease-out
- Back nav: slide out to right, 240ms
- Sheet open: slide up, 320ms `cubic-bezier(0.16, 1, 0.3, 1)` spring
- Tab switch: instant, tiny scale-bounce on icon (120ms)

### Mobile signatures
- **The Burro peek.** Scroll up at top, client's Burro peeks down briefly.
- **Number reveal.** Stats count-up on load. $0 to $2,441 over 400ms.
- **Sticky client name.** Collapses into small top header with status dot on scroll.

### Breakpoints
| Range | Layout |
|---|---|
| 0-640px | Mobile: 1 col, bottom nav, mobile scale |
| 641-1024px | Tablet: 1-2 col, hybrid nav |
| 1025-1439px | Desktop: full sidebar, desktop scale |
| 1440px+ | Wide: max 1400px content |

---

## Elevation and depth

Replace hairline borders with tone and shadow.

| State | Background | Shadow |
|---|---|---|
| Card rest | Surface 1 | none |
| Card hover | Surface 2 | `0 2px 8px rgba(0,0,0,0.3)`, lift 2px |
| Card active | Surface 3 | scale 0.99 |
| Modal desktop | Surface 2 | `0 16px 64px rgba(0,0,0,0.5)` |
| Sheet mobile | Surface 2 | `0 -8px 32px rgba(0,0,0,0.4)` |

Borders allowed only on: form inputs (bottom border only), divider hairlines, the impersonation banner.

---

## Corner radius

| Element | Radius |
|---|---|
| Chips, small badges | 8px |
| Buttons | 12px |
| Cards | 16px |
| Modals | 20px |
| Mobile sheets (top only) | 20px |
| Pills | full |
| Inputs | 0 (naked bottom border) |

---

## Motion

| Token | Value | Usage |
|---|---|---|
| Standard | `200ms cubic-bezier(0.4, 0, 0.2, 1)` | Most interactions |
| Fast | `120ms cubic-bezier(0.4, 0, 0.2, 1)` | Micro |
| Slow | `320ms cubic-bezier(0.4, 0, 0.2, 1)` | Page transitions |
| Sheet | `320ms cubic-bezier(0.16, 1, 0.3, 1)` | Bottom sheet spring |

### Interaction grammar
- Hover: lift 2px + tone shift. No text color change.
- Active: `scale(0.98)`, snap back 120ms.
- Focus: 2px cyan ring at 40% opacity, offset 2px.
- Loading: skeleton screens in Surface 2 with subtle pulse. No spinners except full-page loads.

All CSS keyframes or Chakra transition prop. No framer-motion.

---

## Fashion-tech signatures

### 1. Fraunces numbers
Every dollar amount, every large number: Fraunces bold. `$2,441` in serif, "5 sprints" has "5" in serif and "sprints" in sans.

### 2. Period after headlines
"Hi Steve." "Sprints." "Your work in motion." Tiny editorial tic.

### 3. Oversized person
Client name is the biggest thing on the page. 64px desktop, 44px mobile.

### 4. Accent hairlines
1px, 32px long, opacity 0.6, gradient fade at right edge. Under numbers, under section labels.

### 5. Margin labels (desktop only)
Section headers float slightly outside the left edge of cards in small mono. On mobile they move above card in standard position.

### 6. Burro integration
Every client gets a Burro from the collective as their visual identity. Appears in portal header, login greeting, profile hero. Their Burro's palette subtly informs accents. Schema: `burro_slug` column on clients table.

### 7. Logo as brand moment
- Login: 72px desktop / 56px mobile, centered, clickable to neonburro.com
- Portal header: 40px desktop / 32px mobile, left-aligned, clickable
- Never accompanied by "Client Portal" text. The logo IS the brand.

---

## Copy

Active voice, present tense, warmth. Letter from a friend, not a SaaS product.

| Before | After |
|---|---|
| "Client Portal" | (removed, logo does the work) |
| "Sign in to view your sprints" | "Pick up where we left off." |
| "Welcome back, {name}!" | "Hi {first_name}." |
| "You have 3 active sprints" | "3 sprints in motion." |
| "Your projects" | "Your work." |
| "Payment History" | "Your runway." |
| "Outstanding Balance" | "To push forward." |
| "Send Message" | "Talk to us." |
| "Sign out" | "See you next time." |

---

## Components

### Buttons
- **Primary pill:** cyan bg, dark text, full radius, lift on hover
- **Secondary pill:** transparent bg, cyan border/text
- **Ghost:** transparent, tertiary text, bg on hover
- **Destructive:** red bg, white text
- **Text link:** cyan, underline on hover, no bg

Mobile: min 48px height. Primary CTA: 56px.

### Cards
- **Stat card:** Surface 1, 32px/20px padding, 16px radius
- **Action card:** Surface 1, clickable, hover lifts to Surface 2
- **Data card:** Surface 1, 24px/16px padding, for lists

### Status indicators
- **Live pulse dot:** 6px, accent color, CSS pulse keyframes
- **Static dot:** 4px, muted color, no animation

### Avatars
- **Client:** 56px desktop / 48px mobile, circle, Burro or initials
- **Admin:** same but with subtle cyan 1px ring
- **Group:** -8px overlap, max 3 + "+N" pill

### Badges
- **Status pill:** 4x10 padding, 11px mono, accent bg at 15% + full text color
- **Tag pill:** softer, white at 5% bg, tertiary text

---

## Implementation order

| Phase | Scope |
|---|---|
| 5.1 | Foundation: fonts, tokens, primitives |
| 5.2 | Login redesign |
| 5.3 | Overview redesign + Burro integration starts |
| 5.4 | Client portal pages: Sprints, Projects, Payments, Messages, Profile |
| 5.5 | Shell: sidebar (desktop), bottom nav (mobile), transitions, skeletons |
| 5.6 | Admin side (Pulse) inherits the system |
| 5.7 | Deep Burro integration: schema, assignment, rendering everywhere |

---

## Locked decisions

1. Apple-grade dark mode with fashion-tech signatures
2. Fraunces for numbers
3. Burro avatars integrated deeply
4. Logo replaces "Client Portal" text, clickable
5. "Pick up where we left off." voice
6. #0A0A0A canvas, not pure black
7. Soft shadows over hairline borders
8. Mono used sparingly
9. Period after headlines
10. Mobile-first bottom nav and bottom sheets
11. 56px touch targets, 16px min body
12. Fraunces count-up animation on stats
13. Sticky collapsing client name header on mobile