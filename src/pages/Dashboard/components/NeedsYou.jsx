// src/pages/Dashboard/components/NeedsYou.jsx
// SENTINEL: NB_PULSE_NEEDS_YOU_V1
//
// The queue. This is the reason the page is called Today.
//
// ── WHAT IT REPLACES ────────────────────────────────────────────────────────
// V1 opened with the outstanding balance at 800 weight in mono, then a strip of
// counts underneath. It told you the state of the business, which is a real
// thing to want, and it told you nothing at all about what to do next. Opening a
// tool and being handed a number is how you end up clicking through four tabs to
// find the thing that was actually waiting.
//
// So the top of the page is now a list of things waiting on a hueman, sorted by
// how much it costs to keep ignoring them, and the money moved down to the strip
// where a status number belongs.
//
// ── ROWS ONLY APPEAR WHEN THEY ARE NON ZERO ─────────────────────────────────
// A permanent list of five rows reading zero is furniture. People stop seeing
// furniture inside a week, and then they stop seeing the row that turned into a
// three. Every row here is absent until it is real, which means the presence of
// the list is itself the signal.
//
// ── THE EMPTY STATE IS THE POINT, NOT AN APOLOGY ────────────────────────────
// When the queue is empty it says so plainly and takes up almost no room. A tool
// that celebrates an empty inbox with an illustration is a tool that thinks
// finishing is unusual.
//
// No oxford commas, no em dashes.

import { Box, VStack, HStack, Text, Icon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  TbAlertTriangle, TbClockDollar, TbInbox, TbMessageCircle, TbProgressCheck, TbCheck, TbArrowRight,
} from 'react-icons/tb';
import { TYPE, EASE, FAST } from '../../../theme/layout';
import { formatCurrency } from '../../../lib/uiConstants';

// Ordered by cost of ignoring it, not by how the data happens to arrive.
// Overdue money is losing value today. A form is somebody waiting for a reply.
// A sprint sitting unlocked is work we have not billed for.
const build = ({ overdueCount, overdueTotal, unreadForms, unreadMessages, awaitingPayment, awaitingTotal, openSprints }) => [
  overdueCount > 0 && {
    key: 'overdue',
    icon: TbAlertTriangle,
    tone: 'accent.coral',
    count: overdueCount,
    label: overdueCount === 1 ? 'invoice overdue' : 'invoices overdue',
    detail: `${formatCurrency(overdueTotal)} past its date`,
    to: '/invoicing/',
  },
  unreadMessages > 0 && {
    key: 'messages',
    icon: TbMessageCircle,
    tone: 'accent.purple',
    count: unreadMessages,
    label: unreadMessages === 1 ? 'message unread' : 'messages unread',
    detail: 'A client is waiting on a reply',
    to: '/messages/',
  },
  unreadForms > 0 && {
    key: 'forms',
    icon: TbInbox,
    tone: 'brand.500',
    count: unreadForms,
    label: unreadForms === 1 ? 'form unread' : 'forms unread',
    detail: 'Came in through the site',
    to: '/forms/',
  },
  awaitingPayment > 0 && {
    key: 'awaiting',
    icon: TbClockDollar,
    tone: 'accent.banana',
    count: awaitingPayment,
    label: awaitingPayment === 1 ? 'invoice out' : 'invoices out',
    detail: `${formatCurrency(awaitingTotal)} sent and not yet paid`,
    to: '/invoicing/',
  },
  openSprints > 0 && {
    key: 'sprints',
    icon: TbProgressCheck,
    tone: 'surface.400',
    count: openSprints,
    label: openSprints === 1 ? 'sprint open' : 'sprints open',
    detail: 'Billable and not yet locked',
    to: '/invoicing/',
  },
].filter(Boolean);

const Row = ({ item, onClick }) => (
  <HStack
    as="button"
    onClick={onClick}
    w="100%"
    spacing={{ base: 3.5, md: 5 }}
    align="center"
    textAlign="left"
    py={{ base: 4, md: 5 }}
    px={{ base: 3, md: 4 }}
    borderRadius="14px"
    role="group"
    transition={`background ${FAST} ${EASE}, transform ${FAST} ${EASE}`}
    _hover={{ bg: 'surface.900' }}
    _active={{ transform: 'scale(0.995)' }}
  >
    <Box w={{ base: '34px', md: '38px' }} h={{ base: '34px', md: '38px' }} borderRadius="11px"
      bg="surface.900" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
      <Icon as={item.icon} boxSize={{ base: '17px', md: '18px' }} color={item.tone} />
    </Box>

    <HStack spacing={2.5} align="baseline" flex={1} minW={0} flexWrap="wrap" rowGap={0}>
      <Text fontFamily="mono" fontSize={{ base: '20px', md: '24px' }} fontWeight="600"
        lineHeight="1" color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {item.count}
      </Text>
      <Text fontSize={TYPE.body} fontWeight="500" color="text.primary" letterSpacing="-0.01em">
        {item.label}
      </Text>
      <Text fontSize={TYPE.small} color="surface.500" noOfLines={1}>
        {item.detail}
      </Text>
    </HStack>

    <Icon as={TbArrowRight} boxSize="15px" color="surface.700" flexShrink={0}
      transition={`transform ${FAST} ${EASE}, color ${FAST} ${EASE}`}
      _groupHover={{ color: 'brand.500', transform: 'translateX(3px)' }} />
  </HStack>
);

const NeedsYou = (props) => {
  const navigate = useNavigate();
  const items = build(props);

  if (!items.length) {
    return (
      <HStack spacing={3} py={5} px={{ base: 3, md: 4 }} align="center">
        <Box w="34px" h="34px" borderRadius="11px" bg="surface.900"
          display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
          <Icon as={TbCheck} boxSize="17px" color="brand.500" />
        </Box>
        <Box>
          <Text fontSize={TYPE.body} fontWeight="500" color="text.primary">
            Nothing is waiting on you.
          </Text>
          <Text fontSize={TYPE.small} color="surface.600">
            Everything sent, read and locked. Go outside.
          </Text>
        </Box>
      </HStack>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      <HStack spacing={3} px={{ base: 3, md: 4 }}>
        <Text fontFamily="mono" fontSize={TYPE.micro} fontWeight="500"
          letterSpacing="0.22em" textTransform="uppercase" color="surface.500">
          Needs you
        </Text>
        <Box flex={1} h="1px" bg="divider.soft" />
        <Text fontFamily="mono" fontSize={TYPE.micro} color="surface.700">
          {items.length}
        </Text>
      </HStack>

      <VStack align="stretch" spacing={0.5}>
        {items.map((item) => (
          <Row key={item.key} item={item} onClick={() => navigate(item.to)} />
        ))}
      </VStack>
    </VStack>
  );
};

export default NeedsYou;
