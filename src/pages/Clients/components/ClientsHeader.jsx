// src/pages/Clients/components/ClientsHeader.jsx
// SENTINEL: NB_PULSE_CLIENTS_HEADER_V3
//
// Paper header. Kicker, a title, a stats strip that describes the clients (how
// many active, how many leads waiting, how many on a subscription), and a lime
// new-client button. Leads is a link because a lead sitting for a fortnight is
// the most expensive row in the table. Local Paper styles, no shared dark
// constants. No oxford commas, no dashes.

import { HStack, VStack, Text, Icon, Box } from '@chakra-ui/react';
import { TbPlus } from 'react-icons/tb';
import colors from '../../../theme/colors';
import { TYPE, EASE, FAST } from '../../../theme/layout';

const P = colors.paper;

const Stat = ({ n, label, tone, onClick }) => (
  <HStack spacing={1.5} align="baseline" as={onClick ? 'button' : 'div'} onClick={onClick}
    transition={`opacity ${FAST} ${EASE}`} _hover={onClick ? { opacity: 0.7 } : undefined}>
    <Text fontFamily="mono" fontSize={TYPE.small} fontWeight="700" color={tone || P.ink} sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {n}
    </Text>
    <Text fontFamily="mono" fontSize={TYPE.small} color={P.inkMuted}>{label}</Text>
  </HStack>
);

const Dot = () => <Text color={P.inkFaint} fontSize={TYPE.small} mx={2}>·</Text>;

const ClientsHeader = ({ counts, subscribed = 0, onAdd, onShowLeads }) => (
  <VStack align="stretch" spacing={3}>
    <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
      <VStack align="start" spacing={1.5} minW={0}>
        <Text fontFamily="mono" fontSize={TYPE.micro} fontWeight="600" letterSpacing="0.22em" textTransform="uppercase" color={P.inkMuted}>
          Clients
        </Text>
        <Text fontSize={TYPE.title} fontWeight="600" letterSpacing="-0.03em" lineHeight="1.1" color={P.ink}>
          Everybody we build for.
        </Text>
      </VStack>

      <HStack as="button" onClick={onAdd} spacing={1.5} bg={P.lime} color={P.limeInk} borderRadius="full" px={4} h="40px" fontWeight="700" fontSize="sm" transition={`all 0.18s ${EASE}`} _hover={{ bg: '#D2E26B', transform: 'translateY(-1px)' }} _active={{ transform: 'scale(0.98)' }}>
        <Icon as={TbPlus} boxSize={4} />
        <Text>Client</Text>
      </HStack>
    </HStack>

    <HStack spacing={0} flexWrap="wrap" rowGap={1}>
      <Stat n={counts.active || 0} label="active" />
      <Dot />
      <Stat
        n={counts.lead || 0}
        label={counts.lead === 1 ? 'lead' : 'leads'}
        tone={counts.lead > 0 ? P.gold : P.ink}
        onClick={counts.lead > 0 ? onShowLeads : undefined}
      />
      <Dot />
      <Stat n={subscribed} label="on subscription" />
      <Dot />
      <Stat n={counts.all || 0} label="on the books" tone={P.inkMuted} />
    </HStack>
  </VStack>
);

export default ClientsHeader;
