// src/pages/Forms/index.jsx
// Unified Forms Inbox — all submission types in one place
// Desktop: split-pane (list left ~420px, detail right flex)
// Mobile: list only, tap opens full-screen sheet for detail
//
// Schema match: form_submissions has top-level columns (name, email, phone, company,
// message) + metadata JSONB. NO "data" column. reply_count + last_replied_at track
// reply history; form_replies table stores each reply's full body.

import { useState, useEffect, useMemo } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Input, Center, Spinner,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
  Textarea, Button, useToast, Divider, IconButton, Tooltip,
} from '@chakra-ui/react';
import {
  TbInbox, TbSearch, TbArchive, TbArchiveOff,
  TbSend, TbArrowLeft, TbCircleCheck, TbCircleDashed,
  TbHistory,
} from 'react-icons/tb';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const FORM_TYPE_LABELS = {
  contact:            'Contact',
  application:        'Application',
  collective_request: 'Collective',
  hosting:            'Hosting',
  nomination:         'Nomination',
  project_brief:      'Project Brief',
  wild_request:       'Wild Request',
};

const FORM_TYPE_COLORS = {
  contact:            '#00E5E5',
  application:        '#8B5CF6',
  collective_request: '#EC4899',
  hosting:            '#06B6D4',
  nomination:         '#FFE500',
  project_brief:      '#39FF14',
  wild_request:       '#FF6B35',
};

const STATUS_FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'unread',    label: 'Unread' },
  { key: 'responded', label: 'Responded' },
  { key: 'archived',  label: 'Archived' },
];

// ============================================================
// Helpers — pull display values from submission + metadata
// ============================================================
const getSenderName = (s) =>
  s.name || s.metadata?.name || s.metadata?.full_name || s.metadata?.contact_name || 'Anonymous';

const getSenderEmail = (s) =>
  s.email || s.metadata?.email || s.metadata?.contact_email || null;

const getPreviewMessage = (s) =>
  s.message ||
  s.metadata?.message ||
  s.metadata?.description ||
  s.metadata?.brief ||
  s.metadata?.request ||
  s.metadata?.notes ||
  '';

