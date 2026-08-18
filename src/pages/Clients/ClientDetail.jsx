// path: /clients/:clientId/
//
// The client profile, on Paper. A cream page with the avatar and name up top, a
// row of actions, a tab bar, and seven tabs: Overview, Sprints, Invoices,
// Recurring, Projects, Sites, Messages. The Overview leads with four stat cards
// whose numbers are set in Fraunces, the same marquee serif the invoice uses.
//
// Admin can manage the avatar, the PIN, impersonation and activation. Every color
// resolves from colors.paper. No oxford commas, no dashes.

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Spinner, Center,
  Button, SimpleGrid, Input, Container, useToast, useDisclosure,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TbMail, TbPhone, TbWorld, TbBolt, TbCash, TbPlus, TbFolder,
  TbMessageCircle, TbTrash, TbX, TbEdit,
} from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';
import { formatPhoneDisplay, timeAgo } from '../../utils/phone';
import SitesTab from './components/SitesTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import ClientModal from './components/ClientModal';
import ClientAvatarUpload from '../../components/common/ClientAvatarUpload';
import PortalAccessCard from '../../components/common/PortalAccessCard';
import ImpersonateButton from '../../components/common/ImpersonateButton';
import ActivateClientButton from '../../components/common/ActivateClientButton';

const P = colors.paper;

const TAB_OPTIONS = [
  { value: 'overview', label: 'Overview' },
  { value: 'sprints', label: 'Sprints' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'subscriptions', label: 'Recurring' },
  { value: 'projects', label: 'Projects' },
  { value: 'sites', label: 'Sites' },
  { value: 'messages', label: 'Messages' },
];

const STATUS_COLORS = {
  draft:   P.inkMuted,
  sent:    '#6C6F97',
  viewed:  P.gold,
  partial: P.gold,
  overdue: P.coral,
  paid:    P.green,
};

const currency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
};

const SectionLabel = ({ children }) => (
  <Text fontSize="2xs" fontWeight="600" color={P.inkMuted} textTransform="uppercase" letterSpacing="0.14em" fontFamily="mono">
    {children}
  </Text>
);

