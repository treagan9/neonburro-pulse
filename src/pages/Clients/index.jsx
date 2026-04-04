// src/pages/Clients/index.jsx
import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Input, Button, IconButton,
  SimpleGrid, Icon, Badge, useToast, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, FormControl, FormLabel,
  Textarea, Select, Divider, Center, Spinner,
} from '@chakra-ui/react';
import {
  TbPlus, TbSearch, TbUsers, TbMail, TbPhone,
  TbBuilding, TbEdit, TbTrash, TbDots, TbUser,
  TbAlertTriangle,
} from 'react-icons/tb';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

const STATUS_CONFIG = {
  active:   { label: 'Active',   color: 'green',  bg: 'rgba(57,255,20,0.08)',  border: 'rgba(57,255,20,0.25)' },
  lead:     { label: 'Lead',     color: 'yellow', bg: 'rgba(255,229,0,0.08)',  border: 'rgba(255,229,0,0.25)' },
  inactive: { label: 'Inactive', color: 'gray',   bg: 'rgba(128,128,128,0.08)', border: 'rgba(128,128,128,0.25)' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <Badge
      fontSize="2xs"
      fontWeight="700"
      textTransform="uppercase"
      letterSpacing="0.05em"
      px={2}
      py={0.5}
      borderRadius="full"
      bg={config.bg}
      color={`${config.color}.400`}
      border="1px solid"
      borderColor={config.border}
    >
      {config.label}
    </Badge>
  );
};

const ClientCard = ({ client, onEdit, onDelete }) => (
  <Box
    bg="surface.900"
    border="1px solid"
    borderColor="surface.800"
    borderRadius="xl"
    overflow="hidden"
    transition="all 0.15s"
    cursor="pointer"
    onClick={() => onEdit(client)}
    _hover={{
      borderColor: 'surface.600',
      transform: 'translateY(-1px)',
      shadow: '0 4px 20px rgba(0,229,229,0.06)',
    }}
  >
    <Box h="2px" bg={STATUS_CONFIG[client.status]?.color === 'green' ? 'accent.neon' : STATUS_CONFIG[client.status]?.color === 'yellow' ? 'accent.banana' : 'surface.700'} />
    <Box p={4}>
      <HStack justify="space-between" align="start" mb={3}>
        <VStack align="start" spacing={0.5} flex={1} minW={0}>
          <Text color="white" fontSize="sm" fontWeight="700" noOfLines={1}>
            {client.name}
          </Text>
          {client.company && (
            <HStack spacing={1.5}>
              <Icon as={TbBuilding} boxSize={3} color="surface.500" />
              <Text color="surface.400" fontSize="xs" noOfLines={1}>{client.company}</Text>
            </HStack>
          )}
        </VStack>
        <StatusBadge status={client.status} />
      </HStack>

      <VStack align="start" spacing={1.5}>
        {client.email && (
          <HStack spacing={1.5}>
            <Icon as={TbMail} boxSize={3} color="surface.600" />
            <Text color="surface.400" fontSize="xs" noOfLines={1}>{client.email}</Text>
          </HStack>
        )}
        {client.phone && (
          <HStack spacing={1.5}>
            <Icon as={TbPhone} boxSize={3} color="surface.600" />
            <Text color="surface.400" fontSize="xs">{client.phone}</Text>
          </HStack>
        )}
      </VStack>

      <Divider borderColor="surface.800" my={3} />

      <Text color="surface.600" fontSize="2xs" fontFamily="mono">
        {format(new Date(client.created_at), 'MMM d, yyyy')}
      </Text>
    </Box>
  </Box>
);

