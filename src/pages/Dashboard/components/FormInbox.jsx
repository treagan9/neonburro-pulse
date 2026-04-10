// src/pages/Dashboard/components/FormInbox.jsx
// Collapsable form submission inbox for the dashboard
// - Shows unread count when collapsed
// - Click row to expand and see all fields
// - Mark read / archive actions
// - Generic JSONB renderer that handles any form_type

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Center, Spinner, Collapse,
  Button, useToast, Tooltip,
} from '@chakra-ui/react';
import {
  TbInbox, TbChevronDown, TbChevronRight, TbArchive,
  TbCheck, TbExternalLink, TbMail, TbMessage,
} from 'react-icons/tb';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../../lib/supabase';

// Friendly labels for each form type
const FORM_TYPE_LABELS = {
  contact: 'Contact',
  application: 'Application',
  collective_request: 'Collective',
  hosting: 'Hosting',
  nomination: 'Nomination',
  project_brief: 'Project Brief',
  wild_request: 'Wild Request',
};

const FORM_TYPE_COLORS = {
  contact: '#00E5E5',
  application: '#8B5CF6',
  collective_request: '#EC4899',
  hosting: '#06B6D4',
  nomination: '#FFE500',
  project_brief: '#39FF14',
  wild_request: '#FF6B35',
};

// Walk an arbitrary JSONB object and render it as label/value pairs
// Skips internal fields, renders nested objects as JSON
const renderFormFields = (data) => {
  if (!data || typeof data !== 'object') return null;
  const skipKeys = ['form_type', 'submitted_at', 'ip', 'user_agent', '_internal'];
  const entries = Object.entries(data).filter(([k]) => !skipKeys.includes(k));
  if (entries.length === 0) return null;

  return entries.map(([key, value]) => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    let display;
    if (value === null || value === undefined || value === '') {
      display = '—';
    } else if (typeof value === 'object') {
      display = JSON.stringify(value, null, 2);
    } else if (typeof value === 'boolean') {
      display = value ? 'Yes' : 'No';
    } else {
      display = String(value);
    }

    return (
      <HStack key={key} align="start" spacing={4} py={1.5}>
        <Text
          color="surface.600"
          fontSize="2xs"
          fontWeight="700"
          fontFamily="mono"
          textTransform="uppercase"
          letterSpacing="0.05em"
          minW="100px"
          flexShrink={0}
        >
          {label}
        </Text>
        <Text
          color="surface.300"
          fontSize="xs"
          flex={1}
          whiteSpace="pre-wrap"
          wordBreak="break-word"
        >
          {display}
        </Text>
      </HStack>
    );
  });
};

const FormRow = ({ submission, onMarkRead, onArchive }) => {
  const [expanded, setExpanded] = useState(false);
  const toast = useToast();

  const formType = submission.form_type || submission.data?.form_type || 'contact';
  const typeLabel = FORM_TYPE_LABELS[formType] || formType.replace(/_/g, ' ');
  const typeColor = FORM_TYPE_COLORS[formType] || '#737373';

  // Pull common fields from the data payload
  const data = submission.data || submission;
  const senderName = data.name || data.full_name || data.contact_name || 'Anonymous';
  const senderEmail = data.email || data.contact_email || null;
  const previewMessage =
    data.message ||
    data.description ||
    data.brief ||
    data.request ||
    data.notes ||
    data.details ||
    '';

  const isUnread = submission.status === 'unread';
  const timeAgo = formatDistanceToNow(new Date(submission.created_at), { addSuffix: true });

  const handleToggle = async () => {
    if (!expanded && isUnread) {
      // Auto-mark read on first expand
      await onMarkRead(submission.id);
    }
    setExpanded(!expanded);
  };

  return (
    <Box
      borderBottom="1px solid"
      borderColor="surface.900"
      borderLeft="2px solid"
      borderLeftColor={isUnread ? typeColor : 'transparent'}
      transition="all 0.15s"
      _hover={{ bg: 'rgba(255,255,255,0.012)' }}
    >
      <HStack
        spacing={3}
        py={3}
        pl={4}
        pr={3}
        cursor="pointer"
        onClick={handleToggle}
        align="center"
      >
        <Icon
          as={expanded ? TbChevronDown : TbChevronRight}
          boxSize={3}
          color="surface.600"
          flexShrink={0}
        />

        {/* Type label */}
        <Box minW="90px" flexShrink={0}>
          <Text
            fontSize="2xs"
            fontWeight="700"
            color={typeColor}
            textTransform="uppercase"
            letterSpacing="0.06em"
            fontFamily="mono"
          >
            {typeLabel}
          </Text>
        </Box>

        {/* Sender + preview */}
        <Box flex={1} minW={0}>
          <HStack spacing={2} align="baseline">
            <Text
              color={isUnread ? 'white' : 'surface.400'}
              fontSize="sm"
              fontWeight={isUnread ? '700' : '500'}
              noOfLines={1}
            >
              {senderName}
            </Text>
            {senderEmail && (
              <Text color="surface.600" fontSize="xs" noOfLines={1}>
                {senderEmail}
              </Text>
            )}
          </HStack>
          {previewMessage && (
            <Text color="surface.600" fontSize="xs" noOfLines={1} mt={0.5}>
              {previewMessage}
            </Text>
          )}
        </Box>

        {/* Timestamp */}
        <Text
          color="surface.700"
          fontSize="2xs"
          fontFamily="mono"
          flexShrink={0}
          display={{ base: 'none', md: 'block' }}
        >
          {timeAgo}
        </Text>

        {/* Unread indicator dot */}
        {isUnread && (
          <Box
            w="6px"
            h="6px"
            borderRadius="full"
            bg={typeColor}
            boxShadow={`0 0 6px ${typeColor}80`}
            flexShrink={0}
          />
        )}
      </HStack>

      {/* Expanded details */}
      <Collapse in={expanded} animateOpacity>
        <Box pl={12} pr={4} pb={4} pt={1}>
          <Box
            bg="surface.950"
            border="1px solid"
            borderColor="surface.800"
            borderRadius="lg"
            p={4}
          >
            <VStack align="stretch" spacing={0} divider={
              <Box h="1px" bg="surface.900" />
            }>
              {renderFormFields(data)}
            </VStack>

            {/* Footer with metadata + actions */}
            <HStack
              justify="space-between"
              pt={3}
              mt={3}
              borderTop="1px solid"
              borderColor="surface.900"
              flexWrap="wrap"
              spacing={2}
            >
              <HStack spacing={3}>
                {senderEmail && (
                  <Tooltip label="Reply via email" placement="top" hasArrow bg="surface.800" fontSize="xs">
                    <Box
                      as="a"
                      href={`mailto:${senderEmail}`}
                      color="brand.500"
                      _hover={{ color: 'brand.400' }}
                    >
                      <Icon as={TbMail} boxSize={3.5} />
                    </Box>
                  </Tooltip>
                )}
                <Text color="surface.700" fontSize="2xs" fontFamily="mono">
                  ID {String(submission.id).slice(0, 8)}
                </Text>
                {data.ip && (
                  <Text color="surface.700" fontSize="2xs" fontFamily="mono">
                    {data.ip}
                  </Text>
                )}
              </HStack>

              <HStack spacing={3}>
                <Box
                  as="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(submission.id);
                  }}
                  color="surface.600"
                  _hover={{ color: 'red.400' }}
                  fontSize="2xs"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  <HStack spacing={1}>
                    <Icon as={TbArchive} boxSize={3} />
                    <Text>Archive</Text>
                  </HStack>
                </Box>
              </HStack>
            </HStack>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

