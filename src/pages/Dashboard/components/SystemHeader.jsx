// src/pages/Dashboard/components/SystemHeader.jsx
// Minimal top-of-dashboard strip: team avatars + time + refresh
// No big pulsing dot - the avatars carry their own presence dots

import { useState, useEffect } from 'react';
import { Box, HStack, Text, IconButton, Tooltip } from '@chakra-ui/react';
import { TbRefresh } from 'react-icons/tb';
import TeamOnlineStrip from './TeamOnlineStrip';

const SystemHeader = ({ onRefresh, refreshing }) => {
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
      {/* Left: just team avatars - no big dot, no count */}
      <Box flex={1} minW={0}>
        <TeamOnlineStrip />
      </Box>

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

        <Tooltip
          label="Refresh"
          placement="bottom"
          hasArrow
          bg="surface.800"
          color="white"
          fontSize="xs"
        >
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
