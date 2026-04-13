// src/pages/Clients/ClientDetail.jsx
// path: /clients/:clientId/
//
// Tabs: Overview / Sprints / Invoices / Projects / Sites / Messages
// Admin can click the avatar to upload/replace/remove the client's photo

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Spinner, Center,
  Button, SimpleGrid, Input, useToast,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TbMail, TbPhone, TbWorld,
  TbBolt, TbCash, TbPlus, TbFolder,
  TbMessageCircle, TbTrash, TbX, TbEdit,
} from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { formatPhoneDisplay, timeAgo } from '../../utils/phone';
import SitesTab from './components/SitesTab';
import ClientAvatarUpload from '../../components/common/ClientAvatarUpload';

const TAB_OPTIONS = [
  { value: 'overview', label: 'Overview' },
  { value: 'sprints', label: 'Sprints' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'projects', label: 'Projects' },
  { value: 'sites', label: 'Sites' },
  { value: 'messages', label: 'Messages' },
];

const STATUS_COLORS = {
  draft: '#737373',
  sent: '#00E5E5',
  viewed: '#FFE500',
  partial: '#FFE500',
  overdue: '#FF3366',
  paid: '#39FF14',
};

const currency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
};

// ============================================================
// OVERVIEW TAB
// ============================================================
const OverviewTab = ({ client, stats, activity }) => (
  <VStack spacing={8} align="stretch">
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
      {[
        { label: 'Sprints', value: stats.totalSprints, color: '#00E5E5' },
        { label: 'Funded', value: currency(stats.totalFunded), color: '#39FF14' },
        { label: 'Outstanding', value: currency(stats.outstanding), color: '#FFE500' },
        { label: 'Invoices', value: stats.totalInvoices, color: '#8B5CF6' },
      ].map((stat) => (
        <Box key={stat.label}>
          <Text
            fontSize="2xs"
            fontWeight="700"
            color="surface.600"
            textTransform="uppercase"
            letterSpacing="0.1em"
            fontFamily="mono"
            mb={2}
          >
            {stat.label}
          </Text>
          <Text
            fontSize="2xl"
            fontWeight="800"
            color="white"
            fontFamily="mono"
            letterSpacing="-0.02em"
            lineHeight="1"
          >
            {stat.value}
          </Text>
          <Box mt={3} h="2px" w="24px" bg={stat.color} borderRadius="full" opacity={0.5} />
        </Box>
      ))}
    </SimpleGrid>

    <Box pt={4} borderTop="1px solid" borderColor="surface.900">
      <Text
        fontSize="2xs"
        fontWeight="700"
        color="surface.600"
        textTransform="uppercase"
        letterSpacing="0.1em"
        fontFamily="mono"
        mb={4}
      >
        Contact
      </Text>
      <VStack spacing={3} align="stretch">
        {client.email && (
          <HStack spacing={3}>
            <Icon as={TbMail} boxSize={3.5} color="surface.600" />
            <Text
              as="a"
              href={`mailto:${client.email}`}
              color="brand.500"
              fontSize="sm"
              _hover={{ textDecoration: 'underline' }}
            >
              {client.email}
            </Text>
          </HStack>
        )}
        {client.phone && (
          <HStack spacing={3}>
            <Icon as={TbPhone} boxSize={3.5} color="surface.600" />
            <Text
              as="a"
              href={`tel:${client.phone}`}
              color="surface.300"
              fontSize="sm"
              fontFamily="mono"
              _hover={{ color: 'brand.500' }}
            >
              {formatPhoneDisplay(client.phone)}
            </Text>
          </HStack>
        )}
        {client.website && (
          <HStack spacing={3}>
            <Icon as={TbWorld} boxSize={3.5} color="surface.600" />
            <Text
              as="a"
              href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
              target="_blank"
              color="surface.300"
              fontSize="sm"
              _hover={{ color: 'brand.500' }}
            >
              {client.website}
            </Text>
          </HStack>
        )}
      </VStack>
    </Box>

    {client.notes && (
      <Box pt={4} borderTop="1px solid" borderColor="surface.900">
        <Text
          fontSize="2xs"
          fontWeight="700"
          color="surface.600"
          textTransform="uppercase"
          letterSpacing="0.1em"
          fontFamily="mono"
          mb={3}
        >
          Notes
        </Text>
        <Text color="surface.300" fontSize="sm" lineHeight="1.7" whiteSpace="pre-wrap">
          {client.notes}
        </Text>
      </Box>
    )}

    {activity.length > 0 && (
      <Box pt={4} borderTop="1px solid" borderColor="surface.900">
        <Text
          fontSize="2xs"
          fontWeight="700"
          color="surface.600"
          textTransform="uppercase"
          letterSpacing="0.1em"
          fontFamily="mono"
          mb={4}
        >
          Recent Activity
        </Text>
        <VStack spacing={3} align="stretch">
          {activity.slice(0, 10).map((a) => (
            <HStack key={a.id} spacing={3} py={1}>
              <Box w="5px" h="5px" borderRadius="full" bg="surface.700" flexShrink={0} />
              <Text color="surface.400" fontSize="xs" flex={1}>
                {a.action?.replace(/_/g, ' ')} — {a.metadata?.note || ''}
              </Text>
              <Text color="surface.700" fontSize="2xs" fontFamily="mono">
                {timeAgo(a.created_at)}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    )}
  </VStack>
);

// ============================================================
// SPRINTS TAB
// ============================================================
const SprintsTab = ({ sprints, loading }) => {
  const [filter, setFilter] = useState('all');

  if (loading) return <Center py={16}><Spinner color="brand.500" /></Center>;

  const filtered = sprints.filter((s) => {
    if (filter === 'billable') return s.is_billable !== false && s.payment_status !== 'paid';
    if (filter === 'draft') return s.is_billable === false;
    if (filter === 'paid') return s.payment_status === 'paid' || s.locked;
    return true;
  });

  const counts = {
    all: sprints.length,
    billable: sprints.filter((s) => s.is_billable !== false && s.payment_status !== 'paid').length,
    draft: sprints.filter((s) => s.is_billable === false).length,
    paid: sprints.filter((s) => s.payment_status === 'paid' || s.locked).length,
  };

  return (
    <VStack spacing={5} align="stretch">
      <HStack spacing={5} borderBottom="1px solid" borderColor="surface.900" pb={3}>
        {[
          { value: 'all', label: 'All' },
          { value: 'billable', label: 'Billable' },
          { value: 'draft', label: 'Draft' },
          { value: 'paid', label: 'Paid' },
        ].map((opt) => {
          const active = filter === opt.value;
          return (
            <Box
              key={opt.value}
              cursor="pointer"
              onClick={() => setFilter(opt.value)}
              position="relative"
              pb={1}
            >
              <HStack spacing={1.5}>
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color={active ? 'white' : 'surface.600'}
                  _hover={!active ? { color: 'surface.400' } : {}}
                >
                  {opt.label}
                </Text>
                <Text
                  fontSize="2xs"
                  fontFamily="mono"
                  color={active ? 'brand.500' : 'surface.700'}
                  fontWeight="700"
                >
                  {counts[opt.value]}
                </Text>
              </HStack>
              {active && (
                <Box
                  position="absolute"
                  bottom="-13px"
                  left={0}
                  right={0}
                  h="2px"
                  bg="brand.500"
                  borderRadius="full"
                  boxShadow="0 0 8px rgba(0,229,229,0.6)"
                />
              )}
            </Box>
          );
        })}
      </HStack>

      {filtered.length === 0 ? (
        <Center py={16}>
          <VStack spacing={2}>
            <Icon as={TbBolt} boxSize={8} color="surface.700" />
            <Text color="surface.500" fontSize="sm">No sprints in this view</Text>
          </VStack>
        </Center>
      ) : (
        <VStack spacing={0} align="stretch">
          {filtered.map((s) => {
            const isPaid = s.payment_status === 'paid' || s.locked;
            const isDraft = s.is_billable === false;
            const statusColor = isPaid ? '#39FF14' : isDraft ? '#737373' : '#FFE500';
            return (
              <HStack
                key={s.id}
                py={3}
                spacing={4}
                borderBottom="1px solid"
                borderColor="surface.900"
                role="group"
                _hover={{ bg: 'rgba(255,255,255,0.01)' }}
              >
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg={statusColor}
                  boxShadow={isPaid ? `0 0 6px ${statusColor}` : 'none'}
                  flexShrink={0}
                />
                <Box flex={1} minW={0}>
                  <HStack spacing={2}>
                    <Text color="surface.600" fontSize="2xs" fontFamily="mono" fontWeight="700">
                      {s.sprint_number || '—'}
                    </Text>
                    {isDraft && (
                      <Text fontSize="2xs" fontFamily="mono" color="surface.600" textTransform="uppercase">
                        Draft
                      </Text>
                    )}
                  </HStack>
                  <Text color="white" fontSize="sm" fontWeight="600" noOfLines={1}>
                    {s.title}
                  </Text>
                </Box>
                <Text
                  color={isPaid ? 'accent.neon' : 'white'}
                  fontSize="sm"
                  fontFamily="mono"
                  fontWeight="700"
                  minW="80px"
                  textAlign="right"
                >
                  {currency(s.amount)}
                </Text>
              </HStack>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
};

// ============================================================
// INVOICES TAB
// ============================================================
const InvoicesTab = ({ invoices, loading, navigate }) => {
  if (loading) return <Center py={16}><Spinner color="brand.500" /></Center>;

  if (invoices.length === 0) {
    return (
      <Center py={16}>
        <VStack spacing={3}>
          <Icon as={TbCash} boxSize={10} color="surface.700" />
          <Text color="surface.500" fontSize="sm">No invoices yet</Text>
          <Button
            size="sm"
            variant="outline"
            borderColor="brand.500"
            color="brand.500"
            borderRadius="full"
            onClick={() => navigate('/invoicing/')}
          >
            Create Invoice
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <VStack spacing={0} align="stretch">
      {invoices.map((inv) => {
        const color = STATUS_COLORS[inv.status] || '#737373';
        const outstanding = parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0);
        return (
          <HStack
            key={inv.id}
            py={4}
            spacing={4}
            borderBottom="1px solid"
            borderColor="surface.900"
            cursor="pointer"
            onClick={() => navigate(`/invoicing/?invoice=${inv.id}`)}
            transition="all 0.15s"
            _hover={{ bg: 'rgba(255,255,255,0.01)', pl: 2 }}
          >
            <Box w="6px" h="6px" borderRadius="full" bg={color} flexShrink={0} />
            <Box flex={1} minW={0}>
              <HStack spacing={2}>
                <Text color="white" fontSize="sm" fontWeight="700" fontFamily="mono">
                  {inv.invoice_number}
                </Text>
                <Text
                  fontSize="2xs"
                  fontWeight="700"
                  color={color}
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  {inv.status}
                </Text>
              </HStack>
              <Text color="surface.600" fontSize="2xs" fontFamily="mono" mt={0.5}>
                {inv.invoice_items?.length || 0} sprints · sent {inv.sent_at ? timeAgo(inv.sent_at) : '—'}
              </Text>
            </Box>
            <VStack align="end" spacing={0}>
              <Text color="white" fontSize="sm" fontWeight="700" fontFamily="mono">
                {currency(inv.total)}
              </Text>
              {outstanding > 0 && (
                <Text color="accent.banana" fontSize="2xs" fontFamily="mono">
                  {currency(outstanding)} due
                </Text>
              )}
            </VStack>
          </HStack>
        );
      })}
    </VStack>
  );
};

// ============================================================
// PROJECTS TAB
// ============================================================
const ProjectsTab = ({ clientId, toast }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchProjects(); }, [clientId]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase
      .from('projects')
      .insert({ client_id: clientId, name: newName.trim(), status: 'active' })
      .select()
      .single();
    if (error) {
      toast({ title: 'Failed to add', description: error.message, status: 'error' });
      return;
    }
    setProjects([data, ...projects]);
    setNewName('');
    setShowAdd(false);
    toast({ title: 'Project added', status: 'success', duration: 1500 });
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast({ title: 'Failed to delete', description: error.message, status: 'error' });
      return;
    }
    setProjects(projects.filter((p) => p.id !== id));
    toast({ title: 'Project removed', status: 'success', duration: 1500 });
  };

  if (loading) return <Center py={16}><Spinner color="brand.500" /></Center>;

  return (
    <VStack spacing={0} align="stretch">
      {projects.length === 0 && !showAdd && (
        <Center py={12}>
          <VStack spacing={3}>
            <Icon as={TbFolder} boxSize={8} color="surface.700" />
            <Text color="surface.500" fontSize="sm">No projects yet</Text>
          </VStack>
        </Center>
      )}

      {projects.map((p) => (
        <HStack
          key={p.id}
          py={3}
          spacing={3}
          borderBottom="1px solid"
          borderColor="surface.900"
          role="group"
        >
          <Icon as={TbFolder} boxSize={3.5} color="surface.600" />
          <Box flex={1}>
            <Text color="white" fontSize="sm" fontWeight="600">{p.name}</Text>
            {p.project_number && (
              <Text color="surface.600" fontSize="2xs" fontFamily="mono">{p.project_number}</Text>
            )}
          </Box>
          <Text
            fontSize="2xs"
            color={p.status === 'active' ? 'accent.neon' : 'surface.600'}
            fontFamily="mono"
            fontWeight="700"
            textTransform="uppercase"
          >
            {p.status}
          </Text>
          <Box
            as="button"
            onClick={() => handleDelete(p.id)}
            opacity={0}
            transition="opacity 0.15s"
            _groupHover={{ opacity: 0.5 }}
            _hover={{ opacity: '1 !important', color: 'red.400' }}
            color="surface.600"
          >
            <Icon as={TbTrash} boxSize={3.5} />
          </Box>
        </HStack>
      ))}

      {showAdd ? (
        <HStack spacing={2} py={3}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            autoFocus
            bg="transparent"
            border="none"
            borderBottom="1px solid"
            borderColor="surface.700"
            borderRadius={0}
            color="white"
            fontSize="sm"
            h="36px"
            px={0}
            _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setShowAdd(false); setNewName(''); }
            }}
          />
          <Button size="xs" bg="brand.500" color="surface.950" fontWeight="700" onClick={handleAdd}>
            Add
          </Button>
          <Box
            as="button"
            onClick={() => { setShowAdd(false); setNewName(''); }}
            color="surface.500"
          >
            <Icon as={TbX} boxSize={4} />
          </Box>
        </HStack>
      ) : (
        <HStack
          py={4}
          spacing={1.5}
          cursor="pointer"
          onClick={() => setShowAdd(true)}
          color="brand.500"
          opacity={0.6}
          _hover={{ opacity: 1 }}
        >
          <Icon as={TbPlus} boxSize={3} />
          <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
            Add project
          </Text>
        </HStack>
      )}
    </VStack>
  );
};

// ============================================================
// MESSAGES TAB
// ============================================================
const MessagesTab = ({ clientId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchMessages(); }, [clientId]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('client_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);

    await supabase
      .from('client_messages')
      .update({ read_by_team: true })
      .eq('client_id', clientId)
      .eq('sender_type', 'client')
      .eq('read_by_team', false);
  };

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('client_messages')
        .insert({
          client_id: clientId,
          sender_id: user.id,
          sender_type: 'team',
          sender_name: profile?.display_name || 'NeonBurro',
          message: reply.trim(),
          read_by_team: true,
          read_by_client: false,
        })
        .select()
        .single();

      if (error) throw error;
      setMessages([...messages, data]);
      setReply('');
    } catch (err) {
      toast({ title: 'Failed to send', description: err.message, status: 'error' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Center py={16}><Spinner color="brand.500" /></Center>;

  return (
    <VStack spacing={5} align="stretch">
      {messages.length === 0 ? (
        <Center py={12}>
          <VStack spacing={3}>
            <Icon as={TbMessageCircle} boxSize={8} color="surface.700" />
            <Text color="surface.500" fontSize="sm">No messages yet</Text>
          </VStack>
        </Center>
      ) : (
        <VStack spacing={4} align="stretch" maxH="500px" overflowY="auto">
          {messages.map((m) => {
            const isTeam = m.sender_type === 'team';
            return (
              <HStack key={m.id} align="start" spacing={3} justify={isTeam ? 'flex-end' : 'flex-start'}>
                <VStack align={isTeam ? 'end' : 'start'} spacing={1} maxW="75%">
                  <Box
                    bg={isTeam ? 'brand.500' : 'surface.850'}
                    color={isTeam ? 'surface.950' : 'white'}
                    borderRadius="2xl"
                    borderTopRightRadius={isTeam ? 'sm' : '2xl'}
                    borderTopLeftRadius={isTeam ? '2xl' : 'sm'}
                    px={4}
                    py={2.5}
                  >
                    <Text fontSize="sm" lineHeight="1.5" whiteSpace="pre-wrap">
                      {m.message}
                    </Text>
                  </Box>
                  <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                    {m.sender_name} · {timeAgo(m.created_at)}
                  </Text>
                </VStack>
              </HStack>
            );
          })}
        </VStack>
      )}

      <Box pt={4} borderTop="1px solid" borderColor="surface.900">
        <Input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply to client..."
          bg="transparent"
          border="none"
          borderBottom="1px solid"
          borderColor="surface.800"
          borderRadius={0}
          color="white"
          fontSize="sm"
          h="44px"
          px={0}
          _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
          _placeholder={{ color: 'surface.700' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <HStack justify="space-between" pt={2}>
          <Text color="surface.700" fontSize="2xs" fontFamily="mono">
            ⌘ + Enter to send
          </Text>
          <Button
            size="xs"
            bg="brand.500"
            color="surface.950"
            fontWeight="700"
            onClick={handleSend}
            isLoading={sending}
            isDisabled={!reply.trim()}
          >
            Send Reply
          </Button>
        </HStack>
      </Box>
    </VStack>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [client, setClient] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchData(); }, [clientId]);

  const fetchData = async () => {
    setLoading(true);
    const [clientRes, invoicesRes, activityRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('client_id', clientId)
        .is('cancelled_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('activity_log')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (!clientRes.data) {
      toast({ title: 'Client not found', status: 'error', duration: 2000 });
      navigate('/clients/');
      return;
    }

    setClient(clientRes.data);
    const invs = invoicesRes.data || [];
    setInvoices(invs);
    setActivity(activityRes.data || []);

    const allSprints = invs.flatMap((inv) =>
      (inv.invoice_items || []).map((item) => ({
        ...item,
        invoice_number: inv.invoice_number,
        invoice_status: inv.status,
      }))
    );
    setSprints(allSprints);

    setLoading(false);
  };

  const handleAvatarChange = (newUrl) => {
    // Optimistically update local state - no full refetch needed
    setClient((prev) => ({ ...prev, avatar_url: newUrl }));
  };

  if (loading) {
    return (
      <Box minH="100vh">
        <Center minH="60vh">
          <Spinner size="lg" color="brand.500" thickness="3px" />
        </Center>
      </Box>
    );
  }

  if (!client) return null;

  const stats = {
    totalSprints: sprints.length,
    totalFunded: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_paid || 0), 0),
    outstanding: invoices
      .filter((inv) => ['sent', 'viewed', 'overdue', 'partial'].includes(inv.status))
      .reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0)), 0),
    totalInvoices: invoices.length,
  };

  return (
    <Box position="relative" minH="100%" py={{ base: 6, md: 10 }}>
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="400px"
        bg="radial-gradient(ellipse at top center, rgba(0,229,229,0.025), transparent 70%)"
        pointerEvents="none"
      />

      <Box position="relative">
        <HStack spacing={5} align="start" mb={8}>
          <ClientAvatarUpload
            clientId={client.id}
            clientName={client.name}
            avatarUrl={client.avatar_url}
            size={72}
            onChange={handleAvatarChange}
          />

          <Box flex={1} pt={1}>
            <HStack spacing={3} align="center" mb={1}>
              <Text
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="800"
                color="white"
                letterSpacing="-0.02em"
                lineHeight="1"
              >
                {client.name}
              </Text>
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg={client.status === 'active' ? 'accent.neon' : 'surface.600'}
                boxShadow={client.status === 'active' ? '0 0 8px rgba(57,255,20,0.6)' : 'none'}
              />
            </HStack>
            {client.company && (
              <Text color="surface.500" fontSize="sm" mb={2}>
                {client.company}
              </Text>
            )}
            <HStack spacing={3}>
              {client.tags?.map((tag) => (
                <Text
                  key={tag}
                  fontSize="2xs"
                  color="surface.500"
                  fontFamily="mono"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  {tag}
                </Text>
              ))}
            </HStack>
          </Box>
          <HStack spacing={2}>
            <Button
              size="xs"
              variant="outline"
              borderColor="surface.800"
              color="surface.400"
              borderRadius="lg"
              leftIcon={<TbEdit size={12} />}
              onClick={() => navigate('/clients/')}
              _hover={{ borderColor: 'brand.500', color: 'brand.500' }}
            >
              Edit
            </Button>
            <Button
              size="xs"
              bg="brand.500"
              color="surface.950"
              fontWeight="700"
              borderRadius="lg"
              onClick={() => navigate(`/invoicing/?client=${clientId}&new=true`)}
              _hover={{ bg: 'brand.400' }}
            >
              New Invoice
            </Button>
          </HStack>
        </HStack>

        <HStack spacing={6} borderBottom="1px solid" borderColor="surface.900" mb={8} overflowX="auto">
          {TAB_OPTIONS.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <Box
                key={tab.value}
                pb={3}
                cursor="pointer"
                position="relative"
                onClick={() => setActiveTab(tab.value)}
                flexShrink={0}
              >
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color={active ? 'white' : 'surface.600'}
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  _hover={!active ? { color: 'surface.400' } : {}}
                >
                  {tab.label}
                </Text>
                {active && (
                  <Box
                    position="absolute"
                    bottom="-1px"
                    left={0}
                    right={0}
                    h="2px"
                    bg="brand.500"
                    borderRadius="full"
                    boxShadow="0 0 8px rgba(0,229,229,0.6)"
                  />
                )}
              </Box>
            );
          })}
        </HStack>

        <Box>
          {activeTab === 'overview' && (
            <OverviewTab client={client} stats={stats} activity={activity} />
          )}
          {activeTab === 'sprints' && <SprintsTab sprints={sprints} loading={false} />}
          {activeTab === 'invoices' && (
            <InvoicesTab invoices={invoices} loading={false} navigate={navigate} />
          )}
          {activeTab === 'projects' && <ProjectsTab clientId={clientId} toast={toast} />}
          {activeTab === 'sites' && <SitesTab clientId={clientId} clientName={client.name} />}
          {activeTab === 'messages' && <MessagesTab clientId={clientId} />}
        </Box>
      </Box>
    </Box>
  );
};

export default ClientDetail;
