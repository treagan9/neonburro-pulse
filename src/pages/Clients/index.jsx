// src/pages/Clients/index.jsx
import { useState, useEffect } from 'react';
import { Box, VStack, Container, useDisclosure } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import ClientsHeader from './components/ClientsHeader';
import ClientFilters from './components/ClientFilters';
import ClientGrid from './components/ClientGrid';
import ClientModal from './components/ClientModal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ activeSprints: 0, mtdRevenue: 0, outstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [editingClient, setEditingClient] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);

    // Parallel fetch: clients, all invoices with items, all projects
    const [clientsRes, invoicesRes, projectsRes] = await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('id, client_id, status, total, total_paid, created_at, paid_at, invoice_items(amount, payment_status, payment_amount, payment_mode)'),
      supabase
        .from('projects')
        .select('id, client_id'),
    ]);

    const allInvoices = invoicesRes.data || [];
    const allProjects = projectsRes.data || [];

    // Count projects per client
    const projectCountMap = {};
    allProjects.forEach((p) => {
      if (!p.client_id) return;
      projectCountMap[p.client_id] = (projectCountMap[p.client_id] || 0) + 1;
    });

    // Build per-client stats
    const clientStatsMap = {};
    allInvoices.forEach((inv) => {
      if (!inv.client_id) return;
      if (!clientStatsMap[inv.client_id]) {
        clientStatsMap[inv.client_id] = { sprint_count: 0, total_funded: 0, last_invoice: null };
      }
      const items = inv.invoice_items || [];
      clientStatsMap[inv.client_id].sprint_count += items.length;
      clientStatsMap[inv.client_id].total_funded += parseFloat(inv.total_paid || 0);
      const invDate = inv.paid_at || inv.created_at;
      if (invDate && (!clientStatsMap[inv.client_id].last_invoice || invDate > clientStatsMap[inv.client_id].last_invoice)) {
        clientStatsMap[inv.client_id].last_invoice = invDate;
      }
    });

    // Enrich clients with their stats
    const enriched = (clientsRes.data || []).map((c) => ({
      ...c,
      sprint_count: clientStatsMap[c.id]?.sprint_count || 0,
      total_funded: clientStatsMap[c.id]?.total_funded || 0,
      project_count: projectCountMap[c.id] || 0,
      last_activity_at: c.last_activity_at || clientStatsMap[c.id]?.last_invoice || c.created_at,
    }));

    setClients(enriched);

    // Compute global stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeSprints = allInvoices
      .filter((inv) => ['sent', 'viewed', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.invoice_items?.length || 0), 0);

    const mtdRevenue = allInvoices
      .filter((inv) => inv.paid_at && new Date(inv.paid_at) >= monthStart)
      .reduce((sum, inv) => sum + parseFloat(inv.total_paid || 0), 0);

    const outstanding = allInvoices
      .filter((inv) => ['sent', 'viewed', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0)), 0);

    setStats({ activeSprints, mtdRevenue, outstanding });
    setLoading(false);
  };

  const handleAdd = () => { setEditingClient(null); onOpen(); };
  const handleEdit = (client) => { setEditingClient(client); onOpen(); };

  // Filter
  const filtered = clients.filter((c) => {
    const searchLower = search.toLowerCase();
    const matchSearch = search
      ? c.name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(search) ||
        c.tags?.some((t) => t.toLowerCase().includes(searchLower))
      : true;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return (a.name || '').localeCompare(b.name || '');
      case 'most_funded':
        return (b.total_funded || 0) - (a.total_funded || 0);
      case 'most_sprints':
        return (b.sprint_count || 0) - (a.sprint_count || 0);
      case 'activity':
        return new Date(b.last_activity_at || 0) - new Date(a.last_activity_at || 0);
      case 'recent':
      default:
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  });

  const counts = {
    all: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    lead: clients.filter((c) => c.status === 'lead').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
  };

  return (
    <Box position="relative" minH="100%">
      {/* Ambient background - same vibe as Dashboard */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="400px"
        bg="radial-gradient(ellipse at top center, rgba(0,229,229,0.025), transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="1200px" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }} position="relative">
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          <ClientsHeader counts={counts} stats={stats} onAdd={handleAdd} />
          <ClientFilters
            search={search}
            onSearch={setSearch}
            filterStatus={filterStatus}
            onFilterStatus={setFilterStatus}
            sortBy={sortBy}
            onSortBy={setSortBy}
            counts={counts}
          />
          <ClientGrid
            clients={sorted}
            loading={loading}
            onEdit={handleEdit}
            onAdd={handleAdd}
            isEmpty={clients.length === 0}
          />
        </VStack>
      </Container>

      <ClientModal
        isOpen={isOpen}
        onClose={onClose}
        client={editingClient}
        onSave={fetchData}
      />
    </Box>
  );
};

export default Clients;