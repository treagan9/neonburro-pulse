// src/pages/Invoicing/components/ReminderModal.jsx
// Compose modal for sending an editorial NeonBurro reminder.
// Pre-fills with on-brand copy, fully editable.

import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Box, VStack, HStack, Text, Icon, Input, Textarea, Button,
} from '@chakra-ui/react';
import { TbBellRinging, TbSend } from 'react-icons/tb';

const formatCurrency = (n) => {
  const num = parseFloat(n || 0);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const buildDefaultBody = ({ clientName, invoiceNumber, amountDue, daysSinceSent }) => {
  const firstName = (clientName || 'there').split(' ')[0];
  const dayContext = daysSinceSent
    ? `It's been ${daysSinceSent} day${daysSinceSent !== 1 ? 's' : ''} since we sent it over`
    : 'Just floating this back to the top';

  return `Hi ${firstName},

A gentle signal from our side. ${dayContext}, and we wanted to make sure invoice ${invoiceNumber} didn't get buried.

The amount due is ${formatCurrency(amountDue)}. The original payment link is still active below — one click and you're set.

If anything's changed on your end, or you have any questions about the work, just reply to this email and we'll sort it out together.

Thanks for being part of the journey.`;
};

const ReminderModal = ({
  isOpen,
  onClose,
  invoice,
  client,
  onSend,
  sending,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!isOpen || !invoice) return;

    const amountDue =
      parseFloat(invoice.total || 0) - parseFloat(invoice.total_paid || 0);

    let daysSinceSent = null;
    if (invoice.sent_at) {
      const ms = Date.now() - new Date(invoice.sent_at).getTime();
      daysSinceSent = Math.floor(ms / (1000 * 60 * 60 * 24));
    }

    setSubject(`A gentle reminder about ${invoice.invoice_number}`);
    setBody(buildDefaultBody({
      clientName: client?.name,
      invoiceNumber: invoice.invoice_number,
      amountDue,
      daysSinceSent,
    }));
  }, [isOpen, invoice, client]);

  const handleSend = () => {
    if (!body.trim()) return;
    onSend({ subject, body });
  };

  const amountDue = invoice
    ? parseFloat(invoice.total || 0) - parseFloat(invoice.total_paid || 0)
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(8px)" />
      <ModalContent
        bg="surface.950"
        border="1px solid"
        borderColor="surface.800"
        borderRadius="2xl"
        mx={4}
        color="white"
      >
        <ModalHeader pb={3} pt={6} px={6}>
          <HStack spacing={3}>
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bg="rgba(255,229,0,0.08)"
              border="1px solid rgba(255,229,0,0.3)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={TbBellRinging} boxSize={4} color="accent.banana" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color="white" fontSize="md" fontWeight="800">
                Send Reminder
              </Text>
              <Text color="surface.500" fontSize="2xs" fontFamily="mono">
                {invoice?.invoice_number} · {client?.name} · {formatCurrency(amountDue)} due
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.500" top={5} right={5} />

        <ModalBody px={6} py={4}>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text
                fontSize="2xs"
                fontWeight="700"
                color="surface.600"
                textTransform="uppercase"
                letterSpacing="0.1em"
                fontFamily="mono"
                mb={2}
              >
                Subject
              </Text>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                bg="surface.900"
                border="1px solid"
                borderColor="surface.800"
                color="white"
                fontSize="sm"
                _focus={{ borderColor: 'brand.500' }}
              />
            </Box>

            <Box>
              <HStack justify="space-between" mb={2}>
                <Text
                  fontSize="2xs"
                  fontWeight="700"
                  color="surface.600"
                  textTransform="uppercase"
                  letterSpacing="0.1em"
                  fontFamily="mono"
                >
                  Message
                </Text>
                <Text color="surface.700" fontSize="2xs" fontFamily="mono">
                  Editorial · NeonBurro voice · fully editable
                </Text>
              </HStack>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                bg="surface.900"
                border="1px solid"
                borderColor="surface.800"
                color="white"
                fontSize="sm"
                minH="240px"
                lineHeight={1.7}
                _focus={{ borderColor: 'brand.500' }}
              />
            </Box>

            <Box
              bg="rgba(0,229,229,0.04)"
              border="1px solid rgba(0,229,229,0.15)"
              borderRadius="lg"
              p={3}
            >
              <Text color="brand.500" fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" mb={1.5}>
                Email will include
              </Text>
              <VStack align="start" spacing={1} fontSize="xs" color="surface.400">
                <Text>· Branded NeonBurro header with logo</Text>
                <Text>· Invoice number ({invoice?.invoice_number}) and amount due ({formatCurrency(amountDue)})</Text>
                <Text>· Cyan "View &amp; Pay Invoice" CTA linking to the original pay page</Text>
                <Text>· Your name in the signature</Text>
              </VStack>
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
              isDisabled={sending}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              size="md"
              bg="accent.banana"
              color="surface.950"
              fontWeight="700"
              borderRadius="lg"
              leftIcon={<TbSend size={14} />}
              onClick={handleSend}
              isLoading={sending}
              loadingText="Sending"
              isDisabled={!body.trim()}
              _hover={{ bg: '#FFD700' }}
            >
              Send Reminder
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReminderModal;
