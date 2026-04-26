// src/pages/Invoicing/components/CancelInvoiceModal.jsx
// Soft-cancel modal for sent invoices.
// Requires the user to type "CANCEL" to confirm. Captures optional reason.
// Caller owns the actual cancel logic and Supabase update.

import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Box, VStack, HStack, Text, Icon, Input, Button,
} from '@chakra-ui/react';
import { TbAlertTriangle } from 'react-icons/tb';
import { FIELD_LABEL, NAKED_INPUT } from '../../../lib/invoiceConstants';

const CancelInvoiceModal = ({ isOpen, onClose, invoice, onConfirm, processing }) => {
  const [typedConfirm, setTypedConfirm] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setTypedConfirm('');
      setReason('');
    }
  }, [isOpen]);

  const canConfirm = typedConfirm === 'CANCEL';

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(8px)" />
      <ModalContent
        bg="surface.950"
        border="1px solid"
        borderColor="red.900"
        borderRadius="2xl"
        mx={4}
      >
        <ModalHeader pb={2} pt={6} px={6}>
          <HStack spacing={3}>
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bg="rgba(255,51,102,0.1)"
              border="1px solid rgba(255,51,102,0.3)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={TbAlertTriangle} boxSize={4} color="red.400" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color="white" fontSize="md" fontWeight="800">
                Cancel Invoice
              </Text>
              <Text color="surface.500" fontSize="2xs" fontFamily="mono">
                {invoice?.invoice_number}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.500" top={5} right={5} />

        <ModalBody px={6} py={5}>
          <VStack spacing={5} align="stretch">
            <Text color="surface.300" fontSize="sm" lineHeight="1.6">
              This will mark the invoice as cancelled and invalidate the payment link in the client's email. The sprint history and snapshot will be preserved.
            </Text>

            <Box
              bg="rgba(255,229,0,0.04)"
              border="1px solid rgba(255,229,0,0.15)"
              borderRadius="lg"
              p={3}
            >
              <Text
                color="accent.banana"
                fontSize="2xs"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.08em"
                mb={1}
              >
                What happens
              </Text>
              <VStack align="start" spacing={1} fontSize="xs" color="surface.400">
                <Text>· Invoice hidden from all lists</Text>
                <Text>· Magic pay link in email is killed</Text>
                <Text>· Snapshot preserved for records</Text>
                <Text>· Activity log entry created</Text>
              </VStack>
            </Box>

            <Box>
              <Text {...FIELD_LABEL}>Reason (optional)</Text>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you cancelling?"
                {...NAKED_INPUT}
              />
            </Box>

            <Box>
              <Text {...FIELD_LABEL}>Type CANCEL to confirm</Text>
              <Input
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value.toUpperCase())}
                placeholder="CANCEL"
                {...NAKED_INPUT}
                fontFamily="mono"
                letterSpacing="0.1em"
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
              _hover={{ borderColor: 'surface.700', color: 'white' }}
            >
              Keep Invoice
            </Button>
            <Button
              flex={1}
              size="md"
              bg={canConfirm ? 'red.500' : 'surface.850'}
              color={canConfirm ? 'white' : 'surface.700'}
              fontWeight="700"
              borderRadius="lg"
              onClick={() => onConfirm(reason)}
              isDisabled={!canConfirm}
              isLoading={processing}
              loadingText="Cancelling"
              _hover={canConfirm ? { bg: 'red.600' } : {}}
            >
              Cancel Invoice
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CancelInvoiceModal;
