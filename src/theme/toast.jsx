// src/theme/toast.jsx
// The one branded toast. Chakra's default toast is a green or red slab with white
// text, the "normal toast" Tyler wanted gone. This renders every toast in our two
// tones instead: success is a lime pill with dark ink, everything else is a cream
// card with a colored edge and an ink message. Wired once in main.jsx through
// ChakraProvider's toastOptions.defaultOptions.render, so every toast({...}) call
// anywhere in the app comes out branded with no change at the call site.
//
// No oxford commas, no em dashes.

import { Box, HStack, Text, Icon, CloseButton } from '@chakra-ui/react';
import { TbCircleCheck, TbAlertTriangle, TbInfoCircle, TbAlertCircle } from 'react-icons/tb';
import colors from './colors';

const P = colors.paper;

// success is the loud one, a lime fill with ink. The rest are cream cards with a
// left edge in the status color so the room stays calm.
const STATUS = {
  success: { bg: P.lime,   fg: P.limeInk, sub: 'rgba(58,67,25,0.72)', icon: TbCircleCheck,   iconColor: P.limeInk,  edge: null },
  error:   { bg: P.sheet,  fg: P.ink,     sub: P.inkMuted,            icon: TbAlertCircle,    iconColor: P.coral,    edge: P.coral },
  warning: { bg: P.sheet,  fg: P.ink,     sub: P.inkMuted,            icon: TbAlertTriangle,  iconColor: P.gold,     edge: P.gold },
  info:    { bg: P.sheet,  fg: P.ink,     sub: P.inkMuted,            icon: TbInfoCircle,     iconColor: P.limeDeep, edge: P.limeDeep },
  loading: { bg: P.sheet,  fg: P.ink,     sub: P.inkMuted,            icon: TbInfoCircle,     iconColor: P.limeDeep, edge: P.limeDeep },
};

const BrandToast = ({ title, description, status = 'info', onClose, isClosable = true }) => {
  const c = STATUS[status] || STATUS.info;
  return (
    <Box
      role="status"
      position="relative"
      bg={c.bg}
      color={c.fg}
      borderRadius="14px"
      overflow="hidden"
      border="1px solid"
      borderColor={c.edge ? P.hair : 'transparent'}
      boxShadow="0 12px 34px rgba(36,26,22,0.22)"
      minW="240px"
      maxW="400px"
      pl={4}
      pr={isClosable ? 9 : 4}
      py={3.5}
      fontFamily="'Rubik', sans-serif"
    >
      {c.edge && <Box position="absolute" left={0} top={0} bottom={0} w="4px" bg={c.edge} />}
      <HStack align="start" spacing={2.5}>
        <Icon as={c.icon} boxSize={5} color={c.iconColor} mt="1px" flexShrink={0} />
        <Box minW={0}>
          {title && <Text fontWeight="700" fontSize="sm" lineHeight="1.3" color={c.fg}>{title}</Text>}
          {description && <Text fontSize="xs" mt={0.5} color={c.sub} lineHeight="1.45">{description}</Text>}
        </Box>
      </HStack>
      {isClosable && onClose && (
        <CloseButton
          size="sm"
          onClick={onClose}
          position="absolute"
          top={2}
          right={2}
          color={c.fg}
          opacity={0.55}
          _hover={{ opacity: 1, bg: 'transparent' }}
        />
      )}
    </Box>
  );
};

export const toastOptions = {
  defaultOptions: {
    position: 'bottom-right',
    duration: 3500,
    isClosable: true,
    render: (props) => <BrandToast {...props} />,
  },
};

export default toastOptions;