// ============================================================
// MAIN
// ============================================================
const Forms = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [submissions, setSubmissions] = useState([]);
  const [replies, setReplies] = useState({}); // { submission_id: [replies] }
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);

  useEffect(() => {
    fetchAll();

    const submissionsChannel = supabase
      .channel('form_submissions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'form_submissions' },
        () => fetchAll()
      )
      .subscribe();

    const repliesChannel = supabase
      .channel('form_replies_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'form_replies' },
        () => fetchReplies()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(repliesChannel);
    };
  }, []);

  const fetchAll = async () => {
    const [subsRes, repsRes] = await Promise.all([
      supabase
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('form_replies')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (subsRes.data) setSubmissions(subsRes.data);
    if (repsRes.data) {
      const grouped = {};
      repsRes.data.forEach((r) => {
        if (!grouped[r.submission_id]) grouped[r.submission_id] = [];
        grouped[r.submission_id].push(r);
      });
      setReplies(grouped);
    }
    setLoading(false);
  };

  const fetchReplies = async () => {
    const { data } = await supabase
      .from('form_replies')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      const grouped = {};
      data.forEach((r) => {
        if (!grouped[r.submission_id]) grouped[r.submission_id] = [];
        grouped[r.submission_id].push(r);
      });
      setReplies(grouped);
    }
  };

  // Filtered + searched list
  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (statusFilter === 'unread'    && s.status !== 'unread')        return false;
      if (statusFilter === 'responded' && s.status !== 'responded')     return false;
      if (statusFilter === 'archived'  && !s.archived_at)               return false;
      if (statusFilter === 'all'       && s.archived_at)                return false;

      if (typeFilter && s.form_type !== typeFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          s.name, s.email, s.message, s.phone, s.company,
          s.metadata?.name, s.metadata?.email, s.metadata?.message,
          s.metadata?.description, s.metadata?.brief,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [submissions, statusFilter, typeFilter, search]);

  const selected = useMemo(
    () => submissions.find((s) => s.id === selectedId) || null,
    [submissions, selectedId]
  );

  const selectedReplies = selected ? (replies[selected.id] || []) : [];

  const counts = useMemo(() => ({
    all:       submissions.filter((s) => !s.archived_at).length,
    unread:    submissions.filter((s) => s.status === 'unread' && !s.archived_at).length,
    responded: submissions.filter((s) => s.status === 'responded').length,
    archived:  submissions.filter((s) => !!s.archived_at).length,
  }), [submissions]);

  const typesPresent = useMemo(() => {
    const set = new Set();
    submissions.forEach((s) => { if (s.form_type) set.add(s.form_type); });
    return Array.from(set);
  }, [submissions]);

  const handleSelect = async (submission) => {
    setSelectedId(submission.id);
    if (window.innerWidth < 992) setMobileDetailOpen(true);
    if (submission.status === 'unread') {
      await supabase
        .from('form_submissions')
        .update({
          status: 'read',
          viewed_at: new Date().toISOString(),
          viewed_by: user?.id,
        })
        .eq('id', submission.id);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submission.id ? { ...s, status: 'read' } : s))
      );
    }
  };

  const handleArchive = async (id) => {
    await supabase
      .from('form_submissions')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, archived_at: new Date().toISOString() } : s))
    );
    if (selectedId === id) setSelectedId(null);
    toast({ title: 'Archived', status: 'success', duration: 1500 });
  };

  const handleUnarchive = async (id) => {
    await supabase
      .from('form_submissions')
      .update({ archived_at: null })
      .eq('id', id);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, archived_at: null } : s))
    );
    toast({ title: 'Unarchived', status: 'success', duration: 1500 });
  };

  const handleMarkUnread = async (id) => {
    await supabase
      .from('form_submissions')
      .update({ status: 'unread', viewed_at: null, viewed_by: null })
      .eq('id', id);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'unread' } : s))
    );
  };

  return (
    <Box position="relative" minH="100%">
      {/* Header */}
      <VStack align="stretch" spacing={5} mb={6}>
        <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={2}>
            <Text textStyle="kicker">Forms</Text>
            <HStack align="baseline" spacing={3}>
              <Text textStyle="heroNumber" color="white">
                {counts.unread}
              </Text>
              <Text textStyle="heroLabel" pb={1}>
                unread
              </Text>
            </HStack>
          </VStack>
        </HStack>

        {/* Filter pills */}
        <HStack spacing={2} flexWrap="wrap">
          {STATUS_FILTERS.map((f) => (
            <FilterPill
              key={f.key}
              active={statusFilter === f.key}
              onClick={() => setStatusFilter(f.key)}
              count={counts[f.key]}
            >
              {f.label}
            </FilterPill>
          ))}

          {typesPresent.length > 0 && (
            <>
              <Box w="1px" h="20px" bg="surface.800" mx={2} alignSelf="center" />
              <FilterPill
                active={typeFilter === null}
                onClick={() => setTypeFilter(null)}
              >
                All types
              </FilterPill>
              {typesPresent.map((t) => (
                <FilterPill
                  key={t}
                  active={typeFilter === t}
                  onClick={() => setTypeFilter(t === typeFilter ? null : t)}
                  color={FORM_TYPE_COLORS[t]}
                >
                  {FORM_TYPE_LABELS[t] || t}
                </FilterPill>
              ))}
            </>
          )}
        </HStack>

        {/* Search */}
        <HStack
          bg="surface.900"
          border="1px solid"
          borderColor="surface.800"
          borderRadius="lg"
          px={3}
          py={2}
          spacing={2}
          _focusWithin={{ borderColor: 'brand.500' }}
          transition="border-color 0.15s"
        >
          <Icon as={TbSearch} color="surface.500" boxSize={4} />
          <Input
            placeholder="Search by name, email, or message..."
            variant="unstyled"
            fontSize="sm"
            color="white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            _placeholder={{ color: 'surface.600' }}
          />
        </HStack>
      </VStack>

      {loading ? (
        <Center py={20}>
          <Spinner size="md" color="brand.500" thickness="2px" />
        </Center>
      ) : (
        <HStack align="start" spacing={6} minH="60vh">
          {/* LIST */}
          <Box
            w={{ base: '100%', lg: '420px' }}
            flexShrink={0}
            borderTop="1px solid"
            borderColor="surface.900"
            maxH="calc(100vh - 280px)"
            overflowY="auto"
          >
            {filtered.length === 0 ? (
              <VStack py={16} spacing={2}>
                <Icon as={TbInbox} boxSize={8} color="surface.700" />
                <Text color="surface.500" fontSize="sm" fontWeight="700">
                  Nothing here
                </Text>
                <Text color="surface.700" fontSize="xs">
                  {statusFilter === 'unread' ? "You're all caught up" :
                   statusFilter === 'archived' ? 'No archived submissions' :
                   'No submissions match these filters'}
                </Text>
              </VStack>
            ) : (
              filtered.map((s) => (
                <ListRow
                  key={s.id}
                  submission={s}
                  replyCount={s.reply_count || 0}
                  selected={s.id === selectedId}
                  onClick={() => handleSelect(s)}
                />
              ))
            )}
          </Box>

          {/* DETAIL (desktop) */}
          <Box display={{ base: 'none', lg: 'block' }} flex={1} minW={0}>
            {selected ? (
              <DetailPane
                submission={selected}
                replies={selectedReplies}
                onReply={() => setReplyOpen(true)}
                onArchive={() => handleArchive(selected.id)}
                onUnarchive={() => handleUnarchive(selected.id)}
                onMarkUnread={() => handleMarkUnread(selected.id)}
              />
            ) : (
              <EmptyDetail />
            )}
          </Box>
        </HStack>
      )}

      {/* DETAIL (mobile) */}
      <Modal
        isOpen={mobileDetailOpen && !!selected}
        onClose={() => setMobileDetailOpen(false)}
        size="full"
        motionPreset="slideInRight"
      >
        <ModalOverlay />
        <ModalContent bg="surface.950" m={0} borderRadius={0} color="white">
          <ModalBody p={0}>
            {selected && (
              <Box>
                <HStack p={4} borderBottom="1px solid" borderColor="surface.900">
                  <IconButton
                    icon={<TbArrowLeft />}
                    variant="ghost"
                    color="surface.400"
                    onClick={() => setMobileDetailOpen(false)}
                    aria-label="Back"
                    size="sm"
                  />
                  <Text color="white" fontWeight="700" fontSize="sm">
                    Submission
                  </Text>
                </HStack>
                <Box p={5}>
                  <DetailPane
                    submission={selected}
                    replies={selectedReplies}
                    onReply={() => setReplyOpen(true)}
                    onArchive={() => handleArchive(selected.id)}
                    onUnarchive={() => handleUnarchive(selected.id)}
                    onMarkUnread={() => handleMarkUnread(selected.id)}
                  />
                </Box>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* REPLY MODAL */}
      {selected && (
        <ReplyModal
          isOpen={replyOpen}
          onClose={() => setReplyOpen(false)}
          submission={selected}
          replyCount={selected.reply_count || 0}
          userId={user?.id}
          onSuccess={(updated) => {
            setSubmissions((prev) =>
              prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
            );
            setReplyOpen(false);
            fetchReplies();
          }}
        />
      )}
    </Box>
  );
};

