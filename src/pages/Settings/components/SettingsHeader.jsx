// src/pages/Settings/components/SettingsHeader.jsx
// Aligned with new design language - kicker label only, no big title.
// Subtle pulsing dot stays as a personal touch unique to this page.

import { Box, HStack, Text, VStack } from '@chakra-ui/react';

const SettingsHeader = () => {
  return (
    <VStack align="start" spacing={2}>
      <HStack spacing={3} align="center">
        <Box position="relative" w="8px" h="8px">
          <Box
            position="absolute"
            inset={0}
            borderRadius="full"
            bg="brand.500"
            boxShadow="0 0 12px rgba(0,229,229,0.7)"
          />
          <Box
            position="absolute"
            inset={0}
            borderRadius="full"
            bg="brand.500"
            opacity={0.4}
            sx={{
              animation: 'pingSettings 2s cubic-bezier(0, 0, 0.2, 1) infinite',
              '@keyframes pingSettings': {
                '75%, 100%': { transform: 'scale(2.5)', opacity: 0 },
              },
            }}
          />
        </Box>
        <Text
          fontSize="xs"
          fontWeight="700"
          color="brand.500"
          letterSpacing="0.12em"
          textTransform="uppercase"
          fontFamily="mono"
        >
          Account Settings
        </Text>
      </HStack>
      <Text color="surface.500" fontSize="xs" fontFamily="mono">
        Manage your profile, security, and preferences
      </Text>
    </VStack>
  );
};

export default SettingsHeader;
