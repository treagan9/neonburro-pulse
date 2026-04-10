// src/pages/Dashboard/index.jsx
// Clean dashboard matching the Clients/Invoicing DNA
// - Title row with subtle action links top-right
// - Inline mono pulse strip (replaces stat cards)
// - Form Inbox + Activity Stream as naked sections
// - SystemHeader: live time + online count + refresh

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Container, Icon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { TbPlus } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import SystemHeader from './components/SystemHeader';
import FormInbox from './components/FormInbox';
import ActivityStream from './components/ActivityStream';

const currency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activeClients: 0,
    totalClients: 0,
    activeSprints: 0,
    revenue: 0,
    outstanding: 0,
    pendingInvoices: 0,
    unreadForms: 0,
  });
  const [activities, setActivities] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [onlineCount, setOnlineCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [
        clientsRes,
        invoicesRes,
        formsRes,
        activitiesRes,
        profilesRes,
        presenceRes,
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('id, status'),
        supabase
          .from('invoices')
          .select('id, status, total, total_paid, paid_at, invoice_items(id, payment_status, locked, is_billable)')
          .is('cancelled_at', null),
        supabase
          .from('form_submissions')
          .select('id, status')
          .is('archived_at', null),
        supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url'),
        supabase
          .from('presence')
          .select('user_id')
          .gte('last_seen', new Date(Date.now() - 60000).toISOString()),
      ]);

      const clients = clientsRes.data || [];
      const invoices = invoicesRes.data || [];
      const forms = formsRes.data || [];

      // Compute everything
      const activeClients = clients.filter((c) => c.status === 'active').length;

      // Active sprints = billable, unpaid, on sent invoices
      const activeSprints = invoices
        .filter((inv) => ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => {
          const sprintsAwaitingAction = (inv.invoice_items || []).filter(
            (i) => i.is_billable !== false && i.payment_status !== 'paid' && !i.locked
          );
          return sum + sprintsAwaitingAction.length;
        }, 0);

      const revenue = invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_paid || 0), 0);

      const outstanding = invoices
        .filter((inv) => ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0)), 0);

      const pendingInvoices = invoices.filter((inv) =>
        ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status)
      ).length;

      const unreadForms = forms.filter((f) => f.status === 'unread').length;

      setStats({
        activeClients,
        totalClients: clients.length,
        activeSprints,
        revenue,
        outstanding,
        pendingInvoices,
        unreadForms,
      });

      setActivities(activitiesRes.data || []);

      const map = {};
      (profilesRes.data || []).forEach((p) => { map[p.id] = p; });
      setProfileMap(map);

      const uniqueOnline = new Set((presenceRes.data || []).map((p) => p.user_id));
      setOnlineCount(Math.max(1, uniqueOnline.size));
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
  };

  return (
    <Box position="relative" minH="100%">
      {/* Ambient gradient at top */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="500px"
        bg="radial-gradient(ellipse at top center, rgba(0,229,229,0.04), transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="1100px" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }} position="relative">
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">

          {/* SystemHeader at very top - online count + time + refresh */}
          <SystemHeader
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onlineCount={onlineCount}
          />

          {/* Title row with action links - matches Clients page */}
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
              <Text
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="800"
                color="white"
                letterSpacing="-0.02em"
                lineHeight="1"
              >
                Dashboard
              </Text>
              <HStack spacing={5}>
                <HStack
                  spacing={1.5}
                  cursor="pointer"
                  onClick={() => navigate('/clients/')}
                  color="brand.500"
                  opacity={0.7}
                  transition="all 0.15s"
                  _hover={{ opacity: 1, transform: 'translateY(-1px)' }}
                  userSelect="none"
                >
                  <Icon as={TbPlus} boxSize={3.5} />
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase">
                    New Client
                  </Text>
                </HStack>
                <HStack
                  spacing={1.5}
                  cursor="pointer"
                  onClick={() => navigate('/invoicing/?invoice=new')}
                  color="accent.banana"
                  opacity={0.7}
                  transition="all 0.15s"
                  _hover={{ opacity: 1, transform: 'translateY(-1px)' }}
                  userSelect="none"
                >
                  <Icon as={TbPlus} boxSize={3.5} />
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase">
                    New Invoice
                  </Text>
                </HStack>
              </HStack>
            </HStack>

            {/* Inline pulse strip - the only "stats" on the dashboard */}
            <HStack spacing={0} color="surface.500" fontSize="xs" fontFamily="mono" flexWrap="wrap">
              <Text
                color="white"
                fontWeight="700"
                cursor="pointer"
                onClick={() => navigate('/clients/')}
                _hover={{ color: 'brand.500' }}
                transition="color 0.15s"
              >
                {stats.activeClients}
              </Text>
              <Text color="surface.600" mx={1.5}>active clients</Text>
              <Text color="surface.700" mx={1}>·</Text>
              <Text
                color="white"
                fontWeight="700"
                cursor="pointer"
                onClick={() => navigate('/invoicing/')}
                _hover={{ color: 'brand.500' }}
                transition="color 0.15s"
              >
                {stats.activeSprints}
              </Text>
              <Text color="surface.600" mx={1.5}>active sprints</Text>
              <Text color="surface.700" mx={1}>·</Text>
              <Text color="accent.neon" fontWeight="700">{currency(stats.revenue)}</Text>
              <Text color="surface.600" mx={1.5}>collected</Text>
              {stats.outstanding > 0 && (
                <>
                  <Text color="surface.700" mx={1}>·</Text>
                  <Text
                    color="accent.banana"
                    fontWeight="700"
                    cursor="pointer"
                    onClick={() => navigate('/invoicing/?status=sent')}
                    _hover={{ opacity: 0.8 }}
                  >
                    {currency(stats.outstanding)}
                  </Text>
                  <Text color="surface.600" mx={1.5}>outstanding</Text>
                </>
              )}
              {stats.unreadForms > 0 && (
                <>
                  <Text color="surface.700" mx={1}>·</Text>
                  <Text color="brand.500" fontWeight="700">{stats.unreadForms}</Text>
                  <Text color="surface.600" mx={1.5}>unread form{stats.unreadForms !== 1 ? 's' : ''}</Text>
                </>
              )}
            </HStack>
          </VStack>

          {/* Form Inbox - naked section */}
          <FormInbox />

          {/* Activity Stream - naked section */}
          <ActivityStream
            activities={activities}
            profileMap={profileMap}
            loading={loading}
          />
        </VStack>
      </Container>
    </Box>
  );
};

export default Dashboard;