// ============================================================
// FILTER PILL
// ============================================================
const FilterPill = ({ active, onClick, children, count, color = 'brand.500' }) => (
  <Box
    as="button"
    onClick={onClick}
    px={3}
    py={1.5}
    borderRadius="full"
    bg={active ? 'surface.800' : 'transparent'}
    border="1px solid"
    borderColor={active ? color : 'surface.800'}
    color={active ? 'white' : 'surface.400'}
    fontSize="xs"
    fontFamily="mono"
    fontWeight="700"
    textTransform="uppercase"
    letterSpacing="0.05em"
    transition="all 0.15s"
    _hover={{ color: 'white', borderColor: active ? color : 'surface.700' }}
    display="flex"
    alignItems="center"
    gap={1.5}
  >
    {children}
    {typeof count === 'number' && count > 0 && (
      <Box as="span" color={active ? color : 'surface.500'} fontWeight="800">
        {count}
      </Box>
    )}
  </Box>
);

// ============================================================
// LIST ROW
// ============================================================
const ListRow = ({ submission, replyCount, selected, onClick }) => {
  const formType = submission.form_type || 'contact';
  const typeLabel = FORM_TYPE_LABELS[formType] || formType.replace(/_/g, ' ');
  const typeColor = FORM_TYPE_COLORS[formType] || '#737373';

  const senderName = getSenderName(submission);
  const senderEmail = getSenderEmail(submission);
  const previewMessage = getPreviewMessage(submission);

  const isUnread = submission.status === 'unread';
  const isResponded = submission.status === 'responded';
  const timeAgo = formatDistanceToNow(new Date(submission.created_at), { addSuffix: true });

  return (
    <Box
      as="button"
      w="100%"
      textAlign="left"
      onClick={onClick}
      px={4}
      py={3}
      borderBottom="1px solid"
      borderColor="surface.900"
      borderLeft="2px solid"
      borderLeftColor={selected ? typeColor : isUnread ? typeColor : 'transparent'}
      bg={selected ? 'rgba(255,255,255,0.02)' : 'transparent'}
      _hover={{ bg: 'rgba(255,255,255,0.015)' }}
      transition="all 0.15s"
    >
      <HStack justify="space-between" mb={1}>
        <HStack spacing={2}>
          <Text
            fontSize="2xs"
            fontWeight="700"
            color={typeColor}
            textTransform="uppercase"
            letterSpacing="0.08em"
            fontFamily="mono"
          >
            {typeLabel}
          </Text>
          {isResponded && (
            <HStack spacing={0.5}>
              <Icon as={TbCircleCheck} boxSize={3} color="accent.neon" />
              {replyCount > 1 && (
                <Text
                  color="accent.neon"
                  fontSize="2xs"
                  fontFamily="mono"
                  fontWeight="800"
                >
                  ×{replyCount}
                </Text>
              )}
            </HStack>
          )}
        </HStack>
        <HStack spacing={1.5}>
          {isUnread && (
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg={typeColor}
              boxShadow={`0 0 6px ${typeColor}80`}
            />
          )}
          <Text color="surface.700" fontSize="2xs" fontFamily="mono">
            {timeAgo}
          </Text>
        </HStack>
      </HStack>
      <Text
        color={isUnread ? 'white' : 'surface.300'}
        fontSize="sm"
        fontWeight={isUnread ? '700' : '500'}
        noOfLines={1}
      >
        {senderName}
      </Text>
      {senderEmail && (
        <Text color="surface.600" fontSize="xs" noOfLines={1} fontFamily="mono">
          {senderEmail}
        </Text>
      )}
      {previewMessage && (
        <Text color="surface.500" fontSize="xs" noOfLines={1} mt={1}>
          {previewMessage}
        </Text>
      )}
    </Box>
  );
};

