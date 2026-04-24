// src/pages/Dashboard/components/FormInbox.jsx
// Condensed form inbox for the Dashboard — top 5 unread preview.
// Full management lives on /forms/ page.

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Center, Spinner,
} from '@chakra-ui/react';
import { TbInbox, TbArrowRight, TbCircleCheck } from 'react-icons/tb';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

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

const MAX_PREVIEW = 5;

const FormInbox = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreview();

    const channel = supabase
      .channel('dashboard_form_inbox')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'form_submissions' },
        () => fetchPreview()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPreview = async () => {
    const { data } = await supabase
      .from('form_submissions')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      const unread = data.filter((s) => s.status === 'unread');
      setTotalUnread(unread.length);
      // Prefer unread first, fill with recent reads if fewer
      const preview = unread.length >= MAX_PREVIEW
        ? unread.slice(0, MAX_PREVIEW)
        : [...unread, ...data.filter((s) => s.status !== 'unread')].slice(0, MAX_PREVIEW);
      setSubmissions(preview);
    }
    setLoading(false);
  };

  return (
    <Box position="relative">
      {/* Header */}
      <HStack
        spacing={2}
        mb={4}
        justify="space-between"
        cursor="pointer"
        onClick={() => navigate('/forms/')}
        role="group"
      >
        <HStack spacing={2}>
          <Box
            w="6px"
            h="6px"
            borderRadius="full"
            bg={totalUnread > 0 ? 'brand.500' : 'surface.700'}
            boxShadow={totalUnread > 0 ? '0 0 8px rgba(0,229,229,0.6)' : 'none'}
          />
          <Text
            color="brand.500"
            fontSize="xs"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.12em"
            fontFamily="mono"
            _groupHover={{ color: 'brand.400' }}
            transition="color 0.15s"
          >
            Form Inbox
          </Text>
          {totalUnread > 0 && (
            <HStack spacing={1}>
              <Text color="brand.500" fontSize="xs" fontFamily="mono" fontWeight="800">
                {totalUnread}
              </Text>
              <Text color="surface.500" fontSize="2xs" fontFamily="mono">
                unread
              </Text>
            </HStack>
          )}
        </HStack>

        <HStack
          spacing={1}
          color="surface.500"
          _groupHover={{ color: 'brand.500' }}
          transition="color 0.15s"
        >
          <Text fontSize="2xs" fontFamily="mono" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
            View all
          </Text>
          <Icon as={TbArrowRight} boxSize={3} />
        </HStack>
      </HStack>

      {loading ? (
        <Center py={6}>
          <Spinner size="sm" color="brand.500" thickness="2px" />
        </Center>
      ) : submissions.length === 0 ? (
        <VStack py={6} spacing={1.5}>
          <Icon as={TbInbox} boxSize={6} color="surface.700" />
          <Text color="surface.500" fontSize="xs" fontWeight="600">
            Inbox Zero
          </Text>
          <Text color="surface.700" fontSize="2xs">
            Form submissions will appear here
          </Text>
        </VStack>
      ) : (
        <Box borderTop="1px solid" borderColor="surface.900">
          {submissions.map((s) => (
            <PreviewRow
              key={s.id}
              submission={s}
              onClick={() => navigate('/forms/')}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

const PreviewRow = ({ submission, onClick }) => {
  const formType = submission.form_type || 'contact';
  const typeLabel = FORM_TYPE_LABELS[formType] || formType.replace(/_/g, ' ');
  const typeColor = FORM_TYPE_COLORS[formType] || '#737373';

  const data = submission.data || submission;
  const senderName = submission.name || data.name || data.full_name || 'Anonymous';
  const senderEmail = submission.email || data.email || null;
  const previewMessage = submission.message || data.message || data.description || data.brief || '';

  const isUnread = submission.status === 'unread';
  const isResponded = submission.status === 'responded';
  const timeAgo = formatDistanceToNow(new Date(submission.created_at), { addSuffix: true });

  return (
    <Box
      as="button"
      w="100%"
      textAlign="left"
      onClick={onClick}
      borderBottom="1px solid"
      borderColor="surface.900"
      borderLeft="2px solid"
      borderLeftColor={isUnread ? typeColor : 'transparent'}
      transition="all 0.15s"
      _hover={{ bg: 'rgba(255,255,255,0.012)' }}
    >
      <HStack spacing={3} py={3} pl={4} pr={3} align="center">
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
              <Text color="surface.600" fontSize="xs" noOfLines={1} display={{ base: 'none', md: 'block' }}>
                {senderEmail}
              </Text>
            )}
            {isResponded && (
              <Icon as={TbCircleCheck} boxSize={3} color="accent.neon" />
            )}
          </HStack>
          {previewMessage && (
            <Text color="surface.600" fontSize="xs" noOfLines={1} mt={0.5}>
              {previewMessage}
            </Text>
          )}
        </Box>

        <Text
          color="surface.700"
          fontSize="2xs"
          fontFamily="mono"
          flexShrink={0}
          display={{ base: 'none', md: 'block' }}
        >
          {timeAgo}
        </Text>

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
    </Box>
  );
};

export default FormInbox;
