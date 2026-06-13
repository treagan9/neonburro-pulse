// src/lib/uiConstants.js
// Shared UI constants for Pulse — the design language.
// Imported by Dashboard, Clients, Invoicing, Forms. Topo Lime, tokens only.

import colors from '../theme/colors';

const SIGNAL = colors.accent.signal;

export const PRIMARY_BUTTON_PROPS = {
  bg: 'brand.500',
  color: 'surface.950',
  fontWeight: '700',
  fontSize: 'xs',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  px: 4,
  py: 2,
  h: '36px',
  borderRadius: 'lg',
  cursor: 'pointer',
  userSelect: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1.5,
  transition: 'all 0.15s',
  border: 'none',
  _hover: {
    bg: 'brand.400',
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 16px ${SIGNAL}40`,
  },
  _active: { transform: 'translateY(0)' },
};

export const PRIMARY_BUTTON_ICON_PROPS = { boxSize: 3.5, color: 'surface.950' };
export const PRIMARY_BUTTON_TEXT_PROPS = { color: 'surface.950', fontWeight: '700' };

export const SECONDARY_BUTTON_PROPS = {
  bg: 'surface.900',
  color: 'text.primary',
  fontWeight: '700',
  fontSize: 'xs',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  px: 4,
  py: 2,
  h: '36px',
  borderRadius: 'lg',
  cursor: 'pointer',
  userSelect: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1.5,
  transition: 'all 0.15s',
  border: '1px solid',
  borderColor: 'surface.800',
  _hover: {
    bg: 'surface.850',
    borderColor: 'brand.500',
    transform: 'translateY(-1px)',
  },
  _active: { transform: 'translateY(0)' },
};

export const SECONDARY_BUTTON_ICON_PROPS = { boxSize: 3.5, color: 'text.primary' };

export const SEARCH_INPUT_WRAP_PROPS = {
  bg: 'surface.900',
  border: '1px solid',
  borderColor: 'surface.800',
  borderRadius: 'xl',
  px: 4,
  h: '44px',
  display: 'flex',
  alignItems: 'center',
  gap: 2.5,
  transition: 'all 0.15s',
  _hover: { borderColor: 'surface.700' },
  _focusWithin: {
    borderColor: 'brand.500',
    bg: colors.accent.signalAlpha?.['08'] || 'rgba(197,217,87,0.08)',
  },
};

export const SEARCH_INPUT_PROPS = {
  variant: 'unstyled',
  fontSize: 'sm',
  color: 'text.primary',
  flex: 1,
  _placeholder: { color: 'surface.600' },
};

export const buildFilterTabProps = (active) => ({
  cursor: 'pointer',
  position: 'relative',
  pb: 2,
  transition: 'all 0.15s',
  _hover: !active ? { '& > *': { color: 'surface.300' } } : {},
});

export const FILTER_TAB_LABEL_PROPS = (active) => ({
  fontSize: 'sm',
  fontWeight: '700',
  color: active ? 'text.primary' : 'surface.500',
  letterSpacing: '-0.01em',
  transition: 'color 0.15s',
});

export const FILTER_TAB_COUNT_PROPS = (active) => ({
  fontSize: '2xs',
  fontFamily: 'mono',
  fontWeight: '700',
  color: active ? 'brand.500' : 'surface.700',
});

export const FILTER_TAB_UNDERLINE_PROPS = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  h: '2px',
  bg: 'brand.500',
  borderRadius: 'full',
  boxShadow: `0 0 8px ${SIGNAL}`,
};

export const SORT_TAB_LABEL_PROPS = (active) => ({
  fontSize: '2xs',
  fontWeight: '700',
  color: active ? 'accent.banana' : 'surface.700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontFamily: 'mono',
  cursor: 'pointer',
  transition: 'color 0.15s',
  _hover: !active ? { color: 'surface.500' } : {},
});

export const PAGE_AMBIENT_GLOW_PROPS = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  h: '500px',
  bg: `radial-gradient(ellipse at top center, ${colors.accent.signalAlpha?.['08'] || 'rgba(197,217,87,0.08)'}, transparent 70%)`,
  pointerEvents: 'none',
};

export const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
};