// ============================================================
// DETAIL PANE
// ============================================================
const DetailPane = ({ submission, replies, onReply, onArchive, onUnarchive, onMarkUnread }) => {
  const formType = submission.form_type || 'contact';
  const typeLabel = FORM_TYPE_LABELS[formType] || formType.replace(/_/g, ' ');
  const typeColor = FORM_TYPE_COLORS[formType] || '#737373';

  const senderName = getSenderName(submission);
  const senderEmail = getSenderEmail(submission);
  const isResponded = submission.status === 'responded';
  const isArchived = !!submission.archived_at;
  const replyCount = submission.reply_count || 0;

  // Build field list
  const skipMetadataKeys = new Set([
    'form_type', 'submitted_at', 'ip', 'user_agent', '_internal', 'website',
    'source', 'form', 'name', 'email', 'contact_name', 'contact_email',
    'full_name', 'message', 'phone', 'company',
  ]);

  const fields = [];
  const addField = (label, value) => {
    if (value === null || value === undefined || value === '') return;
    fields.push({ label, value });
  };

  if (senderName && senderName !== 'Anonymous') addField('Name', senderName);
  if (senderEmail) addField('Email', senderEmail);
  if (submission.phone) addField('Phone', submission.phone);
  if (submission.company) addField('Company', submission.company);
  if (submission.message) addField('Message', submission.message);

  if (submission.metadata && typeof submission.metadata === 'object') {
    Object.entries(submission.metadata).forEach(([k, v]) => {
      if (skipMetadataKeys.has(k)) return;
      if (v === null || v === undefined || v === '') return;
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const display = typeof v === 'object' ? JSON.stringify(v, null, 2)
                    : typeof v === 'boolean' ? (v ? 'Yes' : 'No')
                    : String(v);
      addField(label, display);
    });
  }

  return (
    <VStack align="stretch" spacing={5}>
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1}>
            <Text
              fontSize="2xs"
              fontWeight="700"
              color={typeColor}
              textTransform="uppercase"
              letterSpacing="0.15em"
              fontFamily="mono"
            >
              {typeLabel}
            </Text>
            <Text color="white" fontSize="2xl" fontWeight="700" letterSpacing="-0.01em">
              {senderName}
            </Text>
            {senderEmail && (
              <Text color="surface.400" fontSize="sm" fontFamily="mono">
                {senderEmail}
              </Text>
            )}
          </VStack>
          <Text color="surface.600" fontSize="2xs" fontFamily="mono" flexShrink={0} pt={1}>
            {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
          </Text>
        </HStack>

        {/* Status chips */}
        <HStack spacing={2} flexWrap="wrap">
          {isResponded && (
            <HStack
              spacing={1.5}
              px={2.5}
              py={1}
              borderRadius="full"
              bg="rgba(57,255,20,0.08)"
              border="1px solid"
              borderColor="rgba(57,255,20,0.2)"
            >
              <Icon as={TbCircleCheck} boxSize={3} color="accent.neon" />
              <Text color="accent.neon" fontSize="2xs" fontWeight="700" fontFamily="mono" letterSpacing="0.05em" textTransform="uppercase">
                {replyCount > 1 ? `Replied ${replyCount}×` : 'Responded'}
              </Text>
            </HStack>
          )}
          {isArchived && (
            <HStack
              spacing={1.5}
              px={2.5}
              py={1}
              borderRadius="full"
              bg="surface.900"
              border="1px solid"
              borderColor="surface.800"
            >
              <Icon as={TbArchive} boxSize={3} color="surface.500" />
              <Text color="surface.500" fontSize="2xs" fontWeight="700" fontFamily="mono" letterSpacing="0.05em" textTransform="uppercase">
                Archived
              </Text>
            </HStack>
          )}
        </HStack>
      </VStack>

      {/* Actions */}
      <HStack spacing={2} flexWrap="wrap">
        <ActionButton
          icon={TbSend}
          label={replyCount === 0 ? 'Reply' : 'Send follow-up'}
          color="brand.500"
          onClick={onReply}
          disabled={!senderEmail}
          primary
        />
        <ActionButton
          icon={TbCircleDashed}
          label="Mark unread"
          onClick={onMarkUnread}
        />
        {isArchived ? (
          <ActionButton icon={TbArchiveOff} label="Unarchive" onClick={onUnarchive} />
        ) : (
          <ActionButton icon={TbArchive} label="Archive" onClick={onArchive} />
        )}
      </HStack>

      <Divider borderColor="surface.900" />

      {/* Form fields */}
      <VStack align="stretch" spacing={0} divider={<Box h="1px" bg="surface.900" />}>
        {fields.map(({ label, value }) => (
          <HStack key={label} align="start" spacing={6} py={3}>
            <Text
              color="surface.500"
              fontSize="2xs"
              fontWeight="700"
              fontFamily="mono"
              textTransform="uppercase"
              letterSpacing="0.08em"
              minW="120px"
              flexShrink={0}
              pt={0.5}
            >
              {label}
            </Text>
            <Text
              color="surface.200"
              fontSize="sm"
              flex={1}
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              lineHeight={1.6}
            >
              {value}
            </Text>
          </HStack>
        ))}
      </VStack>

      {/* REPLY HISTORY */}
      {replies.length > 0 && (
        <>
          <Divider borderColor="surface.900" />
          <VStack align="stretch" spacing={3}>
            <HStack spacing={2}>
              <Icon as={TbHistory} boxSize={3.5} color="accent.neon" />
              <Text
                color="accent.neon"
                fontSize="2xs"
                fontWeight="700"
                fontFamily="mono"
                textTransform="uppercase"
                letterSpacing="0.12em"
              >
                Reply History
              </Text>
              <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Text>
            </HStack>

            <VStack align="stretch" spacing={3}>
              {replies.map((reply, idx) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  index={replies.length - idx}
                />
              ))}
            </VStack>
          </VStack>
        </>
      )}

      {/* Footer metadata */}
      <HStack spacing={4} pt={2} opacity={0.6}>
        <Text color="surface.600" fontSize="2xs" fontFamily="mono">
          ID {String(submission.id).slice(0, 8)}
        </Text>
        {submission.last_replied_at && (
          <Text color="surface.600" fontSize="2xs" fontFamily="mono">
            Last reply {formatDistanceToNow(new Date(submission.last_replied_at), { addSuffix: true })}
          </Text>
        )}
      </HStack>
    </VStack>
  );
};