// ============================================================
// OVERVIEW TAB
// ============================================================
const OverviewTab = ({ client, stats, activity, onClientUpdate }) => (
  <VStack spacing={8} align="stretch">
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
      {[
        { label: 'Sprints', value: stats.totalSprints, color: P.limeDeep },
        { label: 'Funded', value: currency(stats.totalFunded), color: P.green },
        { label: 'Outstanding', value: currency(stats.outstanding), color: P.gold },
        { label: 'Invoices', value: stats.totalInvoices, color: P.inkSec },
      ].map((stat) => (
        <Box key={stat.label} bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="14px" p={{ base: 4, md: 5 }}>
          <SectionLabel>{stat.label}</SectionLabel>
          <Text fontFamily="display" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="500" color={P.ink} lineHeight="1" mt={2}>
            {stat.value}
          </Text>
          <Box mt={3} h="2px" w="24px" bg={stat.color} borderRadius="full" />
        </Box>
      ))}
    </SimpleGrid>

    <Box pt={5} borderTop="1px solid" borderColor={P.hair}>
      <SectionLabel>Contact</SectionLabel>
      <VStack spacing={3} align="stretch" mt={4}>
        {client.email && (
          <HStack spacing={3}>
            <Icon as={TbMail} boxSize={3.5} color={P.inkMuted} />
            <Text as="a" href={`mailto:${client.email}`} color={P.limeDeep} fontSize="sm" _hover={{ textDecoration: 'underline' }}>{client.email}</Text>
          </HStack>
        )}
        {client.phone && (
          <HStack spacing={3}>
            <Icon as={TbPhone} boxSize={3.5} color={P.inkMuted} />
            <Text as="a" href={`tel:${client.phone}`} color={P.inkSec} fontSize="sm" fontFamily="mono" _hover={{ color: P.limeDeep }}>{formatPhoneDisplay(client.phone)}</Text>
          </HStack>
        )}
        {client.website && (
          <HStack spacing={3}>
            <Icon as={TbWorld} boxSize={3.5} color={P.inkMuted} />
            <Text as="a" href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" color={P.inkSec} fontSize="sm" _hover={{ color: P.limeDeep }}>{client.website}</Text>
          </HStack>
        )}
        {(client.address_line1 || client.city) && (
          <HStack spacing={3} align="start">
            <Icon as={TbFolder} boxSize={3.5} color={P.inkMuted} mt={0.5} style={{ visibility: 'hidden' }} />
            <Text color={P.inkSec} fontSize="sm" lineHeight="1.6">
              {[client.address_line1, client.address_line2].filter(Boolean).join(', ')}
              {(client.address_line1 || client.address_line2) && <br />}
              {[[client.city, client.region].filter(Boolean).join(', '), client.postal_code].filter(Boolean).join(' ')}
            </Text>
          </HStack>
        )}
      </VStack>
    </Box>

    <Box pt={5} borderTop="1px solid" borderColor={P.hair}>
      <PortalAccessCard client={client} onUpdate={onClientUpdate} />
    </Box>

    {client.notes && (
      <Box pt={5} borderTop="1px solid" borderColor={P.hair}>
        <SectionLabel>Notes</SectionLabel>
        <Text color={P.inkSec} fontSize="sm" lineHeight="1.7" whiteSpace="pre-wrap" mt={3}>{client.notes}</Text>
      </Box>
    )}

    {activity.length > 0 && (
      <Box pt={5} borderTop="1px solid" borderColor={P.hair}>
        <SectionLabel>Recent activity</SectionLabel>
        <VStack spacing={3} align="stretch" mt={4}>
          {activity.slice(0, 10).map((a) => (
            <HStack key={a.id} spacing={3} py={1}>
              <Box w="5px" h="5px" borderRadius="full" bg={P.inkFaint} flexShrink={0} />
              <Text color={P.inkSec} fontSize="xs" flex={1}>
                {a.action?.replace(/_/g, ' ')}
                {a.metadata?.note && ` — ${a.metadata.note}`}
              </Text>
              <Text color={P.inkFaint} fontSize="2xs" fontFamily="mono">{timeAgo(a.created_at)}</Text>
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
  if (loading) return <Center py={16}><Spinner color={P.limeDeep} /></Center>;

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
      <HStack spacing={6} borderBottom="1px solid" borderColor={P.hair} pb={3}>
        {[{ value: 'all', label: 'All' }, { value: 'billable', label: 'Billable' }, { value: 'draft', label: 'Draft' }, { value: 'paid', label: 'Paid' }].map((opt) => {
          const active = filter === opt.value;
          return (
            <Box key={opt.value} cursor="pointer" onClick={() => setFilter(opt.value)} position="relative" pb={1}>
              <HStack spacing={1.5}>
                <Text fontSize="xs" fontWeight="700" color={active ? P.ink : P.inkMuted} _hover={!active ? { color: P.inkSec } : {}}>{opt.label}</Text>
                <Text fontSize="2xs" fontFamily="mono" color={active ? P.limeDeep : P.inkFaint} fontWeight="700">{counts[opt.value]}</Text>
              </HStack>
              {active && <Box position="absolute" bottom="-13px" left={0} right={0} h="2px" bg={P.lime} borderRadius="full" />}
            </Box>
          );
        })}
      </HStack>

      {filtered.length === 0 ? (
        <Center py={16}><VStack spacing={2}><Icon as={TbBolt} boxSize={8} color={P.inkFaint} /><Text color={P.inkMuted} fontSize="sm">No sprints in this view</Text></VStack></Center>
      ) : (
        <VStack spacing={0} align="stretch">
          {filtered.map((s) => {
            const isPaid = s.payment_status === 'paid' || s.locked;
            const isDraft = s.is_billable === false;
            const statusColor = isPaid ? P.green : isDraft ? P.inkFaint : P.gold;
            return (
              <HStack key={s.id} py={3.5} spacing={4} borderBottom="1px solid" borderColor={P.hairSoft} role="group" _hover={{ bg: P.sheet }}>
                <Box w="6px" h="6px" borderRadius="full" bg={statusColor} flexShrink={0} />
                <Box flex={1} minW={0}>
                  <HStack spacing={2}>
                    <Text color={P.inkFaint} fontSize="2xs" fontFamily="mono" fontWeight="700">{s.sprint_number || '—'}</Text>
                    {isDraft && <Text fontSize="2xs" fontFamily="mono" color={P.inkFaint} textTransform="uppercase">Draft</Text>}
                  </HStack>
                  <Text color={P.ink} fontSize="sm" fontWeight="600" noOfLines={1}>{s.title}</Text>
                </Box>
                <Text color={isPaid ? P.green : P.ink} fontSize="sm" fontFamily="mono" fontWeight="700" minW="80px" textAlign="right">{currency(s.amount)}</Text>
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
  if (loading) return <Center py={16}><Spinner color={P.limeDeep} /></Center>;

  if (invoices.length === 0) {
    return (
      <Center py={16}>
        <VStack spacing={3}>
          <Icon as={TbCash} boxSize={10} color={P.inkFaint} />
          <Text color={P.inkMuted} fontSize="sm">No invoices yet</Text>
          <Button size="sm" bg={P.lime} color={P.limeInk} fontWeight="700" borderRadius="full" onClick={() => navigate('/invoicing/')} _hover={{ bg: '#D2E26B' }}>Create invoice</Button>
        </VStack>
      </Center>
    );
  }

  return (
    <VStack spacing={0} align="stretch">
      {invoices.map((inv) => {
        const color = STATUS_COLORS[inv.status] || P.inkMuted;
        const outstanding = parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0);
        return (
          <HStack key={inv.id} py={4} spacing={4} borderBottom="1px solid" borderColor={P.hairSoft} cursor="pointer" onClick={() => navigate(`/invoicing/?invoice=${inv.id}`)} transition="all 0.15s" _hover={{ bg: P.sheet, pl: 2 }}>
            <Box w="6px" h="6px" borderRadius="full" bg={color} flexShrink={0} />
            <Box flex={1} minW={0}>
              <HStack spacing={2}>
                <Text color={P.ink} fontSize="sm" fontWeight="700" fontFamily="mono">{inv.invoice_number}</Text>
                <Text fontSize="2xs" fontWeight="700" color={color} textTransform="uppercase" letterSpacing="0.05em">{inv.status}</Text>
              </HStack>
              <Text color={P.inkMuted} fontSize="2xs" fontFamily="mono" mt={0.5}>
                {inv.invoice_items?.length || 0} sprints · sent {inv.sent_at ? timeAgo(inv.sent_at) : '—'}
              </Text>
            </Box>
            <VStack align="end" spacing={0}>
              <Text color={P.ink} fontSize="sm" fontWeight="700" fontFamily="mono">{currency(inv.total)}</Text>
              {outstanding > 0 && <Text color={P.gold} fontSize="2xs" fontFamily="mono">{currency(outstanding)} due</Text>}
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
    const { data } = await supabase.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase.from('projects').insert({ client_id: clientId, name: newName.trim(), status: 'active' }).select().single();
    if (error) { toast({ title: 'Failed to add', description: error.message, status: 'error' }); return; }
    setProjects([data, ...projects]);
    setNewName('');
    setShowAdd(false);
    toast({ title: 'Project added', status: 'success', duration: 1500 });
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) { toast({ title: 'Failed to delete', description: error.message, status: 'error' }); return; }
    setProjects(projects.filter((p) => p.id !== id));
    toast({ title: 'Project removed', status: 'success', duration: 1500 });
  };

  if (loading) return <Center py={16}><Spinner color={P.limeDeep} /></Center>;

  return (
    <VStack spacing={0} align="stretch">
      {projects.length === 0 && !showAdd && (
        <Center py={12}><VStack spacing={3}><Icon as={TbFolder} boxSize={8} color={P.inkFaint} /><Text color={P.inkMuted} fontSize="sm">No projects yet</Text></VStack></Center>
      )}

      {projects.map((p) => (
        <HStack key={p.id} py={3.5} spacing={3} borderBottom="1px solid" borderColor={P.hairSoft} role="group">
          <Icon as={TbFolder} boxSize={3.5} color={P.inkMuted} />
          <Box flex={1}>
            <Text color={P.ink} fontSize="sm" fontWeight="600">{p.name}</Text>
            {p.project_number && <Text color={P.inkFaint} fontSize="2xs" fontFamily="mono">{p.project_number}</Text>}
          </Box>
          <Text fontSize="2xs" color={p.status === 'active' ? P.limeDeep : P.inkFaint} fontFamily="mono" fontWeight="700" textTransform="uppercase">{p.status}</Text>
          <Box as="button" onClick={() => handleDelete(p.id)} opacity={0} transition="opacity 0.15s" _groupHover={{ opacity: 0.5 }} _hover={{ opacity: '1 !important', color: P.coral }} color={P.inkFaint}>
            <Icon as={TbTrash} boxSize={3.5} />
          </Box>
        </HStack>
      ))}

      {showAdd ? (
        <HStack spacing={2} py={3}>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Project name" autoFocus bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="lg" color={P.ink} fontSize="sm" h="42px" px={3}
            _focus={{ borderColor: P.lime, boxShadow: `0 0 0 3px ${P.lime}33` }} _placeholder={{ color: P.inkFaint }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowAdd(false); setNewName(''); } }} />
          <Button size="sm" bg={P.lime} color={P.limeInk} fontWeight="700" borderRadius="full" onClick={handleAdd} _hover={{ bg: '#D2E26B' }}>Add</Button>
          <Box as="button" onClick={() => { setShowAdd(false); setNewName(''); }} color={P.inkMuted} _hover={{ color: P.ink }}><Icon as={TbX} boxSize={4} /></Box>
        </HStack>
      ) : (
        <HStack py={4} spacing={1.5} cursor="pointer" onClick={() => setShowAdd(true)} color={P.limeDeep} _hover={{ color: P.ink }}>
          <Icon as={TbPlus} boxSize={3} />
          <Text fontSize="2xs" fontFamily="mono" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">Add project</Text>
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
    const { data } = await supabase.from('client_messages').select('*').eq('client_id', clientId).order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
    await supabase.from('client_messages').update({ read_by_team: true }).eq('client_id', clientId).eq('sender_type', 'client').eq('read_by_team', false);
  };

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      const { data, error } = await supabase.from('client_messages').insert({
        client_id: clientId, sender_id: user.id, sender_type: 'team',
        sender_name: profile?.display_name || 'NeonBurro', message: reply.trim(),
        read_by_team: true, read_by_client: false,
      }).select().single();
      if (error) throw error;
      setMessages([...messages, data]);
      setReply('');
    } catch (err) {
      toast({ title: 'Failed to send', description: err.message, status: 'error' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Center py={16}><Spinner color={P.limeDeep} /></Center>;

  return (
    <VStack spacing={5} align="stretch">
      {messages.length === 0 ? (
        <Center py={12}><VStack spacing={3}><Icon as={TbMessageCircle} boxSize={8} color={P.inkFaint} /><Text color={P.inkMuted} fontSize="sm">No messages yet</Text></VStack></Center>
      ) : (
        <VStack spacing={4} align="stretch" maxH="500px" overflowY="auto">
          {messages.map((m) => {
            const isTeam = m.sender_type === 'team';
            return (
              <HStack key={m.id} align="start" spacing={3} justify={isTeam ? 'flex-end' : 'flex-start'}>
                <VStack align={isTeam ? 'end' : 'start'} spacing={1} maxW="75%">
                  <Box bg={isTeam ? P.lime : P.sheet} color={isTeam ? P.limeInk : P.ink} border={isTeam ? 'none' : '1px solid'} borderColor={P.hair}
                    borderRadius="2xl" borderTopRightRadius={isTeam ? 'sm' : '2xl'} borderTopLeftRadius={isTeam ? '2xl' : 'sm'} px={4} py={2.5}>
                    <Text fontSize="sm" lineHeight="1.5" whiteSpace="pre-wrap" color={isTeam ? P.limeInk : P.ink}>{m.message}</Text>
                  </Box>
                  <Text color={P.inkFaint} fontSize="2xs" fontFamily="mono">{m.sender_name} · {timeAgo(m.created_at)}</Text>
                </VStack>
              </HStack>
            );
          })}
        </VStack>
      )}

      <Box pt={4} borderTop="1px solid" borderColor={P.hair}>
        <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to client..." bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="lg" color={P.ink} fontSize="sm" h="46px" px={3.5}
          _focus={{ borderColor: P.lime, boxShadow: `0 0 0 3px ${P.lime}33` }} _placeholder={{ color: P.inkFaint }}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend(); } }} />
        <HStack justify="space-between" pt={2}>
          <Text color={P.inkFaint} fontSize="2xs" fontFamily="mono">{'⌘'} + Enter to send</Text>
          <Button size="sm" bg={P.lime} color={P.limeInk} fontWeight="700" borderRadius="full" onClick={handleSend} isLoading={sending} isDisabled={!reply.trim()} _hover={{ bg: '#D2E26B' }}>Send reply</Button>
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
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

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
      supabase.from('invoices').select('*, invoice_items(*)').eq('client_id', clientId).is('cancelled_at', null).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(20),
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
    setSprints(invs.flatMap((inv) => (inv.invoice_items || []).map((item) => ({ ...item, invoice_number: inv.invoice_number, invoice_status: inv.status }))));
    setLoading(false);
  };

  const refetchClient = async () => {
    const { data } = await supabase.from('clients').select('*').eq('id', clientId).maybeSingle();
    if (data) setClient(data);
  };

  const handleAvatarChange = (newUrl) => setClient((prev) => ({ ...prev, avatar_url: newUrl }));
  const handleEditSave = async () => { await refetchClient(); };

  if (loading) {
    return (
      <Box minH="100vh" bg={P.mat}>
        <Center minH="60vh"><Spinner size="lg" color={P.limeDeep} thickness="3px" /></Center>
      </Box>
    );
  }

  if (!client) return null;

  const stats = {
    totalSprints: sprints.length,
    totalFunded: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_paid || 0), 0),
    outstanding: invoices.filter((inv) => ['sent', 'viewed', 'overdue', 'partial'].includes(inv.status)).reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0)), 0),
    totalInvoices: invoices.length,
  };

  const isActivated = !!client.portal_account_created_at;

  return (
    <Box position="relative" minH="100vh" bg={P.mat}>
      <Box position="absolute" top={0} left={0} right={0} h="360px" bg={`radial-gradient(ellipse at top center, ${P.lime}14, transparent 70%)`} pointerEvents="none" />

      <Container maxW="1500px" mx={0} px={{ base: 5, md: 8 }} py={{ base: 6, md: 10 }} position="relative">
        <HStack spacing={5} align="start" mb={8}>
          <ClientAvatarUpload clientId={client.id} clientName={client.name} avatarUrl={client.avatar_url} size={72} onChange={handleAvatarChange} />

          <Box flex={1} pt={1} minW={0}>
            <HStack spacing={3} align="center" mb={1}>
              <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700" color={P.ink} letterSpacing="-0.02em" lineHeight="1.1" noOfLines={2}>{client.name}</Text>
              <Box w="8px" h="8px" borderRadius="full" bg={client.status === 'active' ? P.green : P.inkFaint} flexShrink={0} />
            </HStack>
            {client.company && <Text color={P.inkMuted} fontSize="sm" mb={2}>{client.company}</Text>}
            <HStack spacing={3} flexWrap="wrap" rowGap={1}>
              {client.tags?.map((tag) => (
                <Text key={tag} fontSize="2xs" color={P.inkFaint} fontFamily="mono" textTransform="uppercase" letterSpacing="0.05em">{tag}</Text>
              ))}
            </HStack>
          </Box>

          <HStack spacing={2} flexShrink={0} display={{ base: 'none', md: 'flex' }}>
            <Button size="sm" variant="outline" borderColor={P.hair} color={P.inkSec} borderRadius="full" leftIcon={<TbEdit size={13} />} onClick={onEditOpen} _hover={{ borderColor: P.inkFaint, color: P.ink, bg: P.sheet }}>Edit</Button>
            {!isActivated && <ActivateClientButton client={client} onActivated={refetchClient} />}
            <ImpersonateButton client={client} />
            <Button size="sm" bg={P.lime} color={P.limeInk} fontWeight="700" borderRadius="full" onClick={() => navigate(`/invoicing/?client=${clientId}&new=true`)} _hover={{ bg: '#D2E26B' }}>New invoice</Button>
          </HStack>
        </HStack>

        {/* Mobile actions row */}
        <HStack spacing={2} mb={6} display={{ base: 'flex', md: 'none' }} flexWrap="wrap" rowGap={2}>
          <Button size="sm" variant="outline" borderColor={P.hair} color={P.inkSec} borderRadius="full" leftIcon={<TbEdit size={13} />} onClick={onEditOpen} _hover={{ borderColor: P.inkFaint, color: P.ink, bg: P.sheet }}>Edit</Button>
          {!isActivated && <ActivateClientButton client={client} onActivated={refetchClient} />}
          <ImpersonateButton client={client} />
          <Button size="sm" bg={P.lime} color={P.limeInk} fontWeight="700" borderRadius="full" onClick={() => navigate(`/invoicing/?client=${clientId}&new=true`)} _hover={{ bg: '#D2E26B' }}>New invoice</Button>
        </HStack>

        <HStack spacing={6} borderBottom="1px solid" borderColor={P.hair} mb={8} overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' } }}>
          {TAB_OPTIONS.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <Box key={tab.value} pb={3} cursor="pointer" position="relative" onClick={() => setActiveTab(tab.value)} flexShrink={0}>
                <Text fontSize="xs" fontWeight="700" color={active ? P.ink : P.inkMuted} textTransform="uppercase" letterSpacing="0.05em" _hover={!active ? { color: P.inkSec } : {}}>{tab.label}</Text>
                {active && <Box position="absolute" bottom="-1px" left={0} right={0} h="2px" bg={P.lime} borderRadius="full" />}
              </Box>
            );
          })}
        </HStack>

        <Box>
          {activeTab === 'overview' && <OverviewTab client={client} stats={stats} activity={activity} onClientUpdate={refetchClient} />}
          {activeTab === 'sprints' && <SprintsTab sprints={sprints} loading={false} />}
          {activeTab === 'invoices' && <InvoicesTab invoices={invoices} loading={false} navigate={navigate} />}
          {activeTab === 'subscriptions' && <SubscriptionsTab clientId={clientId} clientName={client.name} />}
          {activeTab === 'projects' && <ProjectsTab clientId={clientId} toast={toast} />}
          {activeTab === 'sites' && <SitesTab clientId={clientId} clientName={client.name} />}
          {activeTab === 'messages' && <MessagesTab clientId={clientId} />}
        </Box>
      </Container>

      <ClientModal isOpen={isEditOpen} onClose={onEditClose} client={client} onSave={handleEditSave} />
    </Box>
  );
};

export default ClientDetail;
