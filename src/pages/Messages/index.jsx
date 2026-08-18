// src/pages/Messages/index.jsx
// SENTINEL: NB_MESSAGES_V2
//
// Unified client inbox on Paper. Every thread in one screen, newest unanswered
// first, so answering a client never means hunting through Clients for them.
// Threads live in client_messages, a reply can go out signed as the client's
// burro persona. Realtime applies the insert delta rather than refetching.
// No oxford commas, no dashes.

import {
  Box, HStack, VStack, Text, Textarea, Button, Spinner, Center, Icon, Image,
  Badge, Input, Tooltip, useToast, Switch, FormLabel, Container,
} from '@chakra-ui/react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TbSend, TbSearch, TbRobot, TbInbox } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { personaForClient, resolveSender, ASSISTANT_NOTE_ADMIN } from '../../lib/personas';
import Avatar from '../../components/common/Avatar';
import colors from '../../theme/colors';

const P = colors.paper;

const timeAgo = (d) => {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ThreadRow = ({ thread, active, onClick }) => {
  const persona = personaForClient(thread.client_id);
  return (
    <Box as="button" onClick={onClick} w="100%" textAlign="left" px={4} py={3}
      borderLeft="2px solid" borderColor={active ? P.lime : 'transparent'}
      bg={active ? P.sunken : 'transparent'} transition="background 0.15s ease, border-color 0.15s ease"
      _hover={{ bg: P.sunken }} aria-current={active ? 'true' : undefined}>
      <HStack spacing={3} align="start">
        <Avatar name={thread.client_name} url={thread.client_avatar} size="sm" />
        <Box flex={1} minW={0}>
          <HStack justify="space-between" spacing={2} mb={0.5}>
            <Text fontSize="sm" fontWeight={thread.unread > 0 ? '600' : '500'} color={thread.unread > 0 ? P.ink : P.inkSec} noOfLines={1}>{thread.client_name}</Text>
            <Text fontFamily="mono" fontSize="2xs" color={P.inkMuted} flexShrink={0}>{timeAgo(thread.last_at)}</Text>
          </HStack>
          <Text fontSize="xs" color={P.inkMuted} noOfLines={1}>{thread.last_from === 'team' ? 'You: ' : ''}{thread.last_message}</Text>
          <HStack spacing={2} mt={1.5}>
            <Image src={persona.avatar} alt="" w="12px" h="12px" borderRadius="full" opacity={0.7} />
            <Text fontFamily="mono" fontSize="9px" letterSpacing="0.12em" textTransform="uppercase" color={P.inkFaint}>{persona.name}</Text>
            {thread.unread > 0 && <Badge ml="auto" bg={P.lime} color={P.limeInk} borderRadius="full" fontSize="9px" px={1.5} minW="16px" textAlign="center">{thread.unread}</Badge>}
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
};

const Bubble = ({ message, client }) => {
  const isTeam = message.sender_type === 'team';
  const sender = resolveSender({ message, client });
  return (
    <HStack align="start" spacing={3} justify={isTeam ? 'flex-end' : 'flex-start'} w="100%">
      {!isTeam && <Avatar name={sender.name} url={sender.avatarUrl} size="sm" />}
      <VStack align={isTeam ? 'end' : 'start'} spacing={1} maxW="72%">
        <Box bg={isTeam ? P.lime : P.sheet} color={isTeam ? P.limeInk : P.ink} border={isTeam ? 'none' : '1px solid'} borderColor={P.hair}
          borderRadius="2xl" borderTopRightRadius={isTeam ? 'sm' : '2xl'} borderTopLeftRadius={isTeam ? '2xl' : 'sm'} px={4} py={2.5}>
          <Text fontSize="sm" lineHeight="1.55" whiteSpace="pre-wrap" color={isTeam ? P.limeInk : P.ink}>{message.message}</Text>
        </Box>
        <HStack spacing={2} px={1}>
          {sender.kind === 'persona' && <Image src={sender.avatarUrl} alt="" w="12px" h="12px" borderRadius="full" />}
          <Text fontFamily="mono" fontSize="2xs" color={P.inkFaint}>{sender.name} · {timeAgo(message.created_at)}</Text>
          {isTeam && !message.read_by_client && <Text fontFamily="mono" fontSize="2xs" color={P.inkFaint}>unread</Text>}
        </HStack>
      </VStack>
      {isTeam && sender.kind === 'persona' && <Image src={sender.avatarUrl} alt={sender.name} w="32px" h="32px" borderRadius="full" border="1px solid" borderColor={P.hair} flexShrink={0} />}
      {isTeam && sender.kind !== 'persona' && <Avatar name={sender.name} size="sm" />}
    </HStack>
  );
};

const Messages = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [q, setQ] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [asPersona, setAsPersona] = useState(true);

  const endRef = useRef(null);
  const draftsRef = useRef({});

  const load = useCallback(async () => {
    const [msgRes, cliRes] = await Promise.all([
      supabase.from('client_messages').select('*').order('created_at', { ascending: true }),
      supabase.from('clients').select('id, name, email, avatar_url'),
    ]);
    if (msgRes.error || cliRes.error) {
      setError(msgRes.error?.message || cliRes.error?.message);
      setLoading(false);
      return;
    }
    setRows(msgRes.data || []);
    setClients(Object.fromEntries((cliRes.data || []).map((c) => [c.id, c])));
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => { await load(); if (!alive) return; })();
    const ch = supabase.channel('client_messages_inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'client_messages' },
        (payload) => setRows((prev) => (prev.some((r) => r.id === payload.new.id) ? prev : [...prev, payload.new])))
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [load]);

  const threads = useMemo(() => {
    const byClient = new Map();
    rows.forEach((m) => {
      const list = byClient.get(m.client_id) || [];
      list.push(m);
      byClient.set(m.client_id, list);
    });
    return Array.from(byClient.entries())
      .map(([client_id, list]) => {
        const last = list[list.length - 1];
        return {
          client_id,
          client_name: clients[client_id]?.name || 'Unknown client',
          client_avatar: clients[client_id]?.avatar_url || null,
          messages: list,
          last_at: last.created_at,
          last_message: last.message,
          last_from: last.sender_type,
          unread: list.filter((m) => m.sender_type === 'client' && !m.read_by_team).length,
        };
      })
      .sort((a, b) => {
        if ((b.unread > 0) !== (a.unread > 0)) return b.unread - a.unread;
        return new Date(b.last_at) - new Date(a.last_at);
      });
  }, [rows, clients]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return threads;
    return threads.filter((t) => t.client_name.toLowerCase().includes(needle) || t.messages.some((m) => (m.message || '').toLowerCase().includes(needle)));
  }, [threads, q]);

  const active = filtered.find((t) => t.client_id === activeId) || threads.find((t) => t.client_id === activeId) || filtered[0] || null;
  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  useEffect(() => {
    if (!active || active.unread === 0) return;
    const ids = active.messages.filter((m) => m.sender_type === 'client' && !m.read_by_team).map((m) => m.id);
    if (!ids.length) return;
    setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, read_by_team: true } : r)));
    supabase.from('client_messages').update({ read_by_team: true }).in('id', ids)
      .then(({ error: e }) => {
        if (e) {
          setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, read_by_team: false } : r)));
          toast({ title: 'Could not mark as read', description: e.message, status: 'error', duration: 4000 });
        }
      });
  }, [active?.client_id, active?.unread]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [active?.messages.length]);

  const selectThread = (id) => {
    if (active) draftsRef.current[active.client_id] = reply;
    setActiveId(id);
    setReply(draftsRef.current[id] || '');
  };

  const send = async () => {
    const body = reply.trim();
    if (!body || !active) return;
    setSending(true);
    const persona = personaForClient(active.client_id);
    try {
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      const payload = {
        client_id: active.client_id, sender_id: user.id, sender_type: 'team',
        sender_name: asPersona ? persona.name : (profile?.display_name || 'Neon Burro'),
        persona_id: asPersona ? persona.id : null, message: body, read_by_team: true, read_by_client: false,
      };
      const { data, error: e } = await supabase.from('client_messages').insert(payload).select().single();
      if (e) throw e;
      setRows((prev) => [...prev, data]);
      setReply('');
      draftsRef.current[active.client_id] = '';
    } catch (err) {
      toast({ title: 'Failed to send', description: err.message, status: 'error' });
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } };

  if (loading) return <Box minH="100vh" bg={P.mat}><Center py={24}><Spinner color={P.limeDeep} thickness="3px" /></Center></Box>;

  if (error) {
    return (
      <Box minH="100vh" bg={P.mat}>
        <Center py={24}>
          <VStack spacing={4}>
            <Text color={P.inkSec}>Could not load messages.</Text>
            <Text fontFamily="mono" fontSize="xs" color={P.inkMuted}>{error}</Text>
            <Button size="sm" variant="outline" borderColor={P.hair} color={P.inkSec} borderRadius="full" onClick={() => { setLoading(true); load(); }} _hover={{ borderColor: P.inkFaint, color: P.ink, bg: P.sheet }}>Retry</Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  const activePersona = active ? personaForClient(active.client_id) : null;

  return (
    <Box position="relative" minH="100vh" bg={P.mat}>
      <Box position="absolute" top={0} left={0} right={0} h="260px" bg={`radial-gradient(ellipse at top center, ${P.lime}10, transparent 70%)`} pointerEvents="none" />

      <Container maxW="1500px" mx={0} px={{ base: 5, md: 8 }} py={{ base: 6, md: 10 }} position="relative">
        <HStack justify="space-between" align="end" mb={6} flexWrap="wrap" rowGap={3}>
          <Box>
            <HStack spacing={3} align="center">
              <Text fontSize="2xl" fontWeight="600" letterSpacing="-0.02em" color={P.ink}>Messages</Text>
              {totalUnread > 0 && <Badge bg={P.lime} color={P.limeInk} borderRadius="full" px={2} fontSize="10px">{totalUnread} unread</Badge>}
            </HStack>
            <Text fontFamily="mono" fontSize="10px" letterSpacing="0.16em" textTransform="uppercase" color={P.inkMuted} mt={1}>{threads.length} {threads.length === 1 ? 'thread' : 'threads'}</Text>
          </Box>

          <HStack spacing={2}>
            <Icon as={TbRobot} boxSize={4} color={asPersona ? P.limeDeep : P.inkFaint} />
            <FormLabel htmlFor="as-persona" m={0} fontSize="xs" color={P.inkSec} cursor="pointer">Reply as burro</FormLabel>
            <Switch id="as-persona" size="sm" isChecked={asPersona} onChange={(e) => setAsPersona(e.target.checked)} colorScheme="brand" />
          </HStack>
        </HStack>

        <HStack spacing={3} align="start" mb={6} p={3.5} border="1px solid" borderColor={P.hair} bg={P.sheet} borderRadius="12px">
          <Icon as={TbRobot} boxSize={4} color={P.limeDeep} mt={0.5} flexShrink={0} />
          <Text fontSize="xs" color={P.inkSec} lineHeight="1.65">{ASSISTANT_NOTE_ADMIN}</Text>
        </HStack>

        {threads.length === 0 ? (
          <Center py={20}><VStack spacing={3}><Icon as={TbInbox} boxSize={8} color={P.inkFaint} /><Text color={P.inkMuted} fontSize="sm">No client messages yet</Text></VStack></Center>
        ) : (
          <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: '320px minmax(0, 1fr)' }} gap={0} border="1px solid" borderColor={P.hair} borderRadius="16px" overflow="hidden" minH="620px">
            <Box borderRight={{ lg: '1px solid' }} borderColor={P.hair} bg={P.sheet} display={{ base: active ? 'none' : 'block', lg: 'block' }}>
              <Box p={3} borderBottom="1px solid" borderColor={P.hair}>
                <HStack spacing={2} px={3} py={2} bg={P.mat} borderRadius="lg">
                  <Icon as={TbSearch} boxSize={3.5} color={P.inkMuted} />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients and messages" aria-label="Search messages" variant="unstyled" fontSize="sm" color={P.ink} _placeholder={{ color: P.inkFaint }} />
                </HStack>
              </Box>
              <Box maxH="560px" overflowY="auto">
                {filtered.map((t) => <ThreadRow key={t.client_id} thread={t} active={active?.client_id === t.client_id} onClick={() => selectThread(t.client_id)} />)}
                {filtered.length === 0 && <Text px={4} py={6} fontSize="sm" color={P.inkMuted}>No threads match "{q}".</Text>}
              </Box>
            </Box>

            {active && (
              <Box display="flex" flexDirection="column" bg={P.mat}>
                <HStack px={5} py={3.5} borderBottom="1px solid" borderColor={P.hair} justify="space-between" spacing={3} bg={P.sheet}>
                  <HStack spacing={3} minW={0}>
                    <Avatar name={active.client_name} url={active.client_avatar} size="sm" />
                    <Box minW={0}>
                      <Text fontSize="sm" fontWeight="600" color={P.ink} noOfLines={1}>{active.client_name}</Text>
                      <Text fontFamily="mono" fontSize="2xs" color={P.inkMuted} noOfLines={1}>{clients[active.client_id]?.email}</Text>
                    </Box>
                  </HStack>
                  <Tooltip label={`${activePersona.name} — ${activePersona.lane}`} placement="bottom-end" bg={P.ink} color={P.sheet} fontSize="xs" hasArrow>
                    <HStack spacing={2} flexShrink={0}>
                      <Image src={activePersona.avatar} alt={activePersona.name} w="24px" h="24px" borderRadius="full" border="1px solid" borderColor={P.hair} />
                      <Text fontFamily="mono" fontSize="9px" letterSpacing="0.14em" textTransform="uppercase" color={P.inkMuted} display={{ base: 'none', md: 'block' }}>{activePersona.name}</Text>
                    </HStack>
                  </Tooltip>
                </HStack>

                <VStack flex={1} spacing={4} align="stretch" p={5} maxH="420px" overflowY="auto">
                  {active.messages.map((m) => <Bubble key={m.id} message={m} client={clients[active.client_id]} />)}
                  <div ref={endRef} />
                </VStack>

                <Box p={4} borderTop="1px solid" borderColor={P.hair} bg={P.sheet}>
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={onKeyDown} rows={3} resize="none"
                    placeholder={`Reply to ${active.client_name}...`} aria-label={`Reply to ${active.client_name}`}
                    bg={P.mat} border="1px solid" borderColor={P.hair} borderRadius="lg" fontSize="sm" color={P.ink}
                    _placeholder={{ color: P.inkFaint }} _focus={{ borderColor: P.lime, boxShadow: `0 0 0 3px ${P.lime}33` }} />
                  <HStack justify="space-between" mt={3}>
                    <Text fontFamily="mono" fontSize="9px" letterSpacing="0.12em" textTransform="uppercase" color={P.inkFaint}>sending as {asPersona ? activePersona.name : 'yourself'} · ⌘↵ to send</Text>
                    <Button size="sm" onClick={send} isLoading={sending} isDisabled={!reply.trim()} bg={P.lime} color={P.limeInk} fontWeight="700" borderRadius="full" leftIcon={<Icon as={TbSend} boxSize={3.5} />} _hover={{ bg: '#D2E26B' }}>Send</Button>
                  </HStack>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Messages;
