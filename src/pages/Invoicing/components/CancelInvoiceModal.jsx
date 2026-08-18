// src/pages/Invoicing/components/CancelInvoiceModal.jsx
// Soft-cancel modal for sent invoices, on Paper. Requires typing CANCEL to
// confirm, captures an optional reason. Caller owns the Supabase update. Cream
// card, coral accent for the destructive edge. No oxford commas, no em dashes.

import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Box, VStack, HStack, Text, Icon, Input, Button,
} from '@chakra-ui/react';
import { TbAlertTriangle } from 'react-icons/tb';
import colors from '../../../theme/colors';
import { FIELD_LABEL, NAKED_INPUT } from '../../../lib/invoiceConstants';

const P = colors.paper;

const CancelInvoiceModal = ({ isOpen, onClose, invoice, onConfirm, processing }) => {
  const [typedConfirm, setTypedConfirm] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) { setTypedConfirm(''); setReason(''); }
  }, [isOpen]);

  const canConfirm = typedConfirm === 'CANCEL';

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="rgba(36,26,22,0.55)" backdropFilter="blur(4px)" />
      <ModalContent bg={P.mat} color={P.ink} border="1px solid" borderColor={`${P.coral}66`} borderRadius="2xl" mx={4}>
        <ModalHeader pb={2} pt={6} px={6}>
          <HStack spacing={3}>
            <Box w="40px" h="40px" borderRadius="full" bg={`${P.coral}1A`} border="1px solid" borderColor={`${P.coral}55`} display="flex" alignItems="center" justifyContent="center">
              <Icon as={TbAlertTriangle} boxSize={4} color={P.coral} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color={P.ink} fontSize="md" fontWeight="800">Cancel invoice</Text>
              <Text color={P.inkMuted} fontSize="2xs" fontFamily="mono">{invoice?.invoice_number}</Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={P.inkMuted} top={5} right={5} />

        <ModalBody px={6} py={5}>
          <VStack spacing={5} align="stretch">
            <Text color={P.inkSec} fontSize="sm" lineHeight="1.6">
              This marks the invoice cancelled and invalidates the payment link in the client's email. The sprint history and snapshot are preserved.
            </Text>

            <Box bg={P.sunken} border="1px solid" borderColor={P.hair} borderRadius="lg" p={3}>
              <Text color={P.gold} fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" mb={1}>What happens</Text>
              <VStack align="start" spacing={1} fontSize="xs" color={P.inkMuted}>
                <Text>· Invoice hidden from all lists</Text>
                <Text>· Pay link in the email is killed</Text>
                <Text>· Snapshot preserved for records</Text>
                <Text>· Activity log entry created</Text>
              </VStack>
            </Box>

            <Box>
              <Text {...FIELD_LABEL}>Reason (optional)</Text>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you cancelling?" {...NAKED_INPUT} />
            </Box>

            <Box>
              <Text {...FIELD_LABEL}>Type CANCEL to confirm</Text>
              <Input value={typedConfirm} onChange={(e) => setTypedConfirm(e.target.value.toUpperCase())} placeholder="CANCEL" {...NAKED_INPUT} fontFamily="mono" letterSpacing="0.1em" />
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={P.hair} pt={4} pb={6} px={6}>
          <HStack spacing={2} w="100%">
            <Button flex={1} size="md" variant="outline" borderColor={P.hair} color={P.inkMuted} borderRadius="lg" onClick={onClose} _hover={{ borderColor: P.inkFaint, color: P.ink, bg: P.sunken }}>
              Keep invoice
            </Button>
            <Button flex={1} size="md" bg={canConfirm ? P.coral : P.hair} color={canConfirm ? P.sheet : P.inkFaint} fontWeight="700" borderRadius="lg" onClick={() => onConfirm(reason)} isDisabled={!canConfirm} isLoading={processing} loadingText="Cancelling" _hover={canConfirm ? { bg: '#A8362A' } : {}}>
              Cancel invoice
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CancelInvoiceModal;
