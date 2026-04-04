// src/pages/Dashboard/index.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, SimpleGrid, Icon, Center,
  IconButton, Spinner, Divider,
} from '@chakra-ui/react';
import {
  TbUsers, TbRocket, TbFileInvoice, TbInbox, TbRefresh,
  TbUser, TbPlus, TbEdit, TbTrash, TbMail, TbCheck,
  TbActivity,
} from 'react-icons/tb';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const CARD_ACCENTS = {
  Clients:  '#00E5E5',
  Projects: '#8B5CF6',
  Invoices: '#39FF14',
  Forms:    '#FFE500',
};

const ACTIVITY_ICONS = {
  client_created:  { icon: TbPlus,  color: 'accent.neon' },
  client_updated:  { icon: TbEdit,  color: 'brand.500' },
  client_deleted:  { icon: TbTrash, color: 'status.red' },
  project_created: { icon: TbPlus,  color: 'accent.purple' },
  project_updated: { icon: TbEdit,  color: 'accent.purple' },
  invoice_sent:    { icon: TbMail,  color: 'accent.neon' },
  invoice_paid:    { icon: TbCheck, color: 'accent.neon' },
  login:           { icon: TbUser,  color: 'surface.400' },
};

const StatCard = ({ icon, label, value, accent, onClick, loading }) => (
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
          <Text
            color="surface.500"
            fontSize="xs"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            {label}
          </Text>
          <Text color="white" fontSize="2xl" fontWeight="700" lineHeight="1.2">
            {loading ? <Spinner size="sm" color={accent} /> : value}
          </Text>
        </Box>
      </HStack>
    </Box>
  </Box>
);

const ActivityItem = ({ activity }) => {
  const config = ACTIVITY_ICONS[activity.action] || { icon: TbActivity, color: 'surface.500' };
  const clientName = activity.metadata?.client_name || activity.metadata?.project_name || '';

  return (
    <HStack spacing={3} py={3} align="start">
      <Center
        w="28px"
        h="28px"
        borderRadius="md"
        bg="surface.850"
        flexShrink={0}
        mt={0.5}
      >
        <Icon as={config.icon} boxSize={3.5} color={config.color} />
      </Center>
      <Box flex={1} minW={0}>
        <Text color="white" fontSize="sm" lineHeight="1.4">
          <Text as="span" fontWeight="600">{activity.action?.replace(/_/g, ' ')}</Text>
          {clientName && (
            <Text as="span" color="brand.500" fontWeight="600"> {clientName}</Text>
          )}
        </Text>
        <Text color="surface.600" fontSize="xs" mt={0.5} fontFamily="mono">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </Text>
      </Box>
    </HStack>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ clients: 0, projects: 0, invoices: 0, forms: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [clientsRes, projectsRes, invoicesRes, activityRes] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('id', { count: 'exact', head: true }),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    setStats({
      clients:  clientsRes.count || 0,
      projects: projectsRes.count || 0,
      invoices: invoicesRes.count || 0,
      forms:    0,
    });
    setActivities(activityRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

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
            onClick={handleRefresh}
            isLoading={refreshing}
          />
        </HStack>

        {/* Stat cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          <StatCard
            icon={TbUsers}
            label="Clients"
            value={stats.clients}
            accent={CARD_ACCENTS.Clients}
            onClick={() => navigate('/clients/')}
            loading={loading}
          />
          <StatCard
            icon={TbRocket}
            label="Projects"
            value={stats.projects}
            accent={CARD_ACCENTS.Projects}
            onClick={() => navigate('/projects/')}
            loading={loading}
          />
          <StatCard
            icon={TbFileInvoice}
            label="Invoices"
            value={stats.invoices}
            accent={CARD_ACCENTS.Invoices}
            onClick={() => navigate('/invoicing/')}
            loading={loading}
          />
          <StatCard
            icon={TbInbox}
            label="Forms"
            value={stats.forms}
            accent={CARD_ACCENTS.Forms}
            onClick={() => navigate('/forms/')}
            loading={loading}
          />
        </SimpleGrid>

        {/* Activity feed */}
        <Box
          bg="surface.900"
          border="1px solid"
          borderColor="surface.800"
          borderRadius="xl"
          p={{ base: 4, md: 6 }}
        >
          <HStack spacing={2} mb={4}>
            <Icon as={TbActivity} boxSize={4} color="brand.500" />
            <Text
              color="brand.500"
              fontSize="xs"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Recent Activity
            </Text>
          </HStack>

          {loading ? (
            <Center py={8}>
              <Spinner size="md" color="brand.500" thickness="3px" />
            </Center>
          ) : activities.length === 0 ? (
            <Center py={8}>
              <VStack spacing={2}>
                <Icon as={TbActivity} boxSize={6} color="surface.700" />
                <Text color="surface.600" fontSize="sm">No activity yet</Text>
                <Text color="surface.700" fontSize="xs">
                  Add a client to get started
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack align="stretch" spacing={0} divider={<Divider borderColor="surface.800" />}>
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default Dashboard;