// src/pages/Dashboard/components/TodayHeader.jsx
// SENTINEL: NB_PULSE_TODAY_HEADER_V1
//
// The top of Today. Greeting, date, who else is here, and the refresh.
//
// ── WHY THE CLOCK LOST ITS SECONDS ──────────────────────────────────────────
// V1 ticked every second and re rendered the header sixty times a minute for
// the whole time the tab was open. Nobody in an invoicing tool has ever needed
// the second hand, and a number that changes in your peripheral vision while
// you are reading a list is a small tax you pay all day. It updates once a
// minute now, and it schedules the first tick to land ON the minute boundary
// rather than a random fraction after it.
//
// ── THE GREETING IS NOT DECORATION ──────────────────────────────────────────
// The page is called Today. A page called Today that opens with a currency
// figure is a page named wrong. The first line says what day it is and who is
// reading, which is the cheapest possible way to make an admin tool feel like
// it belongs to somebody.
//
// No oxford commas, no em dashes.

import { useState, useEffect, useRef } from 'react';
import { Box, HStack, VStack, Text, IconButton, Tooltip } from '@chakra-ui/react';
import { TbRefresh } from 'react-icons/tb';
import colors from '../../../theme/colors';
import { TYPE, EASE, FAST } from '../../../theme/layout';
import TeamOnlineStrip from './TeamOnlineStrip';

const greet = (h) => {
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Late one';
};

const TodayHeader = ({ name, onRefresh, refreshing }) => {
  const [now, setNow] = useState(() => new Date());
  const timer = useRef(null);

  // Land the first tick on the minute, then run every minute. A plain 60s
  // interval drifts to whatever second the page happened to load on, so the
  // clock reads 9:04 for anything up to fifty nine seconds after it turned 9:05.
  useEffect(() => {
    const toNextMinute = 60000 - (Date.now() % 60000);
    const start = setTimeout(() => {
      setNow(new Date());
      timer.current = setInterval(() => setNow(new Date()), 60000);
    }, toNextMinute);
    return () => { clearTimeout(start); if (timer.current) clearInterval(timer.current); };
  }, []);

  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const first = name ? String(name).trim().split(/\s+/)[0] : null;

  return (
    <VStack align="stretch" spacing={{ base: 5, md: 7 }}>
      <HStack justify="space-between" align="flex-start" spacing={4}>
        <VStack align="start" spacing={2} minW={0} flex={1}>
          <Text fontFamily="mono" fontSize={TYPE.micro} fontWeight="500"
            letterSpacing="0.22em" textTransform="uppercase" color="brand.500">
            {weekday} · {date}
          </Text>
          <Text fontSize={TYPE.title} fontWeight="600" letterSpacing="-0.03em"
            lineHeight="1.1" color="text.primary" noOfLines={1}>
            {first ? `${greet(now.getHours())}, ${first}.` : greet(now.getHours())}
          </Text>
        </VStack>

        <HStack spacing={3} flexShrink={0} align="center">
          <Text display={{ base: 'none', sm: 'block' }} fontFamily="mono"
            fontSize={TYPE.small} fontWeight="500" color="surface.500"
            sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {time}
          </Text>
          <Tooltip label="Refresh" placement="bottom" hasArrow bg="surface.800"
            color="text.primary" fontSize="xs" openDelay={400}>
            <IconButton
              icon={<TbRefresh size={15} />}
              onClick={onRefresh}
              isLoading={refreshing}
              variant="ghost"
              h="34px" w="34px" minW="34px"
              borderRadius="10px"
              color="surface.500"
              border="1px solid"
              borderColor="surface.800"
              transition={`all ${FAST} ${EASE}`}
              _hover={{
                color: 'brand.500',
                borderColor: 'brand.500',
                bg: colors.accent.signalAlpha?.['08'] || 'rgba(197,217,87,0.08)',
              }}
              aria-label="Refresh"
            />
          </Tooltip>
        </HStack>
      </HStack>

      <Box>
        <TeamOnlineStrip />
      </Box>
    </VStack>
  );
};

export default TodayHeader;
