// src/pages/Dashboard/index.jsx
// NeonBurro Pulse - Command center
import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, SimpleGrid, Icon, Spinner, Center,
  IconButton,
} from '@chakra-ui/react';
import {
  TbUsers, TbRocket, TbFileInvoice, TbInbox, TbRefresh,
} from 'react-icons/tb';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const CARD_ACCENTS = {
  Clients: '#00E5E5',
  Projects: '#8B5CF6',
  Invoices: '#39FF14',
  Forms: '#FFE500',
};

const StatCard = ({ icon, label, value, accent, onClick }) => (
  <Box
    bg="surface.900"
    border="1px solid"
    borderColor="surface.800"
    borderRadius="xl"
    overflow="hidden"
    cursor={onClick ? 'pointer' : 'default'}
    onClick={onClick}
    transition="all 0.15s"
    _hover={onClick ? {
      borderColor: 'surface.600',
      transform: 'translateY(-1px)',
      shadow: `0 4px 20px ${accent}22`,
    } : {}}
  >
    <Box h="2px" style={{ background: accent }} />
    <Box p={4}>
      <HStack spacing={3}>
        <Icon as={icon} boxSize={5} color={accent} />
        <Box>
          <Text color="surface.500" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
            {label}
          </Text>
          <Text color="white" fontSize="2xl" fontWeight="700" lineHeight="1.2">
            {value}
          </Text>
        </Box>
      </HStack>
    </Box>
  </Box>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <Box p={{ base: 4, md: 6 }}>
      <VStack spacing={5} align="stretch">

        {/* Header */}
        <HStack justify="space-between">
          <Box>
            <Text fontSize="2xl" fontWeight="700" color="white">Dashboard</Text>
            <Text color="surface.400" fontSize="sm" mt={0.5}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </Text>
          </Box>
          <IconButton
            icon={<TbRefresh />}
            variant="ghost"
            color="surface.400"
            size="sm"
            aria-label="Refresh"
            _hover={{ color: 'white' }}
          />
        </HStack>

        {/* Stat cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          <StatCard icon={TbUsers} label="Clients" value="--" accent={CARD_ACCENTS.Clients} onClick={() => navigate('/clients/')} />
          <StatCard icon={TbRocket} label="Projects" value="--" accent={CARD_ACCENTS.Projects} onClick={() => navigate('/projects/')} />
          <StatCard icon={TbFileInvoice} label="Invoices" value="--" accent={CARD_ACCENTS.Invoices} onClick={() => navigate('/invoicing/')} />
          <StatCard icon={TbInbox} label="Forms" value="--" accent={CARD_ACCENTS.Forms} onClick={() => navigate('/forms/')} />
        </SimpleGrid>

        {/* Activity feed placeholder */}
        <Box
          bg="surface.900"
          border="1px solid"
          borderColor="surface.800"
          borderRadius="xl"
          p={6}
        >
          <Text color="surface.500" fontSize="sm" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em" mb={4}>
            Recent Activity
          </Text>
          <Center py={8}>
            <VStack spacing={2}>
              <Text color="surface.600" fontSize="sm">Connect Supabase to start tracking activity</Text>
              <Text color="surface.700" fontSize="xs">Add your Supabase URL and anon key to .env</Text>
            </VStack>
          </Center>
        </Box>

      </VStack>
    </Box>
  );
};

export default Dashboard;
