// src/pages/Invoicing/components/MarkPaidModal.jsx
// Off-platform payment recording, on Paper. Used when a client pays via check,
// wire, cash and so on. Updates invoice status to paid, sets paid_at, total_paid,
// payment_method and payment_reference, logs to activity_log with method plus
// reference. Cream card, ink text, lime confirm. No oxford commas, no em dashes.

import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Box, VStack, HStack, Text, Icon, Input, Textarea,
  Button,
} from '@chakra-ui/react';
import { TbCash, TbCheck } from 'react-icons/tb';
import colors from '../../../theme/colors';
import DotSelect from '../../../components/common/DotSelect';
import {
  PAYMENT_METHODS, FIELD_LABEL, NAKED_INPUT, formatCurrency,
} from '../../../lib/invoiceConstants';

const P = colors.paper;

const MarkPaidModal = ({ isOpen, onClose, invoice, onConfirm, processing }) => {
  const outstanding = invoice
    ? parseFloat(invoice.total || 0) - parseFloat(invoice.total_paid || 0)
    : 0;

  const [method, setMethod] = useState('check');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paidDate, setPaidDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMethod('check');
      setReference('');
      setAmount(outstanding.toString());
      setNotes('');
      setPaidDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, outstanding]);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.value === method);
  const numericAmount = parseFloat(amount || 0);
  const canConfirm = numericAmount > 0 && paidDate;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      method,
      reference: reference.trim() || null,
      amount: numericAmount,
      notes: notes.trim() || null,
      paid_date: paidDate,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="rgba(36,26,22,0.55)" backdropFilter="blur(4px)" />
      <ModalContent bg={P.mat} color={P.ink} border="1px solid" borderColor={P.hair} borderRadius="2xl" mx={4}>
        <ModalHeader pb={2} pt={6} px={6}>
          <HStack spacing={3}>
            <Box w="40px" h="40px" borderRadius="full" bg={`${P.lime}2E`} border="1px solid" borderColor={`${P.lime}`} display="flex" alignItems="center" justifyContent="center">
              <Icon as={TbCash} boxSize={4} color={P.limeDeep} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color={P.ink} fontSize="md" fontWeight="800">Mark as paid</Text>
              <Text color={P.inkMuted} fontSize="2xs" fontFamily="mono">
                {invoice?.invoice_number} · {formatCurrency(outstanding)} outstanding
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={P.inkMuted} top={5} right={5} />

        <ModalBody px={6} py={4}>
          <VStack align="stretch" spacing={5}>
            <Text color={P.inkMuted} fontSize="sm" lineHeight={1.6}>
              Record an off-platform payment. The invoice is marked paid, the payment link disabled, and a snapshot preserved.
            </Text>

            <HStack spacing={4} align="start">
              <Box flex={1}>
                <Text {...FIELD_LABEL}>Method</Text>
                <DotSelect value={method} onChange={setMethod} options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))} />
              </Box>
              <Box flex={1}>
                <Text {...FIELD_LABEL}>Paid date</Text>
                <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} {...NAKED_INPUT} />
              </Box>
            </HStack>

            <Box>
              <Text {...FIELD_LABEL}>{selectedMethod?.referenceLabel || 'Reference'} (optional)</Text>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={method === 'check' ? '#1234' : 'Tracking number or note'} {...NAKED_INPUT} fontFamily={method === 'check' || method === 'wire' ? 'mono' : 'body'} />
            </Box>

            <Box>
              <Text {...FIELD_LABEL}>Amount received</Text>
              <HStack spacing={2}>
                <Text color={P.inkMuted} fontSize="sm" fontFamily="mono">$</Text>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" {...NAKED_INPUT} fontFamily="mono" flex={1} />
              </HStack>
              {numericAmount > 0 && numericAmount !== outstanding && (
                <Text color={P.gold} fontSize="2xs" fontFamily="mono" mt={1}>
                  {numericAmount > outstanding
                    ? `Overpayment: ${formatCurrency(numericAmount - outstanding)} above outstanding`
                    : `Partial payment: ${formatCurrency(outstanding - numericAmount)} will remain due`}
                </Text>
              )}
            </Box>

            <Box>
              <Text {...FIELD_LABEL}>Internal notes (optional)</Text>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the team should know about this payment" bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="lg" color={P.ink} fontSize="sm" rows={2} _focus={{ borderColor: P.lime, boxShadow: 'none' }} _placeholder={{ color: P.inkFaint }} />
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={P.hair} pt={4} pb={6} px={6}>
          <HStack spacing={2} w="100%">
            <Button flex={1} size="md" variant="outline" borderColor={P.hair} color={P.inkMuted} borderRadius="lg" onClick={onClose} isDisabled={processing} _hover={{ borderColor: P.inkFaint, color: P.ink, bg: P.sunken }}>
              Cancel
            </Button>
            <Button flex={1} size="md" bg={canConfirm ? P.lime : P.hair} color={canConfirm ? P.limeInk : P.inkFaint} fontWeight="700" borderRadius="lg" leftIcon={<TbCheck size={14} />} onClick={handleConfirm} isDisabled={!canConfirm} isLoading={processing} loadingText="Recording" _hover={canConfirm ? { bg: '#B8CC4A' } : {}}>
              Mark paid
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MarkPaidModal;
