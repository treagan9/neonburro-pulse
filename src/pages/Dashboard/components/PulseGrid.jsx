// src/pages/Dashboard/components/PulseGrid.jsx
import { Box, HStack, VStack, Text, SimpleGrid, Icon, Spinner } from '@chakra-ui/react';
import { TbUsers, TbRocket, TbCoin, TbArrowUpRight } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

const SignalBlock = ({ label, tag, value, sub, accent, onClick, loading }) => (
  <Box
    bg="surface.900"
    border="1px solid"
    borderColor="surface.800"
    borderRadius="xl"
    p={4}
    position="relative"
    overflow="hidden"
    cursor={onClick ? 'pointer' : 'default'}
    onClick={onClick}
    transition="all 0.2s"
    _hover={onClick ? {
      borderColor: accent,
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${accent}15`,
    } : {}}
  >
    {/* Accent line */}
    <Box
      position="absolute"
      top={0}
      left={0}
      w="100%"
      h="2px"
      bg={accent}
      opacity={0.6}
    />

    {/* Tag */}
    <HStack spacing={2} mb={3}>
      <Box
        px={2}
        py={0.5}
        borderRadius="md"
        bg={`${accent}12`}
        border="1px solid"
        borderColor={`${accent}30`}
      >
        <Text
          fontSize="2xs"
          fontFamily="mono"
          fontWeight="700"
          color={accent}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {tag}
        </Text>
      </Box>
    </HStack>

    {/* Value */}
    <Text
      color="white"
      fontSize="3xl"
      fontWeight="800"
      fontFamily="mono"
      lineHeight="1"
      mb={1}
    >
      {loading ? <Spinner size="sm" color={accent} /> : value}
    </Text>

    {/* Label + sub */}
    <Text color="surface.400" fontSize="xs" fontWeight="600">
      {label}
    </Text>
    {sub && (
      <Text color="surface.600" fontSize="2xs" mt={0.5}>
        {sub}
      </Text>
    )}
  </Box>
);

const PulseGrid = ({ stats, loading }) => {
  const navigate = useNavigate();

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
      <SignalBlock
        tag="Clients"
        value={stats.clients}
        label="Active clients"
        sub={stats.clientsTotal > 0 ? `${stats.clientsTotal} total` : null}
        accent="#00E5E5"
        onClick={() => navigate('/clients/')}
        loading={loading}
      />
      <SignalBlock
        tag="Projects"
        value={stats.projects}
        label="Active projects"
        sub={stats.projectsTotal > 0 ? `${stats.projectsTotal} total` : null}
        accent="#8B5CF6"
        onClick={() => navigate('/projects/')}
        loading={loading}
      />
      <SignalBlock
        tag="Revenue"
        value={loading ? '...' : `$${stats.revenue.toLocaleString()}`}
        label="Collected"
        accent="#39FF14"
        onClick={() => navigate('/invoicing/')}
        loading={loading}
      />
      <SignalBlock
        tag="Outstanding"
        value={loading ? '...' : `$${stats.outstanding.toLocaleString()}`}
        label="Pending payment"
        sub={stats.invoices > 0 ? `${stats.invoices} invoices` : null}
        accent="#FFE500"
        onClick={() => navigate('/invoicing/')}
        loading={loading}
      />
    </SimpleGrid>
  );
};

export default PulseGrid;