const ClientModal = ({ isOpen, onClose, client, onSave, onDelete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  const isEditing = !!client?.id;

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setCompany(client.company || '');
      setStatus(client.status || 'active');
      setNotes(client.notes || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setStatus('active');
      setNotes('');
    }
    setConfirmDelete(false);
  }, [client, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', status: 'warning', duration: 2000 });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        status,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase.from('clients').update(payload).eq('id', client.id);
        if (error) throw error;

        await supabase.from('activity_log').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'client_updated',
          entity_type: 'client',
          entity_id: client.id,
          metadata: { client_name: name.trim() },
          created_at: new Date().toISOString(),
        });

        toast({ title: 'Client updated', status: 'success', duration: 2000 });
      } else {
        const { data, error } = await supabase.from('clients').insert(payload).select().single();
        if (error) throw error;

        await supabase.from('activity_log').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'client_created',
          entity_type: 'client',
          entity_id: data.id,
          metadata: { client_name: name.trim() },
          created_at: new Date().toISOString(),
        });

        toast({ title: 'Client added', status: 'success', duration: 2000 });
      }
      onSave();
      onClose();
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const { error } = await supabase.from('clients').delete().eq('id', client.id);
      if (error) throw error;

      await supabase.from('activity_log').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'client_deleted',
        entity_type: 'client',
        entity_id: client.id,
        metadata: { client_name: client.name },
        created_at: new Date().toISOString(),
      });

      toast({ title: 'Client removed', status: 'success', duration: 2000 });
      onSave();
      onClose();
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, status: 'error', duration: 3000 });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="surface.900" border="1px solid" borderColor="surface.800" mx={4}>
        <ModalHeader color="white" fontSize="md" pb={2}>
          <HStack spacing={2}>
            <Icon as={isEditing ? TbEdit : TbPlus} color="brand.500" boxSize={5} />
            <Text>{isEditing ? 'Edit Client' : 'Add Client'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.400" />

        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name or business name"
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                h="44px"
                borderRadius="xl"
                _hover={{ borderColor: 'surface.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                _placeholder={{ color: 'surface.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                h="44px"
                borderRadius="xl"
                _hover={{ borderColor: 'surface.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                _placeholder={{ color: 'surface.600' }}
              />
            </FormControl>

            <HStack spacing={3} w="100%">
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Phone</FormLabel>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(970) 555-1234"
                  bg="transparent"
                  border="1px solid"
                  borderColor="surface.700"
                  color="white"
                  fontSize="sm"
                  h="44px"
                  borderRadius="xl"
                  _hover={{ borderColor: 'surface.500' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  _placeholder={{ color: 'surface.600' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Status</FormLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  bg="transparent"
                  border="1px solid"
                  borderColor="surface.700"
                  color="white"
                  fontSize="sm"
                  h="44px"
                  borderRadius="xl"
                >
                  <option value="active" style={{ background: '#0a0a0a' }}>Active</option>
                  <option value="lead" style={{ background: '#0a0a0a' }}>Lead</option>
                  <option value="inactive" style={{ background: '#0a0a0a' }}>Inactive</option>
                </Select>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Company</FormLabel>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company or business name"
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                h="44px"
                borderRadius="xl"
                _hover={{ borderColor: 'surface.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                _placeholder={{ color: 'surface.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Notes</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this client"
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                borderRadius="xl"
                rows={3}
                _hover={{ borderColor: 'surface.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                _placeholder={{ color: 'surface.600' }}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="surface.800" pt={4}>
          <HStack spacing={2} w="100%" justify={isEditing ? 'space-between' : 'flex-end'}>
            {isEditing && (
              <Button
                size="sm"
                variant="ghost"
                color={confirmDelete ? 'red.400' : 'surface.500'}
                leftIcon={confirmDelete ? <TbAlertTriangle /> : <TbTrash />}
                onClick={handleDelete}
                isLoading={deleting}
                loadingText="Removing..."
                _hover={{ color: 'red.400', bg: 'red.900' }}
              >
                {confirmDelete ? 'Confirm Remove' : 'Remove'}
              </Button>
            )}
            <HStack spacing={2}>
              <Button size="sm" variant="ghost" color="surface.400" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                bg="brand.500"
                color="surface.950"
                fontWeight="700"
                _hover={{ bg: 'brand.400' }}
                onClick={handleSave}
                isLoading={saving}
                loadingText="Saving..."
              >
                {isEditing ? 'Save Changes' : 'Add Client'}
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingClient, setEditingClient] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setClients(data || []);
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingClient(null);
    onOpen();
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    onOpen();
  };

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

        {/* Header */}
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <Box>
            <Text fontSize="2xl" fontWeight="700" color="white">Clients</Text>
            <Text color="surface.400" fontSize="sm" mt={0.5}>
              {counts.all} total, {counts.active} active
            </Text>
          </Box>
          <Button
            leftIcon={<TbPlus />}
            size="sm"
            bg="brand.500"
            color="surface.950"
            fontWeight="700"
            borderRadius="lg"
            _hover={{ bg: 'brand.400', transform: 'translateY(-1px)' }}
            onClick={handleAdd}
          >
            Add Client
          </Button>
        </HStack>

        {/* Search and filters */}
        <HStack spacing={3} flexWrap="wrap">
          <Box position="relative" flex={1} minW="200px">
            <Icon
              as={TbSearch}
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              color="surface.600"
              boxSize={4}
              zIndex={1}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search clients"
              pl={9}
              bg="transparent"
              border="1px solid"
              borderColor="surface.700"
              color="white"
              fontSize="sm"
              h="40px"
              borderRadius="lg"
              _hover={{ borderColor: 'surface.500' }}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
              _placeholder={{ color: 'surface.600' }}
            />
          </Box>
          <HStack spacing={1}>
            {['all', 'active', 'lead', 'inactive'].map((s) => (
              <Button
                key={s}
                size="xs"
                variant="ghost"
                color={filterStatus === s ? 'white' : 'surface.500'}
                bg={filterStatus === s ? 'surface.800' : 'transparent'}
                fontWeight="600"
                borderRadius="md"
                onClick={() => setFilterStatus(s)}
                _hover={{ bg: 'surface.850', color: 'white' }}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label} ({counts[s]})
              </Button>
            ))}
          </HStack>
        </HStack>

        {/* Grid */}
        {loading ? (
          <Center py={12}>
            <Spinner size="lg" color="brand.500" thickness="3px" />
          </Center>
        ) : filtered.length === 0 ? (
          <Box
            bg="surface.900"
            border="1px dashed"
            borderColor="surface.700"
            borderRadius="xl"
            p={8}
            textAlign="center"
          >
            <VStack spacing={2}>
              <Icon as={TbUsers} boxSize={8} color="surface.600" />
              <Text color="surface.400" fontSize="sm">
                {clients.length === 0 ? 'No clients yet' : 'No clients match your search'}
              </Text>
              {clients.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="brand.500"
                  color="brand.500"
                  onClick={handleAdd}
                  mt={2}
                >
                  Add your first client
                </Button>
              )}
            </VStack>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={3}>
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEdit}
              />
            ))}
          </SimpleGrid>
        )}
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