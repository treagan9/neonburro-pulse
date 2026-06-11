// src/theme/index.js
// NeonBurro Pulse — Chakra UI v2 theme. Aligned to marketing brand canon.
// Topo Lime primary, Geist Sans, warmed near-black surfaces, Fraunces editorial.

import { extendTheme } from '@chakra-ui/react';
import colors from './colors';
import typography from './typography';

const motion = {
  standard: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '320ms cubic-bezier(0.4, 0, 0.2, 1)',
  sheet: '320ms cubic-bezier(0.16, 1, 0.3, 1)',
};

const theme = extendTheme({
  config: { initialColorMode: 'dark', useSystemColorMode: false },

  colors,

  fonts: typography.fonts,
  fontSizes: typography.fontSizes,
  fontWeights: typography.fontWeights,
  lineHeights: typography.lineHeights,
  letterSpacings: typography.letterSpacings,
  textStyles: typography.textStyles,

  breakpoints: { base: '0px', sm: '640px', md: '1024px', lg: '1440px', xl: '1920px' },

  radii: {
    none: '0', xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '24px', full: '9999px',
  },

  shadows: {
    none: 'none',
    card: '0 2px 8px rgba(0, 0, 0, 0.3)',
    modal: '0 16px 64px rgba(0, 0, 0, 0.5)',
    sheet: '0 -8px 32px rgba(0, 0, 0, 0.4)',
    focus: '0 0 0 2px rgba(197, 217, 87, 0.4)',   // lime, was cyan
    glow:  '0 0 20px rgba(197, 217, 87, 0.25)',    // lime, was cyan
  },

  motion,

  styles: {
    global: {
      'html, body': {
        bg: 'surface.950',
        color: 'text.primary',
        fontFamily: 'body',
        fontSize: 'md',
        lineHeight: 'base',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
      },
      'body': { minHeight: '100vh' },
      '*::selection': {
        bg: 'rgba(197, 217, 87, 0.3)',   // lime, was cyan
        color: 'brand.300',
      },
      '::-webkit-scrollbar': { width: '6px', height: '6px', bg: 'surface.950' },
      '::-webkit-scrollbar-thumb': {
        bg: 'surface.800', borderRadius: '3px', _hover: { bg: 'surface.700' },
      },
      'code, kbd, pre, samp': { fontFamily: 'mono' },
      a: { textDecoration: 'none', _hover: { textDecoration: 'none' } },
      '@keyframes pulse': {
        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
        '50%': { opacity: 0.6, transform: 'scale(1.05)' },
      },
      '@keyframes fadeIn': {
        '0%': { opacity: 0, transform: 'translateY(8px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
      },
      '@keyframes slideUp': {
        '0%': { transform: 'translateY(100%)' },
        '100%': { transform: 'translateY(0)' },
      },
    },
  },

  components: {
    Button: {
      baseStyle: {
        fontWeight: 600, borderRadius: 'full', transition: motion.standard,
        _focus: { boxShadow: 'focus' }, _focusVisible: { boxShadow: 'focus' },
      },
      sizes: {
        sm: { h: '36px', minW: '36px', fontSize: 'sm', px: 4 },
        md: { h: '44px', minW: '44px', fontSize: 'md', px: 5 },
        lg: { h: '48px', minW: '48px', fontSize: 'md', px: 6 },
        xl: { h: '56px', minW: '56px', fontSize: 'lg', px: 8 },
      },
      variants: {
        solid: {
          bg: 'brand.500', color: 'surface.950',
          _hover: {
            bg: 'brand.400', transform: 'translateY(-2px)', boxShadow: 'glow',
            _disabled: { bg: 'brand.500', transform: 'none', boxShadow: 'none' },
          },
          _active: { transform: 'scale(0.98)' },
        },
        outline: {
          bg: 'transparent', borderColor: 'whiteAlpha.200', color: 'white',
          _hover: { bg: 'whiteAlpha.50', borderColor: 'brand.500', color: 'brand.500', transform: 'translateY(-1px)' },
          _active: { transform: 'scale(0.98)' },
        },
        ghost: {
          color: 'whiteAlpha.700',
          _hover: { bg: 'whiteAlpha.100', color: 'white' },
          _active: { transform: 'scale(0.98)' },
        },
        neon: {
          bg: 'transparent', color: 'brand.500', borderWidth: '1px', borderColor: 'brand.500',
          _hover: { bg: 'rgba(197, 217, 87, 0.08)', transform: 'translateY(-2px)', boxShadow: 'glow' },
          _active: { transform: 'scale(0.98)' },
        },
        destructive: {
          bg: 'accent.coral', color: 'white',
          _hover: { bg: '#E62958', transform: 'translateY(-1px)' },
          _active: { transform: 'scale(0.98)' },
        },
      },
      defaultProps: { size: 'md', variant: 'solid' },
    },

    Input: {
      variants: {
        naked: {
          field: {
            bg: 'transparent', border: 'none', borderBottom: '1px solid',
            borderColor: 'whiteAlpha.200', borderRadius: 0, px: 0, fontSize: 'md',
            height: '48px', color: 'white', transition: motion.fast,
            _placeholder: { color: 'whiteAlpha.300' },
            _hover: { borderColor: 'whiteAlpha.400' },
            _focus: { borderColor: 'brand.500', boxShadow: 'none', outline: 'none' },
            _focusVisible: { borderColor: 'brand.500', boxShadow: 'none', outline: 'none' },
          },
        },
      },
      defaultProps: { variant: 'naked' },
    },

    Text: { baseStyle: { color: 'text.primary' } },
  },
});

export default theme;
