// src/pages/Clients/components/ClientsHeader.jsx
// SENTINEL: NB_PULSE_CLIENTS_HEADER_V2
//
// ── WHAT THE STRIP SAYS NOW ─────────────────────────────────────────────────
// V1 read: 12 clients · 4 active sprints · $8.2k MTD · $3.1k outstanding.
// Four numbers, none of which tell you anything about the list underneath them,
// on a page whose job is to help you find one client.
//
// The numbers that belong on a Clients page are the ones that describe the
// clients: how many are active, how many are leads waiting on us, how many are
// on a subscription. Money moved to Today, where the money lives.
//
// The leads count is a link because a lead that has been sitting for a fortnight
// is the most expensive row in the table and nothing anywhere surfaced it.
//
// No oxford commas, no em dashes.

import { HStack, VStack, Text, Icon, Box } from '@chakra-ui/react';
import { TbPlus } from 'react-icons/tb';
import {
  PRIMARY_BUTTON_PROPS, PRIMARY_BUTTON_ICON_PROPS, PRIMARY_BUTTON_TEXT_PROPS,
} from '../../../lib/uiConstants';
import { TYPE, EASE, FAST } from '../../../theme/layout';

const Stat = ({ n, label, tone = 'text.primary', onClick }) => (
  <HStack spacing={1.5} align="baseline" as={onClick ? 'button' : 'div'} onClick={onClick}
    transition={`opacity ${FAST} ${EASE}`} _hover={onClick ? { opacity: 0.75 } : undefined}>
    <Text fontFamily="mono" fontSize={TYPE.small} fontWeight="600" color={tone}
      sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {n}
    </Text>
    <Text fontFamily="mono" fontSize={TYPE.small} color="surface.600">{label}</Text>
  </HStack>
);

const Dot = () => <Text color="surface.800" fontSize={TYPE.small} mx={2}>·</Text>;

const ClientsHeader = ({ counts, subscribed = 0, onAdd, onShowLeads }) => (
  <VStack align="stretch" spacing={3}>
    <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
      <VStack align="start" spacing={1.5} minW={0}>
        <Text fontFamily="mono" fontSize={TYPE.micro} fontWeight="500"
          letterSpacing="0.22em" textTransform="uppercase" color="brand.500">
          Clients
        </Text>
        <Text fontSize={TYPE.title} fontWeight="600" letterSpacing="-0.03em"
          lineHeight="1.1" color="text.primary">
          Everybody we build for.
        </Text>
      </VStack>

      <Box as="button" onClick={onAdd} {...PRIMARY_BUTTON_PROPS}>
        <Icon as={TbPlus} {...PRIMARY_BUTTON_ICON_PROPS} />
        <Text {...PRIMARY_BUTTON_TEXT_PROPS}>Client</Text>
      </Box>
    </HStack>

    <HStack spacing={0} flexWrap="wrap" rowGap={1}>
      <Stat n={counts.active || 0} label="active" />
      <Dot />
      <Stat
        n={counts.lead || 0}
        label={counts.lead === 1 ? 'lead' : 'leads'}
        tone={counts.lead > 0 ? 'accent.banana' : 'text.primary'}
        onClick={counts.lead > 0 ? onShowLeads : undefined}
      />
      <Dot />
      <Stat n={subscribed} label="on subscription" />
      <Dot />
      <Stat n={counts.all || 0} label="on the books" tone="surface.500" />
    </HStack>
  </VStack>
);

export default ClientsHeader;
