// src/pages/Dashboard/index.jsx
import { useState, useEffect, useCallback } from 'react';
import { Box, VStack, Container } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import { usePresence } from '../../hooks/usePresence';
import SystemHeader from './components/SystemHeader';
import PulseGrid from './components/PulseGrid';
import ActivityStream from './components/ActivityStream';
import QuickActions from './components/QuickActions';

const Dashboard = () => {
  const [stats, setStats] = useState({
    clients: 0, clientsTotal: 0,
    projects: 0, projectsTotal: 0,
    invoices: 0, revenue: 0, outstanding: 0,
  });
  const [activities, setActivities] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { presenceMap } = usePresence();
  const onlineCount = Object.values(presenceMap).filter((p) => p.status === 'online').length;

  const fetchData = useCallback(async () => {
    const [clientsRes, projectsRes, invoicesRes, activityRes, profilesRes] = await Promise.all([
      supabase.from('clients').select('id, status'),
      supabase.from('projects').select('id, status'),
      supabase.from('invoices').select('id, status, total, total_paid'),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('profiles').select('id, display_name, username, avatar_url, role'),
    ]);

    const clients = clientsRes.data || [];
    const projects = projectsRes.data || [];
    const invoices = invoicesRes.data || [];
    const revenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_paid || 0), 0);
    const outstanding = invoices
      .filter((inv) => ['sent', 'viewed', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0)), 0);

    // Build profile map for fast lookup in activity items
    const map = {};
    (profilesRes.data || []).forEach((p) => { map[p.id] = p; });
    setProfileMap(map);

    setStats({
      clients: clients.filter((c) => c.status === 'active').length,
      clientsTotal: clients.length,
      projects: projects.filter((p) => p.status === 'active').length,
      projectsTotal: projects.length,
      invoices: invoices.length,
      revenue,
      outstanding,
    });
    setActivities(activityRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <Box position="relative" minH="100%">
      {/* Ambient background gradient - very subtle */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="400px"
        bg="radial-gradient(ellipse at top center, rgba(0,229,229,0.025), transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="1200px" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }} position="relative">
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          <SystemHeader
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onlineCount={onlineCount}
          />
          <PulseGrid stats={stats} loading={loading} />
          <QuickActions />
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