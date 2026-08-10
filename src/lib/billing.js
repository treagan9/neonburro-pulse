// src/lib/billing.js
// SENTINEL: NB_PULSE_BILLING_V1
//
// One vocabulary for money, shared by invoices, subscriptions and the client
// list, so the shop, the portal and the back office cannot disagree about what
// "paid" means.
//
// ════════════════════════════════════════════════════════════════════════════
// THE ONE THING TO READ BEFORE DESIGNING ANY OF THIS
// ════════════════════════════════════════════════════════════════════════════
//
// A CARD CAN BE PULLED. A WALLET CANNOT.
//
// Stripe holds a mandate. On the renewal date it charges the card and we find
// out afterwards. That is a PULL, and every subscription product anybody has
// ever used is built on it.
//
// A stablecoin has no equivalent. There is no standing authorisation that lets
// us reach into somebody's wallet on the first of the month. The customer has
// to sign and send, every single time. That is a PUSH.
//
// So "recurring stablecoin billing" is not a smaller version of "recurring card
// billing". It is a different product:
//
//   card        we charge, they get a receipt, silence means it worked
//   stablecoin  we invoice, they get a reminder, silence means it did not
//
// Anything that treats those as one flow will quietly produce a subscription
// that looks active and has not been paid for four months. The rail belongs on
// the record and every screen has to branch on it.
//
// ── WHERE THE MONEY ACTUALLY LANDS ──────────────────────────────────────────
// Stablecoin settles instantly and finally. There is no chargeback, which is
// genuinely better for us, and no dispute process, which is genuinely worse for
// them. That asymmetry is the reason to offer both rather than to pick one.
//
// ── THE NUMBER YOU MUST STORE ───────────────────────────────────────────────
// USD value ON THE DAY IT CLEARED, recorded at the moment it cleared. A ledger
// that only stores a token amount cannot answer what a year was worth, and a
// ledger that recomputes the value from today's price is telling you a story
// rather than keeping a record.
//
// No oxford commas, no em dashes.

// ── the rails ───────────────────────────────────────────────────────────────

export const RAILS = {
  card: {
    id: 'card',
    label: 'Card',
    processor: 'Stripe',
    // We initiate. The mandate is held by the processor.
    model: 'pull',
    canAutoCharge: true,
    settles: 'Two business days, reversible for months',
    note: 'Chargeback protection for them, chargeback exposure for us.',
    tone: 'accent.cool',
  },
  stablecoin: {
    id: 'stablecoin',
    label: 'Stablecoin',
    processor: 'On chain',
    // They initiate. Every time. There is no mandate to hold.
    model: 'push',
    canAutoCharge: false,
    settles: 'Seconds, and final',
    note: 'No chargebacks in either direction. A reminder is the only lever.',
    tone: 'brand.500',
  },
};

export const RAIL_IDS = Object.keys(RAILS);
export const DEFAULT_RAIL = 'card';

// A record written before rails existed has no rail. It was a card, because
// that is all there was. Never guess forward, only backward.
export const railOf = (record) => RAILS[record?.rail] || RAILS[DEFAULT_RAIL];

export const canAutoCharge = (record) => railOf(record).canAutoCharge;

// ── what a subscription does on its renewal date ────────────────────────────
// The single branch that matters. Everything else in the subscription UI is
// the same for both rails.
export const RENEWAL_ACTION = {
  pull: {
    verb: 'charges',
    happens: 'automatically',
    ifNothing: 'It went through. A failure would have told us.',
    staffAction: null,
  },
  push: {
    verb: 'invoices',
    happens: 'and waits',
    ifNothing: 'Nothing happened. Somebody has to chase it.',
    staffAction: 'Send the reminder',
  },
};

export const renewalAction = (record) => RENEWAL_ACTION[railOf(record).model];

// ── cadence ─────────────────────────────────────────────────────────────────
// Every client renews on their own anchor rather than on a shared billing day.
// interval and interval_count come straight off the subscriptions table, so a
// quarterly is month x 3 and there is no fourth enum to keep in sync.

export const cadenceLabel = (sub) => {
  const n = Number(sub?.interval_count || 1);
  const unit = sub?.interval === 'year' ? 'year' : 'month';
  if (n === 1) return unit === 'year' ? 'Yearly' : 'Monthly';
  if (unit === 'month' && n === 3) return 'Quarterly';
  if (unit === 'month' && n === 6) return 'Twice a year';
  return `Every ${n} ${unit}s`;
};

// Days until the current period closes. Negative means it already has, which on
// a push rail is the entire problem and on a pull rail is usually a webhook we
// have not processed yet.
export const daysToRenewal = (sub, now = new Date()) => {
  if (!sub?.current_period_end) return null;
  const end = new Date(sub.current_period_end);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end - now) / 86400000);
};

export const renewalLabel = (sub, now = new Date()) => {
  const d = daysToRenewal(sub, now);
  if (d === null) return 'No date set';
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Renews today';
  if (d === 1) return 'Renews tomorrow';
  if (d <= 14) return `Renews in ${d}d`;
  return new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── health, for a badge ─────────────────────────────────────────────────────
// 'live' | 'due' | 'late' | 'paused' | 'none'
export const subscriptionHealth = (sub, now = new Date()) => {
  if (!sub) return 'none';
  if (['cancelled', 'draft'].includes(sub.status)) return 'none';
  if (sub.status === 'paused') return 'paused';
  if (sub.status === 'past_due') return 'late';
  const d = daysToRenewal(sub, now);
  if (d !== null && d < 0) return 'late';
  if (d !== null && d <= 7) return 'due';
  return 'live';
};

export const HEALTH_TONE = {
  live: 'brand.500',
  due: 'accent.banana',
  late: 'accent.coral',
  paused: 'surface.500',
  none: 'surface.700',
};

export default { RAILS, railOf, canAutoCharge, renewalAction, cadenceLabel, renewalLabel, subscriptionHealth };
