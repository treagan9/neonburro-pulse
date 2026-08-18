// src/pages/Settings/components/SettingsHeader.jsx
// Kicker only, a soft pulsing lime dot as a personal touch. Paper.

import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import colors from '../../../theme/colors';

const P = colors.paper;

const SettingsHeader = () => (
  <VStack align="start" spacing={2}>
    <HStack spacing={3} align="center">
      <Box position="relative" w="8px" h="8px">
        <Box position="absolute" inset={0} borderRadius="full" bg={P.lime} />
        <Box position="absolute" inset={0} borderRadius="full" bg={P.lime} opacity={0.4}
          sx={{ animation: 'pingSettings 2s cubic-bezier(0, 0, 0.2, 1) infinite', '@keyframes pingSettings': { '75%, 100%': { transform: 'scale(2.5)', opacity: 0 } } }} />
      </Box>
      <Text fontSize="xs" fontWeight="700" color={P.limeDeep} letterSpacing="0.12em" textTransform="uppercase" fontFamily="mono">Account settings</Text>
    </HStack>
    <Text color={P.inkMuted} fontSize="xs" fontFamily="mono">Manage your profile, security and preferences</Text>
  </VStack>
);

export default SettingsHeader;