// ============================================================
// REPLY CARD — single reply in the history thread
// ============================================================
const ReplyCard = ({ reply, index }) => {
  const sentAt = format(new Date(reply.created_at), "MMM d 'at' h:mma");
  return (
    <Box
      border="1px solid"
      borderColor="surface.900"
      borderRadius="lg"
      bg="surface.950"
      p={4}
    >
      <HStack justify="space-between" mb={2}>
        <HStack spacing={2}>
          <Box
            w="20px"
            h="20px"
            borderRadius="full"
            bg="rgba(57,255,20,0.12)"
            border="1px solid"
            borderColor="rgba(57,255,20,0.3)"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="accent.neon" fontSize="3xs" fontWeight="800" fontFamily="mono">
              {index}
            </Text>
          </Box>
          <Text color="white" fontSize="xs" fontWeight="700">
            {reply.sender_name || 'Admin'}
          </Text>
        </HStack>
        <Text color="surface.600" fontSize="2xs" fontFamily="mono">
          {sentAt}
        </Text>
      </HStack>
      {reply.subject && (
        <Text color="surface.400" fontSize="xs" fontFamily="mono" mb={2}>
          {reply.subject}
        </Text>
      )}
      <Text
        color="surface.300"
        fontSize="xs"
        whiteSpace="pre-wrap"
        wordBreak="break-word"
        lineHeight={1.6}
      >
        {reply.body}
      </Text>
    </Box>
  );
};

