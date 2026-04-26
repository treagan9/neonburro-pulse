// src/lib/uiConstants.js
// Shared UI constants for Pulse - the design language.
// Imported by Dashboard, Clients, Invoicing, Forms.

// PRIMARY ACTION BUTTON - teal fill, dark text
// Used as <Box as="button" {...PRIMARY_BUTTON_PROPS}>
//   <Icon as={TbPlus} {...PRIMARY_BUTTON_ICON_PROPS} />
//   <Text {...PRIMARY_BUTTON_TEXT_PROPS}>Client</Text>
// </Box>
// We split into three because <Box as="button"> doesn't reliably cascade
// `color` down to <Icon> + <Text> children in all Chakra versions.
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
    boxShadow: '0 4px 16px rgba(0,229,229,0.25)',
  },
  _active: { transform: 'translateY(0)' },
};

// Icon inside the primary button - explicit dark color
export const PRIMARY_BUTTON_ICON_PROPS = {
  boxSize: 3.5,
  color: 'surface.950',
};

// Text inside the primary button - explicit dark color
export const PRIMARY_BUTTON_TEXT_PROPS = {
  color: 'surface.950',
  fontWeight: '700',
};

// SECONDARY OUTLINED BUTTON - dark bg, white text, cyan border on hover
// Used for "+ Client" on Dashboard (the secondary action next to + Invoice)
export const SECONDARY_BUTTON_PROPS = {
  bg: 'surface.900',
  color: 'white',
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

export const SECONDARY_BUTTON_ICON_PROPS = {
  boxSize: 3.5,
  color: 'white',
};

// SEARCH BAR WRAPPER - rounded card with focus glow
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
    bg: 'rgba(0,229,229,0.03)',
  },
};

// SEARCH INPUT - the unstyled input inside the wrapper
export const SEARCH_INPUT_PROPS = {
  variant: 'unstyled',
  fontSize: 'sm',
  color: 'white',
  flex: 1,
  _placeholder: { color: 'surface.600' },
};

// FILTER TAB - primary filter row (Active / Leads / Inactive)
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
  color: active ? 'white' : 'surface.500',
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
  boxShadow: '0 0 8px rgba(0,229,229,0.6)',
};

// SORT TAB - secondary sort row, smaller and quieter
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

// PAGE WRAPPER - ambient glow + outer Box for any top-level page
export const PAGE_AMBIENT_GLOW_PROPS = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  h: '500px',
  bg: 'radial-gradient(ellipse at top center, rgba(0,229,229,0.04), transparent 70%)',
  pointerEvents: 'none',
};

// Currency formatters - kept here for cross-page use
export const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
};
