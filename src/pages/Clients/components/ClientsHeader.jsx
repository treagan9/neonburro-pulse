// src/pages/Clients/components/ClientsHeader.jsx
// New design language - no big "Clients" title.
// Teal-filled "+ Client" button. Inline mono stat strip below.

import { HStack, VStack, Text, Icon, Box } from '@chakra-ui/react';
import { TbPlus } from 'react-icons/tb';
import { PRIMARY_BUTTON_PROPS, formatCurrency } from '../../../lib/uiConstants';

const ClientsHeader = ({ counts, stats, onAdd }) => {
  return (
    <VStack align="stretch" spacing={3}>
      {/* Top row: kicker + primary button */}
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
        <Text textStyle="kicker">Clients</Text>

        <Box as="button" onClick={onAdd} {...PRIMARY_BUTTON_PROPS}>
          <Icon as={TbPlus} boxSize={3.5} />
          <Text>Client</Text>
        </Box>
      </HStack>

      {/* Inline stat strip - same vibe everywhere */}
      <HStack spacing={0} color="surface.500" fontSize="xs" fontFamily="mono" flexWrap="wrap" rowGap={1}>
        <Text color="white" fontWeight="700">{counts.all || 0}</Text>
        <Text color="surface.600" mx={1.5}>clients</Text>

        <Text color="surface.700" mx={1}>·</Text>

        <Text color="white" fontWeight="700">{stats?.activeSprints || 0}</Text>
        <Text color="surface.600" mx={1.5}>active sprints</Text>

        <Text color="surface.700" mx={1}>·</Text>

        <Text color="white" fontWeight="700">{formatCurrency(stats?.mtdRevenue)}</Text>
        <Text color="surface.600" mx={1.5}>MTD</Text>

        {parseFloat(stats?.outstanding || 0) > 0 && (
          <>
            <Text color="surface.700" mx={1}>·</Text>
            <Text color="accent.banana" fontWeight="700">{formatCurrency(stats?.outstanding)}</Text>
            <Text color="surface.600" mx={1.5}>outstanding</Text>
          </>
        )}
      </HStack>
    </VStack>
  );
};

export default ClientsHeader;