// ============================================================
// ACTION BUTTON
// ============================================================
const ActionButton = ({ icon, label, color, onClick, disabled, primary }) => (
  <Tooltip
    label={disabled ? 'No email address' : null}
    isDisabled={!disabled}
    placement="top"
    hasArrow
    bg="surface.800"
    fontSize="xs"
  >
    <HStack
      as="button"
      onClick={disabled ? undefined : onClick}
      spacing={1.5}
      px={3}
      py={2}
      border="1px solid"
      borderColor={primary ? (color || 'brand.500') : 'surface.800'}
      bg={primary ? `${color || 'brand.500'}15` : 'transparent'}
      borderRadius="lg"
      color={primary ? (color || 'brand.500') : 'surface.300'}
      fontSize="xs"
      fontFamily="mono"
      fontWeight="700"
      textTransform="uppercase"
      letterSpacing="0.05em"
      opacity={disabled ? 0.4 : 1}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      transition="all 0.15s"
      _hover={disabled ? {} : {
        color: 'white',
        bg: primary ? color || 'brand.500' : 'surface.900',
        borderColor: primary ? color || 'brand.500' : 'surface.700',
      }}
    >
      <Icon as={icon} boxSize={3.5} />
      <Text>{label}</Text>
    </HStack>
  </Tooltip>
);

const EmptyDetail = () => (
  <Center
    h="100%"
    minH="400px"
    border="1px dashed"
    borderColor="surface.800"
    borderRadius="xl"
    flexDirection="column"
    gap={3}
  >
    <Icon as={TbInbox} boxSize={8} color="surface.700" />
    <Text color="surface.500" fontSize="sm" fontWeight="600">
      Select a submission
    </Text>
    <Text color="surface.700" fontSize="xs" textAlign="center" maxW="280px">
      Pick any row on the left to see the full message and reply.
    </Text>
  </Center>
);

