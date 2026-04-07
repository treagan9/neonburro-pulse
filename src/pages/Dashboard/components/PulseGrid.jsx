// src/pages/Dashboard/components/PulseGrid.jsx
import { Box, HStack, VStack, Text, SimpleGrid, Icon, Spinner } from '@chakra-ui/react';
import { TbUsers, TbRocket, TbCoin, TbArrowUpRight, TbBolt } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

const SignalBlock = ({ tag, value, label, sub, accent, icon, onClick, loading }) => (
  <Box
    bg="surface.900"
    border="1px solid"
    borderColor="surface.800"
    borderRadius="2xl"
    p={5}
    position="relative"
    overflow="hidden"
    cursor={onClick ? 'pointer' : 'default'}
    onClick={onClick}
    transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
    role="group"
    _hover={onClick ? {
      borderColor: `${accent}40`,
      transform: 'translateY(-2px)',
      bg: 'surface.850',
    } : {}}
  >
    {/* Top accent line that grows on hover */}
    <Box
      position="absolute"
      top={0}
      left={0}
      h="2px"
      w="32px"
      bg={accent}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _groupHover={onClick ? { w: '100%', boxShadow: `0 0 12px ${accent}` } : {}}
    />

    {/* Subtle radial gradient bloom on hover */}
    <Box
      position="absolute"
      top={0}
      right={0}
      w="200px"
      h="200px"
      bg={`radial-gradient(circle at top right, ${accent}10, transparent 60%)`}
      opacity={0}
      transition="opacity 0.4s ease"
      pointerEvents="none"
      _groupHover={onClick ? { opacity: 1 } : {}}
    />

    {/* Header row: tag + arrow */}
    <HStack spacing={2} mb={4} justify="space-between" position="relative">
      <HStack spacing={2}>
        <Box
          p={1.5}
          borderRadius="md"
          bg={`${accent}12`}
          border="1px solid"
          borderColor={`${accent}25`}
          transition="all 0.3s"
          _groupHover={onClick ? { bg: `${accent}20`, borderColor: `${accent}50` } : {}}
        >
          <Icon as={icon} boxSize={3.5} color={accent} />
        </Box>
        <Text
          fontSize="2xs"
          fontFamily="mono"
          fontWeight="700"
          color="surface.500"
          textTransform="uppercase"
          letterSpacing="0.1em"
        >
          {tag}
        </Text>
      </HStack>
      {onClick && (
        <Box
          opacity={0}
          transform="translateX(-4px)"
          transition="all 0.3s"
          _groupHover={{ opacity: 1, transform: 'translateX(0)' }}
        >
          <Icon as={TbArrowUpRight} boxSize={3.5} color={accent} />
        </Box>
      )}
    </HStack>

    {/* Value */}
    <Text
      color="white"
      fontSize="3xl"
      fontWeight="800"
      fontFamily="mono"
      lineHeight="1"
      mb={2}
      letterSpacing="-0.02em"
      position="relative"
    >
      {loading ? <Spinner size="sm" color={accent} /> : value}
    </Text>

    {/* Label + sub */}
    <Text color="surface.400" fontSize="xs" fontWeight="600" position="relative">
      {label}
    </Text>
    {sub && (
      <Text color="surface.600" fontSize="2xs" mt={0.5} fontFamily="mono" position="relative">
        {sub}
      </Text>
    )}
  </Box>
);

const PulseGrid = ({ stats, loading }) => {
  const navigate = useNavigate();

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
      <SignalBlock
        tag="Clients"
        icon={TbUsers}
        value={stats.clients}
        label="Active clients"
        sub={stats.clientsTotal > 0 ? `${stats.clientsTotal} total` : null}
        accent="#00E5E5"
        onClick={() => navigate('/clients/')}
        loading={loading}
      />
      <SignalBlock
        tag="Projects"
        icon={TbRocket}
        value={stats.projects}
        label="Active projects"
        sub={stats.projectsTotal > 0 ? `${stats.projectsTotal} total` : null}
        accent="#8B5CF6"
        onClick={() => navigate('/projects/')}
        loading={loading}
      />
      <SignalBlock
        tag="Revenue"
        icon={TbCoin}
        value={loading ? '...' : `$${stats.revenue.toLocaleString()}`}
        label="Collected"
        sub="all time"
        accent="#39FF14"
        onClick={() => navigate('/invoicing/')}
        loading={loading}
      />
      <SignalBlock
        tag="Outstanding"
        icon={TbBolt}
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