// src/pages/Dashboard/components/Numbers.jsx
// SENTINEL: NB_PULSE_NUMBERS_V1
//
// The state of the business, as four figures.
//
// ── WHY THIS IS NOT THE TOP OF THE PAGE ANY MORE ────────────────────────────
// V1 gave the outstanding balance the whole hero: 5xl, 800 weight, mono, in
// banana or lime depending on sign. It is a good number and it is not an
// instruction. A figure you can do nothing about does not deserve the first
// thing your eye lands on every single morning, so it sits under the queue now,
// at a size that says important rather than urgent.
//
// ── TABULAR NUMERALS, EVERYWHERE, ALWAYS ────────────────────────────────────
// Proportional digits make a 1 narrower than a 7, so a column of currency
// wobbles and two figures of the same magnitude look different lengths. Every
// number in this app should carry fontVariantNumeric tabular-nums. It is the
// single cheapest thing that makes a data tool look built rather than assembled.
//
// ── THE GRID ────────────────────────────────────────────────────────────────
// Two up on a phone, four across from md. Not one up: two short figures side by
// side on a phone is more scannable than four full width rows, and it halves the
// scroll before the activity stream.
//
// No oxford commas, no em dashes.

import { Box, SimpleGrid, VStack, HStack, Text, Icon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { TbArrowUpRight } from 'react-icons/tb';
import { TYPE, EASE, FAST } from '../../../theme/layout';
import { formatCurrency } from '../../../lib/uiConstants';

const Figure = ({ value, label, sub, tone = 'text.primary', to, onNavigate }) => {
  const interactive = Boolean(to);
  return (
    <VStack
      as={interactive ? 'button' : 'div'}
      onClick={interactive ? onNavigate : undefined}
      align="start"
      spacing={1.5}
      textAlign="left"
      py={{ base: 4, md: 5 }}
      px={{ base: 3, md: 4 }}
      borderRadius="14px"
      role="group"
      cursor={interactive ? 'pointer' : 'default'}
      transition={`background ${FAST} ${EASE}`}
      _hover={interactive ? { bg: 'surface.900' } : undefined}
    >
      <HStack spacing={1.5} align="center">
        <Text fontFamily="mono" fontSize={{ base: '24px', md: '30px' }} fontWeight="600"
          lineHeight="1" letterSpacing="-0.02em" color={tone}
          sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Text>
        {interactive && (
          <Icon as={TbArrowUpRight} boxSize="13px" color="surface.800"
            transition={`color ${FAST} ${EASE}`} _groupHover={{ color: 'brand.500' }} />
        )}
      </HStack>
      <Text fontFamily="mono" fontSize={TYPE.micro} fontWeight="500" letterSpacing="0.18em"
        textTransform="uppercase" color="surface.500">
        {label}
      </Text>
      {sub && (
        <Text fontSize={TYPE.small} color="surface.600" noOfLines={1}>
          {sub}
        </Text>
      )}
    </VStack>
  );
};

const Numbers = ({ outstanding, collected, activeClients, totalClients, openSprints }) => {
  const navigate = useNavigate();

  return (
    <VStack align="stretch" spacing={4}>
      <HStack spacing={3} px={{ base: 3, md: 4 }}>
        <Text fontFamily="mono" fontSize={TYPE.micro} fontWeight="500"
          letterSpacing="0.22em" textTransform="uppercase" color="surface.500">
          Where things stand
        </Text>
        <Box flex={1} h="1px" bg="divider.soft" />
      </HStack>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 1, md: 2 }}>
        <Figure
          value={formatCurrency(outstanding)}
          label="Outstanding"
          sub={outstanding > 0 ? 'Sent and not yet paid' : 'Nothing out'}
          tone={outstanding > 0 ? 'accent.banana' : 'text.primary'}
          to="/invoicing/"
          onNavigate={() => navigate('/invoicing/')}
        />
        <Figure
          value={formatCurrency(collected)}
          label="Collected"
          sub="Cleared, all time"
          tone="brand.500"
        />
        <Figure
          value={activeClients}
          label="Active clients"
          sub={totalClients > activeClients ? `${totalClients} on the books` : 'All of them'}
          to="/clients/"
          onNavigate={() => navigate('/clients/')}
        />
        <Figure
          value={openSprints}
          label="Open sprints"
          sub={openSprints > 0 ? 'Billable, not locked' : 'All locked'}
          to="/invoicing/"
          onNavigate={() => navigate('/invoicing/')}
        />
      </SimpleGrid>
    </VStack>
  );
};

export default Numbers;
