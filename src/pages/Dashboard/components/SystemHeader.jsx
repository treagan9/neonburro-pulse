// src/pages/Dashboard/components/SystemHeader.jsx
// Top-of-dashboard strip: team avatars + live clock + refresh.
// Avatars carry their own presence dots. Tokens only, no hardcoded cyan.

import { useState, useEffect } from 'react';
import { Box, HStack, Text, IconButton, Tooltip } from '@chakra-ui/react';
import { TbRefresh } from 'react-icons/tb';
import colors from '../../../theme/colors';
import TeamOnlineStrip from './TeamOnlineStrip';

const SystemHeader = ({ onRefresh, refreshing }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <HStack justify="space-between" align="center" flexWrap="wrap" spacing={4}>
      <Box flex={1} minW={0}>
        <TeamOnlineStrip />
      </Box>

      <HStack spacing={3}>
        <Box textAlign="right">
          <Text
            color="text.primary"
            fontSize="sm"
            fontWeight="700"
            fontFamily="mono"
            lineHeight="1"
            letterSpacing="0.02em"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formattedTime}
          </Text>
          <Text color="surface.600" fontSize="2xs" fontFamily="mono" mt={0.5}>
            {formattedDate}
          </Text>
        </Box>

        <Tooltip label="Refresh" placement="bottom" hasArrow bg="surface.800" color="text.primary" fontSize="xs">
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
              bg: colors.accent.signalAlpha?.['08'] || 'rgba(197,217,87,0.08)',
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
