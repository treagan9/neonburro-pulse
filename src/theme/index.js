// src/theme/index.js
// NeonBurro Pulse - Chakra UI v2 theme
// Uses Inter + JetBrains Mono matching neonburro.com public site
import { extendTheme } from '@chakra-ui/react';
import colors from './colors';
import typography from './typography';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors,

  // Typography from shared module - Inter + JetBrains Mono
  fonts: typography.fonts,
  fontSizes: typography.fontSizes,
  fontWeights: typography.fontWeights,
  lineHeights: typography.lineHeights,
  letterSpacings: typography.letterSpacings,

  styles: {
    global: {
      'html, body': {
        bg: 'surface.950',
        color: 'white',
        fontFamily: 'body',
        lineHeight: 1.5,
        fontFeatureSettings: '"cv11", "ss01", "ss03"',
        fontOpticalSizing: 'auto',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      '*::selection': {
        bg: 'rgba(0, 229, 229, 0.3)',
        color: 'brand.300',
      },
      '::-webkit-scrollbar': {
        width: '6px',
        bg: 'surface.950',
      },
      '::-webkit-scrollbar-thumb': {
        bg: 'surface.700',
        borderRadius: '3px',
        '&:hover': {
          bg: 'surface.600',
        },
      },
      'code, kbd, pre, samp': {
        fontFamily: 'mono',
      },
      a: {
        textDecoration: 'none',
        '&:hover': { textDecoration: 'none' },
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg',
        _focus: { boxShadow: 'none' },
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'surface.950',
          _hover: {
            bg: 'brand.400',
            transform: 'translateY(-1px)',
          },
          _active: { transform: 'translateY(0)' },
        },
        outline: {
          borderColor: 'surface.700',
          color: 'white',
          _hover: {
            bg: 'surface.850',
            borderColor: 'surface.600',
          },
        },
        ghost: {
          color: 'surface.400',
          _hover: {
            bg: 'surface.850',
            color: 'white',
          },
        },
        neon: {
          bg: 'transparent',
          color: 'brand.500',
          borderWidth: '1px',
          borderColor: 'brand.500',
          _hover: {
            bg: 'rgba(0, 229, 229, 0.1)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
  },
});

export default theme;