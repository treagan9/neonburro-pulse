// src/lib/invoiceConstants.js
// Shared constants for the invoicing surface.
// Imported by Invoicing/index.jsx, InvoiceEditor.jsx, InvoiceList.jsx, SprintEditRow.jsx.

// Statuses that mean "the client has it but hasn't paid yet"
export const SENT_STATUSES = ['sent', 'viewed', 'partial', 'overdue'];

// Statuses that include paid (used by InvoiceList for the eye-icon visibility check)
export const SENT_LIKE_STATUSES = ['sent', 'viewed', 'partial', 'overdue', 'paid'];

// Funding modes a sprint can be assigned. Drives the pill UI on each sprint.
export const FUNDING_MODES = [
  { value: 'approve_only', label: 'Confirm Scope', color: '#737373' },
  { value: 'deposit_50',   label: '50% to Start',  color: '#FFE500' },
  { value: 'pay_full',     label: 'Fund in Full',  color: '#39FF14' },
];

// Status pill colors used in InvoiceList rows
export const STATUS_COLORS = {
  draft:     { color: '#737373', label: 'DRAFT' },
  sent:      { color: '#00E5E5', label: 'SENT' },
  viewed:    { color: '#FFE500', label: 'VIEWED' },
  partial:   { color: '#FFE500', label: 'PARTIAL' },
  overdue:   { color: '#FF3366', label: 'OVERDUE' },
  paid:      { color: '#39FF14', label: 'PAID' },
  cancelled: { color: '#525252', label: 'CANCELLED' },
};

// Shared tooltip props - dark surface, white text, soft border, generous padding.
// Use anywhere on the invoicing surface to keep tooltips readable.
export const TOOLTIP_PROPS = {
  placement: 'top',
  hasArrow: true,
  bg: 'surface.900',
  color: 'white',
  fontSize: 'xs',
  fontWeight: '600',
  px: 3,
  py: 2,
  borderRadius: 'md',
  border: '1px solid',
  borderColor: 'surface.700',
};

// Label style used for field captions inside the editor (CLIENT, PROJECT, SPRINTS, etc.)
export const FIELD_LABEL = {
  fontSize: '2xs',
  fontWeight: '700',
  color: 'surface.600',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontFamily: 'mono',
  mb: 2,
  display: 'block',
};

// "Naked" input style used for fields inside the editor and modals.
// Single-line input with bottom border only.
export const NAKED_INPUT = {
  bg: 'transparent',
  border: 'none',
  borderBottom: '1px solid',
  borderColor: 'surface.800',
  borderRadius: 0,
  color: 'white',
  fontSize: 'sm',
  h: '40px',
  px: 0,
  _focus: { borderColor: 'brand.500', boxShadow: 'none' },
  _placeholder: { color: 'surface.700' },
};

// Currency formatter used everywhere on the invoicing surface
export const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Compact currency for list rows (1.5k, 2.3k, etc.)
export const formatCurrencyCompact = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
};
