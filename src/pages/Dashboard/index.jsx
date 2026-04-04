// src/pages/Dashboard/index.jsx
import { useState, useEffect, useCallback } from 'react';
import { Box, VStack } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [clientsRes, projectsRes, invoicesRes, activityRes] = await Promise.all([
      supabase.from('clients').select('id, status'),
      supabase.from('projects').select('id, status'),
      supabase.from('invoices').select('id, status, total, total_paid'),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(25),
    ]);

    const clients = clientsRes.data || [];
    const projects = projectsRes.data || [];
    const invoices = invoicesRes.data || [];
    const revenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_paid || 0), 0);
    const outstanding = invoices
      .filter((inv) => ['sent', 'viewed', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0)), 0);

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
    <Box p={{ base: 4, md: 6 }} maxW="1200px">
      <VStack spacing={6} align="stretch">
        <SystemHeader onRefresh={handleRefresh} refreshing={refreshing} />
        <PulseGrid stats={stats} loading={loading} />
        <QuickActions />
        <ActivityStream activities={activities} loading={loading} />
      </VStack>
    </Box>
  );
};

export default Dashboard;