// src/pages/Clients/components/ClientsHeader.jsx
// Minimal header - typography-led, no stat cards, inline counts

import { HStack, Box, Text, VStack, Icon } from '@chakra-ui/react';
import { TbPlus } from 'react-icons/tb';

const ClientsHeader = ({ counts, stats, onAdd }) => {
  const currency = (val) => {
    const num = parseFloat(val || 0);
    if (num === 0) return '$0';
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* Title row */}
      <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
        <Box>
          <Text
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="800"
            color="white"
            letterSpacing="-0.02em"
            lineHeight="1"
          >
            Clients
          </Text>
        </Box>

        {/* Add client - subtle text button, not bold */}
        <HStack
          spacing={1.5}
          cursor="pointer"
          onClick={onAdd}
          color="brand.500"
          opacity={0.8}
          transition="all 0.15s"
          _hover={{ opacity: 1, transform: 'translateY(-1px)' }}
          userSelect="none"
        >
          <Icon as={TbPlus} boxSize={3.5} />
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase">
            Add Client
          </Text>
        </HStack>
      </HStack>

      {/* Inline stat strip - mono, muted, just text */}
      <HStack spacing={0} color="surface.500" fontSize="xs" fontFamily="mono" flexWrap="wrap">
        <Text color="white" fontWeight="700">{counts.all || 0}</Text>
        <Text color="surface.600" mx={1.5}>clients</Text>
        <Text color="surface.700" mx={1}>·</Text>
        <Text color="white" fontWeight="700">{stats?.activeSprints || 0}</Text>
        <Text color="surface.600" mx={1.5}>active sprints</Text>
        <Text color="surface.700" mx={1}>·</Text>
        <Text color="white" fontWeight="700">{currency(stats?.mtdRevenue)}</Text>
        <Text color="surface.600" mx={1.5}>MTD</Text>
        {parseFloat(stats?.outstanding || 0) > 0 && (
          <>
            <Text color="surface.700" mx={1}>·</Text>
            <Text color="accent.banana" fontWeight="700">{currency(stats?.outstanding)}</Text>
            <Text color="surface.600" mx={1.5}>outstanding</Text>
          </>
        )}
      </HStack>
    </VStack>
  );
};

export default ClientsHeader;