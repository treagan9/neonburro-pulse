// src/pages/Dashboard/index.jsx
// Dashboard - Pulse stat cards, quick actions, form inbox, activity stream
// Form Inbox sits above the activity stream as a collapsable section

import { useState, useEffect } from 'react';
import { Box, VStack, Container, SimpleGrid } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import SystemHeader from './components/SystemHeader';
import PulseGrid from './components/PulseGrid';
import QuickActions from './components/QuickActions';
import FormInbox from './components/FormInbox';
import ActivityStream from './components/ActivityStream';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeClients: 0,
    totalClients: 0,
    activeProjects: 0,
    revenue: 0,
    outstanding: 0,
    pendingInvoices: 0,
  });
  const [activities, setActivities] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [onlineCount, setOnlineCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      // Parallel fetch everything
      const [
        clientsRes,
        projectsRes,
        invoicesRes,
        activitiesRes,
        profilesRes,
        presenceRes,
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('id, status'),
        supabase
          .from('projects')
          .select('id, status')
          .eq('status', 'active'),
        supabase
          .from('invoices')
          .select('id, status, total, total_paid, paid_at')
          .is('cancelled_at', null),
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
      const projects = projectsRes.data || [];
      const invoices = invoicesRes.data || [];

      // Compute stats
      const activeClients = clients.filter((c) => c.status === 'active').length;
      const revenue = invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_paid || 0), 0);
      const outstanding = invoices
        .filter((inv) => ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0)), 0);
      const pendingInvoices = invoices
        .filter((inv) => ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status)).length;

      setStats({
        activeClients,
        totalClients: clients.length,
        activeProjects: projects.length,
        revenue,
        outstanding,
        pendingInvoices,
      });

      setActivities(activitiesRes.data || []);

      // Build profile map for avatar lookups in ActivityStream
      const map = {};
      (profilesRes.data || []).forEach((p) => { map[p.id] = p; });
      setProfileMap(map);

      // Count unique online users
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
      {/* Ambient gradient */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="500px"
        bg="radial-gradient(ellipse at top center, rgba(0,229,229,0.04), transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="1200px" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }} position="relative">
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          {/* Top: system header with online count + time + refresh */}
          <SystemHeader
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onlineCount={onlineCount}
          />

          {/* Pulse stat cards */}
          <PulseGrid stats={stats} loading={loading} />

          {/* Quick action buttons */}
          <QuickActions />

          {/* Form Inbox - collapsable, above the activity stream */}
          <FormInbox />

          {/* Activity stream */}
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