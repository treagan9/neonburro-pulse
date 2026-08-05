// src/pages/Messages/index.jsx
// SENTINEL: NB_MESSAGES_V1
//
// Unified client inbox. Until now the only way to answer a client was to
// remember they had written, open Clients, find them, open their detail page and
// click the Messages tab. Nothing surfaced an unread count anywhere. This is the
// one screen that shows every thread, newest unanswered first.
//
// Threads live in `client_messages`, which already carries everything needed:
// client_id, sender_type, sender_name, message, read_by_team, read_by_client.
// The only addition is the optional `persona_id` column (see the migration) that
// lets a reply go out signed as the client's burro.

import {
  Box, HStack, VStack, Text, Textarea, Button, Spinner, Center, Icon, Image,
  Badge, Input, Tooltip, useToast, Switch, FormLabel,
} from '@chakra-ui/react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TbMessageCircle, TbSend, TbSearch, TbRobot, TbInbox } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { personaForClient, resolveSender, ASSISTANT_NOTE_ADMIN } from '../../lib/personas';
import Avatar from '../../components/common/Avatar';
import colors from '../../theme/colors';

const ACCENT = colors.accent.signal;

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

// ── thread row ────────────────────────────────────────────────────────────────
const ThreadRow = ({ thread, active, onClick }) => {
  const persona = personaForClient(thread.client_id);
  return (
    <Box as="button" onClick={onClick} w="100%" textAlign="left" px={4} py={3}
      borderLeft="2px solid" borderColor={active ? ACCENT : 'transparent'}
      bg={active ? 'surface.850' : 'transparent'}
      transition="background 0.15s ease, border-color 0.15s ease"
      _hover={{ bg: 'surface.850' }}
      aria-current={active ? 'true' : undefined}>
      <HStack spacing={3} align="start">
        <Avatar name={thread.client_name} url={thread.client_avatar} size="sm" />
        <Box flex={1} minW={0}>
          <HStack justify="space-between" spacing={2} mb={0.5}>
            <Text fontSize="sm" fontWeight={thread.unread > 0 ? '600' : '500'}
              color={thread.unread > 0 ? 'text.primary' : 'text.secondary'} noOfLines={1}>
              {thread.client_name}
            </Text>
            <Text fontFamily="mono" fontSize="2xs" color="surface.500" flexShrink={0}>
              {timeAgo(thread.last_at)}
            </Text>
          </HStack>
          <Text fontSize="xs" color="surface.500" noOfLines={1}>
            {thread.last_from === 'team' ? 'You: ' : ''}{thread.last_message}
          </Text>
          <HStack spacing={2} mt={1.5}>
            <Image src={persona.avatar} alt="" w="12px" h="12px" borderRadius="full" opacity={0.55} />
            <Text fontFamily="mono" fontSize="9px" letterSpacing="0.12em"
              textTransform="uppercase" color="surface.600">
              {persona.name}
            </Text>
            {thread.unread > 0 && (
              <Badge ml="auto" bg={ACCENT} color="surface.950" borderRadius="full"
                fontSize="9px" px={1.5} minW="16px" textAlign="center">
                {thread.unread}
              </Badge>
            )}
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
};

// ── bubble ────────────────────────────────────────────────────────────────────
const Bubble = ({ message, client }) => {
  const isTeam = message.sender_type === 'team';
  const sender = resolveSender({ message, client });
  return (
    <HStack align="start" spacing={3} justify={isTeam ? 'flex-end' : 'flex-start'} w="100%">
      {!isTeam && <Avatar name={sender.name} url={sender.avatarUrl} size="sm" />}
      <VStack align={isTeam ? 'end' : 'start'} spacing={1} maxW="72%">
        <Box bg={isTeam ? 'brand.500' : 'surface.850'}
          color={isTeam ? 'surface.950' : 'text.primary'}
          borderRadius="2xl"
          borderTopRightRadius={isTeam ? 'sm' : '2xl'}
          borderTopLeftRadius={isTeam ? '2xl' : 'sm'}
          px={4} py={2.5}>
          <Text fontSize="sm" lineHeight="1.55" whiteSpace="pre-wrap">{message.message}</Text>
        </Box>
        <HStack spacing={2} px={1}>
          {sender.kind === 'persona' && (
            <Image src={sender.avatarUrl} alt="" w="12px" h="12px" borderRadius="full" />
          )}
          <Text fontFamily="mono" fontSize="2xs" color="surface.600">
            {sender.name} · {timeAgo(message.created_at)}
          </Text>
          {isTeam && !message.read_by_client && (
            <Text fontFamily="mono" fontSize="2xs" color="surface.700">unread</Text>
          )}
        </HStack>
      </VStack>
      {isTeam && sender.kind === 'persona' && (
        <Image src={sender.avatarUrl} alt={sender.name} w="32px" h="32px" borderRadius="full"
          border="1px solid" borderColor="surface.800" flexShrink={0} />
      )}
      {isTeam && sender.kind !== 'persona' && <Avatar name={sender.name} size="sm" />}
    </HStack>
  );
};

// ── page ──────────────────────────────────────────────────────────────────────
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

    const ch = supabase
      .channel('client_messages_inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'client_messages' },
        (payload) => {
          // apply the delta, do not refetch the table
          setRows((prev) => (prev.some((r) => r.id === payload.new.id) ? prev : [...prev, payload.new]));
        })
      .subscribe();

    return () => { alive = false; supabase.removeChannel(ch); };
  }, [load]);

  // group into threads
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
    return threads.filter((t) =>
      t.client_name.toLowerCase().includes(needle) ||
      t.messages.some((m) => (m.message || '').toLowerCase().includes(needle)));
  }, [threads, q]);

  const active = filtered.find((t) => t.client_id === activeId)
    || threads.find((t) => t.client_id === activeId)
    || filtered[0]
    || null;

  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  // mark read on open
  useEffect(() => {
    if (!active || active.unread === 0) return;
    const ids = active.messages
      .filter((m) => m.sender_type === 'client' && !m.read_by_team)
      .map((m) => m.id);
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

  // per thread drafts, so switching threads never eats what you typed
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
      const { data: profile } = await supabase
        .from('profiles').select('display_name').eq('id', user.id).single();

      const payload = {
        client_id: active.client_id,
        sender_id: user.id,
        sender_type: 'team',
        sender_name: asPersona ? persona.name : (profile?.display_name || 'Neon Burro'),
        persona_id: asPersona ? persona.id : null,
        message: body,
        read_by_team: true,
        read_by_client: false,
      };

      const { data, error: e } = await supabase
        .from('client_messages').insert(payload).select().single();
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

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
  };

  if (loading) return <Center py={24}><Spinner color="brand.500" thickness="3px" /></Center>;

  if (error) {
    return (
      <Center py={24}>
        <VStack spacing={4}>
          <Text color="text.secondary">Couldn’t load messages.</Text>
          <Text fontFamily="mono" fontSize="xs" color="surface.500">{error}</Text>
          <Button size="sm" variant="outline" onClick={() => { setLoading(true); load(); }}>Retry</Button>
        </VStack>
      </Center>
    );
  }

  const activePersona = active ? personaForClient(active.client_id) : null;

  return (
    <Box>
      {/* header */}
      <HStack justify="space-between" align="end" mb={6} flexWrap="wrap" rowGap={3}>
        <Box>
          <HStack spacing={3} align="center">
            <Text fontSize="2xl" fontWeight="600" letterSpacing="-0.02em" color="text.primary">
              Messages
            </Text>
            {totalUnread > 0 && (
              <Badge bg={ACCENT} color="surface.950" borderRadius="full" px={2} fontSize="10px">
                {totalUnread} unread
              </Badge>
            )}
          </HStack>
          <Text fontFamily="mono" fontSize="10px" letterSpacing="0.16em" textTransform="uppercase"
            color="surface.500" mt={1}>
            {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
          </Text>
        </Box>

        <HStack spacing={4}>
          <HStack spacing={2}>
            <Icon as={TbRobot} boxSize={4} color={asPersona ? ACCENT : 'surface.600'} />
            <FormLabel htmlFor="as-persona" m={0} fontSize="xs" color="text.secondary" cursor="pointer">
              Reply as burro
            </FormLabel>
            <Switch id="as-persona" size="sm" isChecked={asPersona}
              onChange={(e) => setAsPersona(e.target.checked)} colorScheme="brand" />
          </HStack>
        </HStack>
      </HStack>

      {/* helper note */}
      <HStack spacing={3} align="start" mb={6} p={3.5} border="1px solid"
        borderColor="surface.800" bg="surface.900" borderRadius="md">
        <Icon as={TbRobot} boxSize={4} color={ACCENT} mt={0.5} flexShrink={0} />
        <Text fontSize="xs" color="surface.400" lineHeight="1.65">{ASSISTANT_NOTE_ADMIN}</Text>
      </HStack>

      {threads.length === 0 ? (
        <Center py={20}>
          <VStack spacing={3}>
            <Icon as={TbInbox} boxSize={8} color="surface.700" />
            <Text color="surface.500" fontSize="sm">No client messages yet</Text>
          </VStack>
        </Center>
      ) : (
        <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: '320px minmax(0, 1fr)' }}
          gap={0} border="1px solid" borderColor="surface.800" borderRadius="lg" overflow="hidden"
          minH="620px">

          {/* thread list */}
          <Box borderRight={{ lg: '1px solid' }} borderColor="surface.800" bg="surface.900"
            display={{ base: active ? 'none' : 'block', lg: 'block' }}>
            <Box p={3} borderBottom="1px solid" borderColor="surface.800">
              <HStack spacing={2} px={3} py={2} bg="surface.950" borderRadius="md">
                <Icon as={TbSearch} boxSize={3.5} color="surface.600" />
                <Input value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Search clients and messages" aria-label="Search messages"
                  variant="unstyled" fontSize="sm" color="text.primary"
                  _placeholder={{ color: 'surface.600' }} />
              </HStack>
            </Box>
            <Box maxH="560px" overflowY="auto">
              {filtered.map((t) => (
                <ThreadRow key={t.client_id} thread={t}
                  active={active?.client_id === t.client_id}
                  onClick={() => selectThread(t.client_id)} />
              ))}
              {filtered.length === 0 && (
                <Text px={4} py={6} fontSize="sm" color="surface.600">No threads match “{q}”.</Text>
              )}
            </Box>
          </Box>

          {/* conversation */}
          {active && (
            <Box display="flex" flexDirection="column" bg="surface.950">
              <HStack px={5} py={3.5} borderBottom="1px solid" borderColor="surface.800"
                justify="space-between" spacing={3}>
                <HStack spacing={3} minW={0}>
                  <Avatar name={active.client_name} url={active.client_avatar} size="sm" />
                  <Box minW={0}>
                    <Text fontSize="sm" fontWeight="600" color="text.primary" noOfLines={1}>
                      {active.client_name}
                    </Text>
                    <Text fontFamily="mono" fontSize="2xs" color="surface.500" noOfLines={1}>
                      {clients[active.client_id]?.email}
                    </Text>
                  </Box>
                </HStack>
                <Tooltip label={`${activePersona.name} — ${activePersona.lane}`} placement="bottom-end"
                  bg="surface.850" color="text.secondary" fontSize="xs" hasArrow>
                  <HStack spacing={2} flexShrink={0}>
                    <Image src={activePersona.avatar} alt={activePersona.name}
                      w="24px" h="24px" borderRadius="full" border="1px solid" borderColor="surface.800" />
                    <Text fontFamily="mono" fontSize="9px" letterSpacing="0.14em"
                      textTransform="uppercase" color="surface.500"
                      display={{ base: 'none', md: 'block' }}>
                      {activePersona.name}
                    </Text>
                  </HStack>
                </Tooltip>
              </HStack>

              <VStack flex={1} spacing={4} align="stretch" p={5} maxH="420px" overflowY="auto">
                {active.messages.map((m) => (
                  <Bubble key={m.id} message={m} client={clients[active.client_id]} />
                ))}
                <div ref={endRef} />
              </VStack>

              <Box p={4} borderTop="1px solid" borderColor="surface.800">
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyDown={onKeyDown} rows={3} resize="none"
                  placeholder={`Reply to ${active.client_name}…`}
                  aria-label={`Reply to ${active.client_name}`}
                  bg="surface.900" border="1px solid" borderColor="surface.800"
                  borderRadius="md" fontSize="sm" color="text.primary"
                  _placeholder={{ color: 'surface.600' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }} />
                <HStack justify="space-between" mt={3}>
                  <Text fontFamily="mono" fontSize="9px" letterSpacing="0.12em"
                    textTransform="uppercase" color="surface.600">
                    sending as {asPersona ? activePersona.name : 'yourself'} · ⌘↵ to send
                  </Text>
                  <Button size="sm" onClick={send} isLoading={sending} isDisabled={!reply.trim()}
                    leftIcon={<Icon as={TbSend} boxSize={3.5} />}>
                    Send
                  </Button>
                </HStack>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Messages;
