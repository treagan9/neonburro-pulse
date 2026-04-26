// src/pages/Dashboard/index.jsx
// Dashboard - hero number JetBrains Mono, dialed down a notch in size
// to feel more like a status indicator than a billboard.
// FormInbox + ActivityStream as naked sections.
// TeamOnlineStrip pinned top-left, refresh top-right.

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, IconButton, Tooltip,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { TbPlus, TbRefresh } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import TeamOnlineStrip from './components/TeamOnlineStrip';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        clientsRes,
        invoicesRes,
        formsRes,
        activitiesRes,
        profilesRes,
      ] = await Promise.all([
        supabase.from('clients').select('id, status'),
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
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url'),
      ]);

      const clients = clientsRes.data || [];
      const invoices = invoicesRes.data || [];
      const forms = formsRes.data || [];

      const activeClients = clients.filter((c) => c.status === 'active').length;

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

  // Choose what to feature in the hero number
  const heroValue = stats.outstanding > 0 ? stats.outstanding : stats.revenue;
  const heroLabel = stats.outstanding > 0 ? 'outstanding' : 'collected';
  const heroColor = stats.outstanding > 0 ? 'accent.banana' : 'accent.neon';

  return (
    <Box position="relative" minH="100%">
      {/* Ambient top glow */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="500px"
        bg="radial-gradient(ellipse at top center, rgba(0,229,229,0.04), transparent 70%)"
        pointerEvents="none"
      />

      <VStack spacing={{ base: 8, md: 12 }} align="stretch" position="relative">

        {/* Top strip: team avatars left, refresh top-right */}
        <HStack justify="space-between" align="center" flexWrap="wrap" spacing={4}>
          <Box flex={1} minW={0}>
            <TeamOnlineStrip />
          </Box>

          <Tooltip
            label="Refresh"
            placement="bottom"
            hasArrow
            bg="surface.800"
            color="white"
            fontSize="xs"
          >
            <IconButton
              icon={<TbRefresh size={14} />}
              onClick={handleRefresh}
              isLoading={refreshing}
              variant="ghost"
              size="sm"
              color="surface.500"
              h="32px"
              w="32px"
              minW="32px"
              borderRadius="md"
              border="1px solid"
              borderColor="surface.800"
              _hover={{
                color: 'brand.500',
                borderColor: 'brand.500',
                bg: 'rgba(0,229,229,0.05)',
              }}
              transition="all 0.15s"
              aria-label="Refresh dashboard"
            />
          </Tooltip>
        </HStack>

        {/* HERO BLOCK - smaller, more refined */}
        <VStack align="stretch" spacing={6}>
          <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={4}>
            <VStack align="start" spacing={2} flex={1} minW={0}>
              <Text
                fontSize="2xs"
                fontWeight="700"
                color="brand.500"
                textTransform="uppercase"
                letterSpacing="0.15em"
                fontFamily="mono"
              >
                Dashboard
              </Text>

              {/* Hero number - JetBrains Mono, sized down to feel like an indicator */}
              <HStack align="baseline" spacing={3} flexWrap="wrap">
                <Text
                  fontFamily="mono"
                  fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
                  fontWeight="800"
                  color={heroColor}
                  letterSpacing="-0.02em"
                  lineHeight="1"
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {currency(heroValue)}
                </Text>
                <Text
                  fontSize={{ base: 'xs', md: 'sm' }}
                  color="surface.400"
                  fontFamily="mono"
                  fontWeight="500"
                  pb={1}
                >
                  {heroLabel}
                </Text>
              </HStack>
            </VStack>

            {/* Action buttons - right side on desktop, below on mobile */}
            <HStack
              spacing={3}
              flexShrink={0}
              alignSelf={{ base: 'flex-start', md: 'flex-end' }}
            >
              <HStack
                as="button"
                spacing={1.5}
                cursor="pointer"
                onClick={() => navigate('/clients/')}
                color="surface.300"
                px={3}
                py={2}
                border="1px solid"
                borderColor="surface.800"
                borderRadius="lg"
                transition="all 0.15s"
                _hover={{
                  color: 'brand.500',
                  borderColor: 'brand.500',
                  bg: 'rgba(0,229,229,0.04)',
                }}
                userSelect="none"
              >
                <Icon as={TbPlus} boxSize={3.5} />
                <Text fontSize="xs" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase" fontFamily="mono">
                  Client
                </Text>
              </HStack>
              <HStack
                as="button"
                spacing={1.5}
                cursor="pointer"
                onClick={() => navigate('/invoicing/?invoice=new')}
                color="surface.300"
                px={3}
                py={2}
                border="1px solid"
                borderColor="surface.800"
                borderRadius="lg"
                transition="all 0.15s"
                _hover={{
                  color: 'accent.banana',
                  borderColor: 'accent.banana',
                  bg: 'rgba(255,229,0,0.04)',
                }}
                userSelect="none"
              >
                <Icon as={TbPlus} boxSize={3.5} />
                <Text fontSize="xs" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase" fontFamily="mono">
                  Invoice
                </Text>
              </HStack>
            </HStack>
          </HStack>

          {/* Secondary stat strip - smaller, monospace, informational */}
          <HStack
            spacing={0}
            color="surface.500"
            fontSize="xs"
            fontFamily="mono"
            flexWrap="wrap"
            rowGap={1}
          >
            <Text
              as="button"
              color="white"
              fontWeight="700"
              onClick={() => navigate('/clients/')}
              _hover={{ color: 'brand.500' }}
              transition="color 0.15s"
            >
              {stats.activeClients}
            </Text>
            <Text color="surface.600" mx={1.5}>active clients</Text>

            <Text color="surface.700" mx={1}>·</Text>

            <Text
              as="button"
              color="white"
              fontWeight="700"
              onClick={() => navigate('/invoicing/')}
              _hover={{ color: 'brand.500' }}
              transition="color 0.15s"
            >
              {stats.activeSprints}
            </Text>
            <Text color="surface.600" mx={1.5}>active sprints</Text>

            {stats.revenue > 0 && stats.outstanding > 0 && (
              <>
                <Text color="surface.700" mx={1}>·</Text>
                <Text color="accent.neon" fontWeight="700">{currency(stats.revenue)}</Text>
                <Text color="surface.600" mx={1.5}>collected</Text>
              </>
            )}

            {stats.unreadForms > 0 && (
              <>
                <Text color="surface.700" mx={1}>·</Text>
                <Text color="brand.500" fontWeight="700">{stats.unreadForms}</Text>
                <Text color="surface.600" mx={1.5}>
                  unread form{stats.unreadForms !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </HStack>
        </VStack>

        {/* Existing rich sections */}
        <FormInbox />

        <ActivityStream
          activities={activities}
          profileMap={profileMap}
          loading={loading}
        />
      </VStack>
    </Box>
  );
};

export default Dashboard;