const FormInbox = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true); // Inbox itself is expanded by default
  const toast = useToast();

  useEffect(() => { fetchSubmissions(); }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load form submissions:', error);
      setLoading(false);
      return;
    }
    setSubmissions(data || []);
    setLoading(false);
  };

  const handleMarkRead = async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('form_submissions')
        .update({
          status: 'read',
          viewed_at: new Date().toISOString(),
          viewed_by: user?.id,
        })
        .eq('id', id);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'read' } : s))
      );
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const handleArchive = async (id) => {
    try {
      await supabase
        .from('form_submissions')
        .update({ archived_at: new Date().toISOString(), status: 'archived' })
        .eq('id', id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      toast({ title: 'Archived', status: 'success', duration: 1500 });
    } catch (err) {
      toast({ title: 'Archive failed', description: err.message, status: 'error' });
    }
  };

  const unreadCount = submissions.filter((s) => s.status === 'unread').length;
  const totalCount = submissions.length;

  return (
    <Box
      bg="surface.900"
      border="1px solid"
      borderColor="surface.800"
      borderRadius="2xl"
      overflow="hidden"
    >
      {/* Header - clickable to collapse */}
      <HStack
        px={5}
        py={4}
        spacing={3}
        cursor="pointer"
        onClick={() => setExpanded(!expanded)}
        _hover={{ bg: 'rgba(255,255,255,0.01)' }}
        transition="all 0.15s"
      >
        <Icon
          as={expanded ? TbChevronDown : TbChevronRight}
          boxSize={3.5}
          color="surface.500"
        />
        <Icon as={TbInbox} boxSize={4} color="brand.500" />
        <Text
          color="brand.500"
          fontSize="xs"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.12em"
          fontFamily="mono"
        >
          Form Inbox
        </Text>
        <Box flex={1} />
        {!loading && (
          <HStack spacing={2}>
            {unreadCount > 0 && (
              <HStack spacing={1}>
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg="brand.500"
                  boxShadow="0 0 6px rgba(0,229,229,0.6)"
                />
                <Text color="brand.500" fontSize="xs" fontFamily="mono" fontWeight="800">
                  {unreadCount}
                </Text>
                <Text color="surface.500" fontSize="2xs" fontFamily="mono">
                  unread
                </Text>
              </HStack>
            )}
            <Text color="surface.700" fontSize="2xs" fontFamily="mono">
              {totalCount} total
            </Text>
          </HStack>
        )}
      </HStack>

      {/* Body */}
      <Collapse in={expanded} animateOpacity>
        {loading ? (
          <Center py={10}>
            <Spinner size="sm" color="brand.500" thickness="2px" />
          </Center>
        ) : submissions.length === 0 ? (
          <VStack py={10} spacing={2}>
            <Icon as={TbInbox} boxSize={8} color="surface.700" />
            <Text color="surface.500" fontSize="sm" fontWeight="700">
              Inbox Zero
            </Text>
            <Text color="surface.700" fontSize="2xs">
              Form submissions will appear here when received
            </Text>
          </VStack>
        ) : (
          <Box borderTop="1px solid" borderColor="surface.900">
            {submissions.map((sub) => (
              <FormRow
                key={sub.id}
                submission={sub}
                onMarkRead={handleMarkRead}
                onArchive={handleArchive}
              />
            ))}
          </Box>
        )}
      </Collapse>
    </Box>
  );
};

export default FormInbox;