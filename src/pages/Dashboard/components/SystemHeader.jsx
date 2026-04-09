// src/pages/Dashboard/components/SystemHeader.jsx
// Clean header: pulsing online indicator, team online strip, live time, refresh
// Command Center title removed per design direction

import { useState, useEffect } from 'react';
import { Box, HStack, Text, IconButton, Tooltip } from '@chakra-ui/react';
import { TbRefresh } from 'react-icons/tb';
import TeamOnlineStrip from './TeamOnlineStrip';

const SystemHeader = ({ onRefresh, refreshing, onlineCount }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <HStack justify="space-between" align="center" flexWrap="wrap" spacing={4}>
      {/* Left: status dot + online count + team strip */}
      <HStack spacing={4} flex={1} minW={0}>
        <HStack spacing={2.5}>
          {/* Pulsing online dot */}
          <Box position="relative" w="8px" h="8px">
            <Box
              position="absolute"
              inset={0}
              borderRadius="full"
              bg="accent.lime"
              boxShadow="0 0 12px rgba(57,255,20,0.7)"
            />
            <Box
              position="absolute"
              inset={0}
              borderRadius="full"
              bg="accent.lime"
              opacity={0.4}
              sx={{
                animation: 'pingSys 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                '@keyframes pingSys': {
                  '75%, 100%': { transform: 'scale(2.5)', opacity: 0 },
                },
              }}
            />
          </Box>
          <Text
            color="accent.lime"
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.12em"
            textTransform="uppercase"
            fontFamily="mono"
          >
            {onlineCount} online
          </Text>
        </HStack>

        {/* Team avatars inline */}
        <TeamOnlineStrip />
      </HStack>

      {/* Right: time + refresh */}
      <HStack spacing={3}>
        <Box textAlign="right">
          <Text
            color="white"
            fontSize="sm"
            fontWeight="700"
            fontFamily="mono"
            lineHeight="1"
            letterSpacing="0.02em"
          >
            {formattedTime}
          </Text>
          <Text
            color="surface.600"
            fontSize="2xs"
            fontFamily="mono"
            mt={0.5}
          >
            {formattedDate}
          </Text>
        </Box>

        <Tooltip label="Refresh" placement="bottom" hasArrow bg="surface.800" color="white" fontSize="xs">
          <IconButton
            icon={<TbRefresh size={14} />}
            onClick={onRefresh}
            isLoading={refreshing}
            variant="ghost"
            size="sm"
            color="surface.500"
            h="32px"
            w="32px"
            minW="32px"
            borderRadius="md"
            border="1px solid"
            borderColor="surface.800"
            _hover={{
              color: 'brand.500',
              borderColor: 'brand.500',
              bg: 'rgba(0,229,229,0.05)',
            }}
            transition="all 0.15s"
            aria-label="Refresh dashboard"
          />
        </Tooltip>
      </HStack>
    </HStack>
  );
};

export default SystemHeader;