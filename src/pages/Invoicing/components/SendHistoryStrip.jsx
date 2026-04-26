// src/pages/Invoicing/components/SendHistoryStrip.jsx
// Timeline of every send for an invoice — initial, resends, reminders.
// Lives on the InvoiceEditor between the header and the tabs.

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Tooltip, Spinner,
} from '@chakra-ui/react';
import {
  TbSend, TbRotateClockwise, TbBellRinging, TbEye,
} from 'react-icons/tb';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '../../../lib/supabase';

const SEND_TYPE_META = {
  initial:  { icon: TbSend,           label: 'Sent',     color: '#00E5E5' },
  resend:   { icon: TbRotateClockwise,label: 'Resent',   color: '#06B6D4' },
  reminder: { icon: TbBellRinging,    label: 'Reminder', color: '#FFE500' },
};

const SendHistoryStrip = ({ invoiceId, refreshKey, onViewSnapshot }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('invoice_history')
        .select('id, sent_at, sent_to, send_type, sent_by')
        .eq('invoice_id', invoiceId)
        .order('sent_at', { ascending: false });
      if (!cancelled) {
        setHistory(data || []);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [invoiceId, refreshKey]);

  if (!invoiceId) return null;

  if (loading) {
    return (
      <HStack py={3} spacing={2}>
        <Spinner size="xs" color="surface.700" thickness="1.5px" />
        <Text color="surface.700" fontSize="2xs" fontFamily="mono">Loading history</Text>
      </HStack>
    );
  }

  if (history.length === 0) return null;

  return (
    <Box
      py={3}
      px={4}
      borderRadius="lg"
      bg="rgba(255,255,255,0.015)"
      border="1px solid"
      borderColor="surface.900"
    >
      <HStack spacing={2} mb={2}>
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg="brand.500"
          boxShadow="0 0 6px rgba(0,229,229,0.5)"
        />
        <Text
          color="brand.500"
          fontSize="2xs"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.12em"
          fontFamily="mono"
        >
          Send History
        </Text>
        <Text color="surface.700" fontSize="2xs" fontFamily="mono">
          {history.length} event{history.length !== 1 ? 's' : ''}
        </Text>
      </HStack>

      <VStack align="stretch" spacing={1} divider={<Box h="1px" bg="surface.900" />}>
        {history.map((event, idx) => {
          const meta = SEND_TYPE_META[event.send_type] || SEND_TYPE_META.initial;
          const isLatest = idx === 0;
          return (
            <HStack key={event.id} spacing={3} py={2} role="group">
              <Icon as={meta.icon} boxSize={3.5} color={meta.color} flexShrink={0} />

              <Text
                color={isLatest ? 'white' : 'surface.400'}
                fontSize="xs"
                fontWeight={isLatest ? '700' : '500'}
                minW="70px"
              >
                {meta.label}
              </Text>

              <Text color="surface.500" fontSize="xs" fontFamily="mono" flex={1} noOfLines={1}>
                {event.sent_to || '—'}
              </Text>

              <Tooltip
                label={format(new Date(event.sent_at), "MMM d, yyyy 'at' h:mma")}
                placement="top"
                hasArrow
                bg="surface.800"
                color="white"
                fontSize="xs"
              >
                <Text color="surface.600" fontSize="2xs" fontFamily="mono" flexShrink={0}>
                  {formatDistanceToNow(new Date(event.sent_at), { addSuffix: true })}
                </Text>
              </Tooltip>

              <Tooltip
                label="View this email"
                placement="top"
                hasArrow
                bg="surface.800"
                fontSize="xs"
              >
                <Box
                  as="button"
                  onClick={() => onViewSnapshot && onViewSnapshot(invoiceId, event.id)}
                  color="surface.700"
                  _groupHover={{ color: 'surface.500' }}
                  _hover={{ color: 'brand.500' }}
                  transition="color 0.15s"
                  p={1}
                >
                  <Icon as={TbEye} boxSize={3.5} />
                </Box>
              </Tooltip>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
};

export default SendHistoryStrip;
