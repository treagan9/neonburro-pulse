// src/pages/Clients/components/ClientsHeader.jsx
import { HStack, Box, Text, Button, SimpleGrid, VStack, Icon } from '@chakra-ui/react';
import { TbPlus, TbUsers, TbBolt, TbCash, TbHourglass } from 'react-icons/tb';

const StatCard = ({ icon, label, value, accent }) => (
  <Box
    bg="surface.900"
    border="1px solid"
    borderColor="surface.800"
    borderRadius="xl"
    p={3.5}
    position="relative"
    overflow="hidden"
    transition="all 0.15s"
    _hover={{ borderColor: 'surface.700' }}
  >
    <Box position="absolute" top={0} left={0} w="100%" h="2px" bg={accent} opacity={0.6} />
    <HStack spacing={2.5}>
      <Box
        p={2}
        borderRadius="lg"
        bg={`${accent}12`}
        border="1px solid"
        borderColor={`${accent}25`}
      >
        <Icon as={icon} boxSize={4} color={accent} />
      </Box>
      <VStack align="start" spacing={0}>
        <Text color="white" fontSize="md" fontWeight="800" fontFamily="mono" lineHeight="1">
          {value}
        </Text>
        <Text color="surface.500" fontSize="2xs" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
          {label}
        </Text>
      </VStack>
    </HStack>
  </Box>
);

const ClientsHeader = ({ counts, stats, onAdd }) => {
  const currency = (val) => `$${parseFloat(val || 0).toLocaleString()}`;

  return (
    <VStack spacing={4} align="stretch">
      {/* Title row */}
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="2xl" fontWeight="800" color="white" letterSpacing="-0.02em">Clients</Text>
          <Text color="surface.400" fontSize="sm" mt={0.5}>
            {counts.active} active · {counts.all} total
          </Text>
        </Box>
        <Button
          leftIcon={<TbPlus />}
          size="sm"
          bg="brand.500"
          color="surface.950"
          fontWeight="700"
          borderRadius="lg"
          _hover={{ bg: 'brand.400', transform: 'translateY(-1px)' }}
          onClick={onAdd}
        >
          Add Client
        </Button>
      </HStack>

      {/* Stats grid */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
        <StatCard
          icon={TbUsers}
          label="Total Clients"
          value={counts.all || 0}
          accent="#00E5E5"
        />
        <StatCard
          icon={TbBolt}
          label="Active Sprints"
          value={stats?.activeSprints || 0}
          accent="#39FF14"
        />
        <StatCard
          icon={TbCash}
          label="MTD Revenue"
          value={currency(stats?.mtdRevenue || 0)}
          accent="#FFE500"
        />
        <StatCard
          icon={TbHourglass}
          label="Outstanding"
          value={currency(stats?.outstanding || 0)}
          accent="#FF6B35"
        />
      </SimpleGrid>
    </VStack>
  );
};

export default ClientsHeader;