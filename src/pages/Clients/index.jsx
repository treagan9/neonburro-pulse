// src/pages/Clients/index.jsx
import { useState, useEffect } from 'react';
import { Box, VStack, useDisclosure } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import ClientsHeader from './components/ClientsHeader';
import ClientFilters from './components/ClientFilters';
import ClientGrid from './components/ClientGrid';
import ClientModal from './components/ClientModal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingClient, setEditingClient] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const handleAdd = () => { setEditingClient(null); onOpen(); };
  const handleEdit = (client) => { setEditingClient(client); onOpen(); };

  const filtered = clients.filter((c) => {
    const matchSearch = search
      ? c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    lead: clients.filter((c) => c.status === 'lead').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
  };

  return (
    <Box p={{ base: 4, md: 6 }}>
      <VStack spacing={5} align="stretch">
        <ClientsHeader counts={counts} onAdd={handleAdd} />
        <ClientFilters
          search={search}
          onSearch={setSearch}
          filterStatus={filterStatus}
          onFilterStatus={setFilterStatus}
          counts={counts}
        />
        <ClientGrid
          clients={filtered}
          loading={loading}
          onEdit={handleEdit}
          onAdd={handleAdd}
          isEmpty={clients.length === 0}
        />
      </VStack>

      <ClientModal
        isOpen={isOpen}
        onClose={onClose}
        client={editingClient}
        onSave={fetchClients}
      />
    </Box>
  );
};

export default Clients;