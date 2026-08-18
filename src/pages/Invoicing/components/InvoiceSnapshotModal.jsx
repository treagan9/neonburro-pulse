// src/pages/Invoicing/components/InvoiceSnapshotModal.jsx
// Shows the exact email the client received, on Paper. Uses
// invoice_history.rendered_html if available, otherwise re-renders from the
// snapshot. The email itself is warm paper, so the frame around it is cream too.
// No oxford commas, no em dashes.

import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody, ModalHeader, ModalCloseButton,
  Box, VStack, HStack, Text, Spinner, Center, Icon,
} from '@chakra-ui/react';
import { TbMail, TbClock, TbCalendar } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import { buildInvoiceEmailHTML } from '../../../lib/invoiceEmailTemplate';
import colors from '../../../theme/colors';

const P = colors.paper;

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

const InvoiceSnapshotModal = ({ isOpen, onClose, invoiceId }) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState(null);
  const [renderedHtml, setRenderedHtml] = useState(null);

  useEffect(() => {
    if (isOpen && invoiceId) loadSnapshot();
    else { setHistory(null); setRenderedHtml(null); }
  }, [isOpen, invoiceId]);

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const { data: histRows } = await supabase
        .from('invoice_history')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('sent_at', { ascending: false })
        .limit(1);

      const hist = histRows?.[0];
      if (!hist) { setHistory(null); setRenderedHtml(null); setLoading(false); return; }
      setHistory(hist);

      if (hist.rendered_html) {
        setRenderedHtml(hist.rendered_html);
      } else if (hist.invoice_snapshot) {
        const snap = hist.invoice_snapshot;
        const html = buildInvoiceEmailHTML({
          invoice: { invoice_number: snap.invoice_number },
          client: { name: snap.client_name, email: snap.client_email },
          project: snap.project_name ? { name: snap.project_name, project_number: snap.project_number } : null,
          lineItems: snap.line_items || [],
          invoiceDate: snap.invoice_date,
          payUrl: snap.pay_url || '#',
        });
        setRenderedHtml(html);
      }
    } catch (err) {
      console.error('Failed to load snapshot:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay bg="rgba(36,26,22,0.55)" backdropFilter="blur(4px)" />
      <ModalContent bg={P.mat} color={P.ink} border="1px solid" borderColor={P.hair} borderRadius="2xl" mx={4} maxH="90vh">
        <ModalHeader pb={3} pt={6} px={6}>
          <HStack spacing={3}>
            <Box w="40px" h="40px" borderRadius="full" bg={`${P.lime}1A`} border="1px solid" borderColor={`${P.lime}55`} display="flex" alignItems="center" justifyContent="center">
              <Icon as={TbMail} boxSize={4} color={P.limeDeep} />
            </Box>
            <VStack align="start" spacing={0} flex={1}>
              <Text color={P.ink} fontSize="md" fontWeight="800">Email snapshot</Text>
              {history && (
                <HStack spacing={2}>
                  <Icon as={TbCalendar} boxSize={2.5} color={P.inkFaint} />
                  <Text color={P.inkMuted} fontSize="2xs" fontFamily="mono">Sent {formatDate(history.sent_at)}</Text>
                  {history.sent_to && (
                    <>
                      <Text color={P.inkFaint} fontSize="2xs">·</Text>
                      <Text color={P.inkMuted} fontSize="2xs" fontFamily="mono">{history.sent_to}</Text>
                    </>
                  )}
                </HStack>
              )}
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={P.inkMuted} top={5} right={5} />

        <ModalBody px={6} pb={6}>
          {loading ? (
            <Center py={20}>
              <VStack spacing={3}>
                <Spinner size="md" color={P.limeDeep} thickness="2px" />
                <Text color={P.inkFaint} fontSize="xs" fontFamily="mono">Loading snapshot</Text>
              </VStack>
            </Center>
          ) : !history ? (
            <Center py={16}>
              <VStack spacing={3}>
                <Icon as={TbClock} boxSize={10} color={P.inkFaint} />
                <Text color={P.inkMuted} fontSize="sm" fontWeight="700">No snapshot available</Text>
                <Text color={P.inkFaint} fontSize="2xs" textAlign="center" maxW="280px">
                  This invoice has not been sent yet. Snapshots are created when an invoice is emailed to the client.
                </Text>
              </VStack>
            </Center>
          ) : (
            <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor={P.hair} bg={P.mat}>
              <Box
                as="iframe"
                srcDoc={renderedHtml}
                title="Invoice email snapshot"
                width="100%"
                minH="700px"
                border="none"
                display="block"
                sandbox="allow-same-origin"
                ref={(iframe) => {
                  if (!iframe) return;
                  const handleLoad = () => {
                    try {
                      const doc = iframe.contentDocument || iframe.contentWindow?.document;
                      if (doc?.body) {
                        iframe.style.height = `${doc.body.scrollHeight + 40}px`;
                      }
                    } catch {}
                  };
                  iframe.addEventListener('load', handleLoad);
                  setTimeout(handleLoad, 500);
                  setTimeout(handleLoad, 1500);
                }}
              />
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default InvoiceSnapshotModal;
