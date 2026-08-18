// src/pages/Dashboard/components/TodayHeader.jsx
// SENTINEL: NB_PULSE_TODAY_HEADER_V2
// The top of Today, on Paper. Greeting, date, who else is here, and refresh. The
// clock ticks once a minute, landing on the minute boundary. No oxford, no dashes.

import { useState, useEffect, useRef } from 'react';
import { Box, HStack, VStack, Text, IconButton, Tooltip } from '@chakra-ui/react';
import { TbRefresh } from 'react-icons/tb';
import colors from '../../../theme/colors';
import { TYPE, EASE, FAST } from '../../../theme/layout';
import TeamOnlineStrip from './TeamOnlineStrip';

const P = colors.paper;

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
          <Text fontFamily="mono" fontSize={TYPE.micro} fontWeight="500" letterSpacing="0.22em" textTransform="uppercase" color={P.limeDeep}>
            {weekday} · {date}
          </Text>
          <Text fontSize={TYPE.title} fontWeight="600" letterSpacing="-0.03em" lineHeight="1.1" color={P.ink} noOfLines={1}>
            {first ? `${greet(now.getHours())}, ${first}.` : greet(now.getHours())}
          </Text>
        </VStack>

        <HStack spacing={3} flexShrink={0} align="center">
          <Text display={{ base: 'none', sm: 'block' }} fontFamily="mono" fontSize={TYPE.small} fontWeight="500" color={P.inkMuted} sx={{ fontVariantNumeric: 'tabular-nums' }}>{time}</Text>
          <Tooltip label="Refresh" placement="bottom" hasArrow bg={P.ink} color={P.sheet} fontSize="xs" openDelay={400}>
            <IconButton icon={<TbRefresh size={15} />} onClick={onRefresh} isLoading={refreshing} variant="ghost" h="34px" w="34px" minW="34px" borderRadius="10px" color={P.inkMuted} border="1px solid" borderColor={P.hair} transition={`all ${FAST} ${EASE}`} _hover={{ color: P.limeDeep, borderColor: P.limeDeep, bg: `${P.lime}18` }} aria-label="Refresh" />
          </Tooltip>
        </HStack>
      </HStack>

      <Box><TeamOnlineStrip /></Box>
    </VStack>
  );
};

export default TodayHeader;
