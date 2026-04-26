// src/pages/Invoicing/components/MarkPaidModal.jsx
// Off-platform payment recording. Used when client pays via check, wire, cash, etc.
// Updates invoice status to "paid", sets paid_at, total_paid, payment_method,
// and payment_reference. Logs to activity_log with method + reference.

import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Box, VStack, HStack, Text, Icon, Input, Select, Textarea,
  Button,
} from '@chakra-ui/react';
import { TbCash, TbCheck } from 'react-icons/tb';
import {
  PAYMENT_METHODS,
  FIELD_LABEL,
  NAKED_INPUT,
  formatCurrency,
} from '../../../lib/invoiceConstants';

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
      setPaidDate(new Date().toISOString().split('T')[0]); // today, YYYY-MM-DD
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
      <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(8px)" />
      <ModalContent
        bg="surface.950"
        border="1px solid"
        borderColor="rgba(57,255,20,0.2)"
        borderRadius="2xl"
        mx={4}
        color="white"
      >
        <ModalHeader pb={2} pt={6} px={6}>
          <HStack spacing={3}>
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bg="rgba(57,255,20,0.08)"
              border="1px solid rgba(57,255,20,0.3)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={TbCash} boxSize={4} color="accent.neon" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color="white" fontSize="md" fontWeight="800">
                Mark as Paid
              </Text>
              <Text color="surface.500" fontSize="2xs" fontFamily="mono">
                {invoice?.invoice_number} · {formatCurrency(outstanding)} outstanding
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.500" top={5} right={5} />

        <ModalBody px={6} py={4}>
          <VStack align="stretch" spacing={5}>
            <Text color="surface.400" fontSize="sm" lineHeight={1.6}>
              Record an off-platform payment. The invoice will be marked paid, the
              payment link disabled, and a snapshot preserved.
            </Text>

            <HStack spacing={4} align="start">
              <Box flex={1}>
                <Text {...FIELD_LABEL}>Method</Text>
                <Select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  {...NAKED_INPUT}
                  fontFamily="body"
                  cursor="pointer"
                  sx={{ '& option': { bg: 'surface.950', color: 'white' } }}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </Select>
              </Box>

              <Box flex={1}>
                <Text {...FIELD_LABEL}>Paid Date</Text>
                <Input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  {...NAKED_INPUT}
                />
              </Box>
            </HStack>

            <Box>
              <Text {...FIELD_LABEL}>{selectedMethod?.referenceLabel || 'Reference'} (optional)</Text>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={method === 'check' ? '#1234' : 'Tracking number or note'}
                {...NAKED_INPUT}
                fontFamily={method === 'check' || method === 'wire' ? 'mono' : 'body'}
              />
            </Box>

            <Box>
              <Text {...FIELD_LABEL}>Amount Received</Text>
              <HStack spacing={2}>
                <Text color="surface.500" fontSize="sm" fontFamily="mono">$</Text>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  {...NAKED_INPUT}
                  fontFamily="mono"
                  flex={1}
                />
              </HStack>
              {numericAmount > 0 && numericAmount !== outstanding && (
                <Text color="accent.banana" fontSize="2xs" fontFamily="mono" mt={1}>
                  {numericAmount > outstanding
                    ? `Overpayment: ${formatCurrency(numericAmount - outstanding)} above outstanding`
                    : `Partial payment: ${formatCurrency(outstanding - numericAmount)} will remain due`}
                </Text>
              )}
            </Box>

            <Box>
              <Text {...FIELD_LABEL}>Internal Notes (optional)</Text>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the team should know about this payment"
                bg="transparent"
                border="1px solid"
                borderColor="surface.800"
                borderRadius="lg"
                color="white"
                fontSize="sm"
                rows={2}
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                _placeholder={{ color: 'surface.700' }}
              />
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="surface.900" pt={4} pb={6} px={6}>
          <HStack spacing={2} w="100%">
            <Button
              flex={1}
              size="md"
              variant="outline"
              borderColor="surface.800"
              color="surface.400"
              borderRadius="lg"
              onClick={onClose}
              isDisabled={processing}
              _hover={{ borderColor: 'surface.700', color: 'white' }}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              size="md"
              bg={canConfirm ? 'accent.neon' : 'surface.850'}
              color={canConfirm ? 'surface.950' : 'surface.700'}
              fontWeight="700"
              borderRadius="lg"
              leftIcon={<TbCheck size={14} />}
              onClick={handleConfirm}
              isDisabled={!canConfirm}
              isLoading={processing}
              loadingText="Recording"
              _hover={canConfirm ? { bg: '#2DD30F' } : {}}
            >
              Mark Paid
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MarkPaidModal;
