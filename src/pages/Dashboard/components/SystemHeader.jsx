// src/pages/Dashboard/components/SystemHeader.jsx
import { Box, HStack, Text, IconButton, VStack } from '@chakra-ui/react';
import { TbRefresh } from 'react-icons/tb';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const SystemHeader = ({ onRefresh, refreshing, onlineCount = 0 }) => {
  const [now, setNow] = useState(new Date());

  // Tick the clock every minute
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  return (
    <HStack justify="space-between" align="start" w="100%">
      <VStack align="start" spacing={2}>
        <HStack spacing={3} align="center">
          <Box
            position="relative"
            w="8px"
            h="8px"
          >
            <Box
              position="absolute"
              inset={0}
              borderRadius="full"
              bg="accent.neon"
              boxShadow="0 0 12px rgba(57,255,20,0.7)"
            />
            <Box
              position="absolute"
              inset={0}
              borderRadius="full"
              bg="accent.neon"
              opacity={0.4}
              sx={{
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                '@keyframes ping': {
                  '75%, 100%': { transform: 'scale(2.5)', opacity: 0 },
                },
              }}
            />
          </Box>
          <Text
            fontSize="xs"
            fontWeight="700"
            color="accent.neon"
            letterSpacing="0.12em"
            textTransform="uppercase"
            fontFamily="mono"
          >
            Systems Active
          </Text>
          {onlineCount > 0 && (
            <>
              <Text color="surface.700" fontSize="xs">·</Text>
              <Text fontSize="xs" color="surface.500" fontFamily="mono">
                {onlineCount} online
              </Text>
            </>
          )}
        </HStack>
        <Text
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="800"
          color="white"
          lineHeight="1"
          letterSpacing="-0.03em"
        >
          Command Center
        </Text>
        <Text color="surface.500" fontSize="xs" fontFamily="mono">
          {format(now, 'EEEE, MMM d')} · {format(now, 'h:mm a')} MT
        </Text>
      </VStack>
      <IconButton
        icon={<TbRefresh />}
        variant="ghost"
        color="surface.500"
        size="sm"
        aria-label="Refresh"
        borderRadius="lg"
        _hover={{ color: 'brand.500', bg: 'surface.850' }}
        onClick={onRefresh}
        isLoading={refreshing}
      />
    </HStack>
  );
};

export default SystemHeader;