// ============================================================
// REPLY MODAL
// ============================================================
const ReplyModal = ({ isOpen, onClose, submission, replyCount, userId, onSuccess }) => {
  const toast = useToast();
  const senderName = getSenderName(submission);
  const senderEmail = getSenderEmail(submission);
  const isFollowUp = replyCount > 0;

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const typeLabel = FORM_TYPE_LABELS[submission.form_type] || 'your message';
      if (isFollowUp) {
        setSubject(`Following up — NeonBurro`);
        setBody(`Hi ${senderName},\n\nWanted to follow up on our last message. `);
      } else {
        setSubject(`Re: ${typeLabel} — NeonBurro`);
        setBody(`Hi ${senderName},\n\nThanks for reaching out. `);
      }
    }
  }, [isOpen, submission.id]);

  const handleSend = async () => {
    if (!body.trim()) {
      toast({ title: 'Message is empty', status: 'warning', duration: 1500 });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/.netlify/functions/reply-to-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          recipientEmail: senderEmail,
          recipientName: senderName,
          subject,
          body,
          userId,
          isFollowUp,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Send failed');

      toast({
        title: isFollowUp ? 'Follow-up sent' : 'Reply sent',
        description: `Email delivered to ${senderEmail}`,
        status: 'success',
        duration: 2500,
      });

      onSuccess({
        id: submission.id,
        status: 'responded',
        responded_at: submission.responded_at || new Date().toISOString(),
        responded_by: submission.responded_by || userId,
        last_replied_at: new Date().toISOString(),
        reply_count: (submission.reply_count || 0) + 1,
      });
    } catch (err) {
      toast({
        title: 'Send failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
      <ModalContent
        bg="surface.950"
        border="1px solid"
        borderColor="surface.800"
        color="white"
        mx={4}
      >
        <ModalCloseButton color="surface.500" />
        <ModalBody p={6}>
          <VStack align="stretch" spacing={5}>
            <VStack align="start" spacing={1}>
              <Text textStyle="kicker">
                {isFollowUp ? `Follow-up #${replyCount + 1}` : 'Reply'}
              </Text>
              <Text color="white" fontSize="xl" fontWeight="700" letterSpacing="-0.01em">
                Sending to {senderName}
              </Text>
              <Text color="surface.500" fontSize="sm" fontFamily="mono">
                {senderEmail}
              </Text>
              {isFollowUp && (
                <HStack
                  spacing={1.5}
                  mt={1}
                  px={2}
                  py={1}
                  borderRadius="full"
                  bg="rgba(255,229,0,0.08)"
                  border="1px solid"
                  borderColor="rgba(255,229,0,0.2)"
                >
                  <Icon as={TbHistory} boxSize={3} color="accent.banana" />
                  <Text color="accent.banana" fontSize="2xs" fontWeight="700" fontFamily="mono" letterSpacing="0.05em" textTransform="uppercase">
                    {replyCount} previous {replyCount === 1 ? 'reply' : 'replies'}
                  </Text>
                </HStack>
              )}
            </VStack>

            <VStack align="stretch" spacing={3}>
              <VStack align="stretch" spacing={1}>
                <Text textStyle="label">Subject</Text>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  bg="surface.900"
                  border="1px solid"
                  borderColor="surface.800"
                  color="white"
                  fontSize="sm"
                  _focus={{ borderColor: 'brand.500' }}
                  _placeholder={{ color: 'surface.600' }}
                />
              </VStack>

              <VStack align="stretch" spacing={1}>
                <Text textStyle="label">Message</Text>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  bg="surface.900"
                  border="1px solid"
                  borderColor="surface.800"
                  color="white"
                  fontSize="sm"
                  minH="180px"
                  _focus={{ borderColor: 'brand.500' }}
                  _placeholder={{ color: 'surface.600' }}
                />
              </VStack>
            </VStack>

            <HStack justify="space-between" pt={2}>
              <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                Branded NeonBurro email · reply_to: hello@neonburro.com
              </Text>
              <HStack spacing={2}>
                <Button
                  variant="ghost"
                  color="surface.400"
                  onClick={onClose}
                  size="sm"
                  isDisabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  isLoading={sending}
                  loadingText="Sending..."
                  leftIcon={<TbSend />}
                  bg="brand.500"
                  color="surface.950"
                  size="sm"
                  fontWeight="700"
                  _hover={{ bg: 'brand.400' }}
                >
                  {isFollowUp ? 'Send follow-up' : 'Send reply'}
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default Forms;
