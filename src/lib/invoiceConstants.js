// src/lib/invoiceConstants.js
// Shared constants for the invoicing surface (admin UI, dark).
// Repainted to brand tokens: Topo Lime signal, softer off-white ink.

import colors from '../theme/colors';

export const SENT_STATUSES = ['sent', 'viewed', 'partial', 'overdue'];

export const SENT_LIKE_STATUSES = ['sent', 'viewed', 'partial', 'overdue', 'paid'];

export const FUNDING_MODES = [
  { value: 'approve_only', label: 'Confirm Scope', color: colors.surface[500] },
  { value: 'deposit_50',   label: '50% to Start',  color: colors.accent.banana },
  { value: 'pay_full',     label: 'Fund in Full',  color: colors.accent.signal },
];

export const STATUS_COLORS = {
  draft:     { color: colors.surface[500],  label: 'DRAFT' },
  sent:      { color: colors.accent.signal, label: 'SENT' },
  viewed:    { color: colors.accent.banana, label: 'VIEWED' },
  partial:   { color: colors.accent.banana, label: 'PARTIAL' },
  overdue:   { color: colors.accent.coral,  label: 'OVERDUE' },
  paid:      { color: colors.status.green,  label: 'PAID' },
  cancelled: { color: colors.surface[600],  label: 'CANCELLED' },
};

export const PAYMENT_METHODS = [
  { value: 'check', label: 'Check', referenceLabel: 'Check number' },
  { value: 'wire',  label: 'Wire transfer', referenceLabel: 'Wire confirmation #' },
  { value: 'ach',   label: 'ACH', referenceLabel: 'ACH reference' },
  { value: 'cash',  label: 'Cash', referenceLabel: 'Receipt #' },
  { value: 'other', label: 'Other', referenceLabel: 'Reference' },
];

export const TOOLTIP_PROPS = {
  placement: 'top',
  hasArrow: true,
  bg: 'surface.900',
  color: 'text.primary',
  fontSize: 'xs',
  fontWeight: '600',
  px: 3,
  py: 2,
  borderRadius: 'md',
  border: '1px solid',
  borderColor: 'surface.700',
};

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

export const NAKED_INPUT = {
  bg: 'transparent',
  border: 'none',
  borderBottom: '1px solid',
  borderColor: 'surface.800',
  borderRadius: 0,
  color: 'text.primary',
  fontSize: 'sm',
  h: '40px',
  px: 0,
  _focus: { borderColor: 'brand.500', boxShadow: 'none' },
  _placeholder: { color: 'surface.700' },
};

export const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatCurrencyCompact = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
};
