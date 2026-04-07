// src/pages/Invoicing/components/InvoicePreview.jsx
import { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, Button, VStack, HStack, Box, Text,
  useToast, Badge, Icon, Image, Divider,
} from '@chakra-ui/react';
import { TbMail, TbX, TbCheck, TbAlertTriangle, TbBolt, TbLock } from 'react-icons/tb';

const getDueNow = (item) => {
  const amount = parseFloat(item.amount || 0);
  const mode = item.payment_mode || 'approve_only';
  if (mode === 'pay_full') return amount;
  if (mode === 'deposit_50') return amount * 0.5;
  return 0;
};

const getFundingLabel = (mode) => {
  if (mode === 'deposit_50') return '50% to Start';
  if (mode === 'pay_full') return 'Fund in Full';
  return 'Confirm Scope';
};

const getFundingColor = (mode) => {
  if (mode === 'pay_full') return '#39FF14';
  if (mode === 'deposit_50') return '#FFE500';
  return '#737373';
};

const currency = (val) => `$${parseFloat(val || 0).toLocaleString()}`;

const InvoicePreview = ({ isOpen, onClose, invoice, onSent }) => {
  const toast = useToast();
  const [sending, setSending] = useState(false);

  if (!invoice) return null;

  const sprints = invoice.line_items || invoice.invoice_items || [];
  const totalAmount = sprints.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  const totalDueNow = sprints.reduce((sum, i) => sum + getDueNow(i), 0);
  const invoiceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleSend = async () => {
    setSending(true);
    try {
      const response = await fetch('/.netlify/functions/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to send invoice');
      }

      const result = await response.json();

      toast({
        title: 'Invoice sent',
        description: `${result.invoiceNumber} sent to ${invoice.client_name || 'client'}`,
        status: 'success',
        duration: 4000,
      });

      if (onSent) onSent();
      onClose();
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
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent bg="surface.950" border="1px solid" borderColor="surface.800" mx={4}>

        <ModalHeader borderBottom="1px solid" borderColor="surface.800" py={3}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Text color="white" fontSize="md" fontWeight="700">Invoice Preview</Text>
              <Badge fontSize="2xs" fontFamily="mono" bg="surface.800" color="brand.500" px={2}>
                {invoice.invoice_number || 'DRAFT'}
              </Badge>
            </HStack>
            <Button leftIcon={<TbX />} onClick={onClose} variant="ghost" size="sm" color="surface.400">
              Close
            </Button>
          </HStack>
        </ModalHeader>

        <ModalBody py={4} px={4}>

          {/* Send-to info */}
          {invoice.client_name && (
            <HStack
              spacing={2}
              bg="surface.900"
              border="1px solid"
              borderColor="surface.800"
              borderRadius="lg"
              px={4}
              py={3}
              mb={4}
            >
              <Icon as={TbMail} color="brand.500" boxSize={4} />
              <Text color="white" fontSize="sm" fontWeight="600">{invoice.client_name}</Text>
              {invoice.client_email && (
                <Text color="surface.400" fontSize="xs">{invoice.client_email}</Text>
              )}
            </HStack>
          )}

          {/* Email preview */}
          <Box bg="#000000" borderRadius="xl" p={3}>
            <Box bg="#0A0A0A" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="#1f1f1f" maxW="560px" mx="auto">

              {/* Hero */}
              <Image src="/cimarron-range-neon.png" alt="NeonBurro" w="100%" maxH="180px" objectFit="cover" />

              {/* Content */}
              <Box px={{ base: 4, md: 8 }} py={6}>

                {/* Logo + tag */}
                <HStack justify="space-between" mb={5}>
                  <Image src="/neon-burro-email-logo.png" alt="NeonBurro" w="44px" h="44px" borderRadius="full" />
                  <Text color="brand.500" fontSize="2xs" fontWeight="700" letterSpacing="0.15em" textTransform="uppercase">
                    Invoice
                  </Text>
                </HStack>

                <Box w="40px" h="2px" bg="brand.500" mb={4} borderRadius="full" />

                <Text color="white" fontSize="xl" fontWeight="800" mb={1}>
                  {invoice.invoice_number || 'Draft'}
                </Text>
                <Text color="surface.500" fontSize="xs" mb={1}>{invoiceDate}</Text>
                <Text color="surface.600" fontSize="2xs" mb={5}>
                  Issued by <Text as="span" color="surface.400" fontWeight="600">The Burroship, LLC</Text>
                </Text>

                {/* Meta */}
                <Box bg="surface.900" border="1px solid" borderColor="surface.800" borderRadius="lg" p={4} mb={5}>
                  <VStack align="start" spacing={2}>
                    <Box>
                      <Text color="surface.500" fontSize="2xs" textTransform="uppercase" letterSpacing="0.08em" mb={0.5}>Prepared For</Text>
                      <Text color="white" fontSize="sm" fontWeight="700">{invoice.client_name || 'Client'}</Text>
                    </Box>
                    {invoice.project_name && (
                      <Box>
                        <Text color="surface.500" fontSize="2xs" textTransform="uppercase" letterSpacing="0.08em" mb={0.5}>Project</Text>
                        <Text color="white" fontSize="sm" fontWeight="600">{invoice.project_name}</Text>
                        {invoice.project_number && (
                          <Text color="brand.500" fontSize="xs" fontFamily="mono" mt={0.5}>{invoice.project_number}</Text>
                        )}
                      </Box>
                    )}
                  </VStack>
                </Box>

                {/* Sprints */}
                <Text color="brand.500" fontSize="2xs" fontWeight="700" letterSpacing="0.15em" textTransform="uppercase" mb={2}>
                  Sprints
                </Text>

                <Box border="1px solid" borderColor="surface.800" borderRadius="lg" overflow="hidden" mb={5}>
                  {sprints.map((sprint, idx) => {
                    const amount = parseFloat(sprint.amount || 0);
                    const dueNow = getDueNow(sprint);
                    const mode = sprint.payment_mode || 'approve_only';
                    const modeColor = getFundingColor(mode);
                    const isLocked = sprint.locked || sprint.payment_status === 'paid';

                    return (
                      <Box key={idx} px={4} py={3.5} borderBottom="1px solid" borderColor="surface.800" position="relative">
                        {isLocked && (
                          <Box position="absolute" top={3} right={3}>
                            <HStack spacing={1} bg="rgba(57,255,20,0.15)" border="1px solid rgba(57,255,20,0.4)" borderRadius="full" px={2} py={0.5}>
                              <Icon as={TbLock} boxSize={2.5} color="accent.neon" />
                              <Text color="accent.neon" fontSize="2xs" fontWeight="800">PAID</Text>
                            </HStack>
                          </Box>
                        )}
                        <Text color="surface.600" fontSize="2xs" fontFamily="mono" fontWeight="700" mb={0.5}>
                          {sprint.sprint_number || `SPRINT ${String(idx + 1).padStart(2, '0')}`}
                        </Text>
                        <Text color="white" fontSize="sm" fontWeight="700" mb={1}>{sprint.title}</Text>
                        {sprint.description && (
                          <Text color="surface.400" fontSize="xs" lineHeight="1.5" mb={2}>{sprint.description}</Text>
                        )}
                        <Badge
                          fontSize="2xs"
                          fontWeight="700"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          bg={`${modeColor}15`}
                          color={modeColor}
                          border="1px solid"
                          borderColor={`${modeColor}30`}
                          mb={2}
                        >
                          {getFundingLabel(mode)}
                        </Badge>
                        <Divider borderColor="surface.800" mb={2} />
                        <HStack justify="space-between">
                          <Text color="surface.500" fontSize="xs">Sprint value</Text>
                          <Text color="white" fontSize="sm" fontWeight="700" fontFamily="mono">{currency(amount)}</Text>
                        </HStack>
                        {dueNow > 0 && (
                          <HStack justify="space-between" mt={1}>
                            <Text color="surface.500" fontSize="xs">To push forward</Text>
                            <Text color="accent.banana" fontSize="sm" fontWeight="700" fontFamily="mono">{currency(dueNow)}</Text>
                          </HStack>
                        )}
                      </Box>
                    );
                  })}

                  {/* Totals */}
                  <Box bg="surface.900" px={4} py={4} borderTop="2px solid" borderColor="surface.800">
                    <HStack justify="space-between" mb={totalDueNow > 0 ? 2 : 0}>
                      <Text color="surface.400" fontSize="xs" fontWeight="600">Total Project Value</Text>
                      <Text color="white" fontSize="md" fontWeight="800" fontFamily="mono">{currency(totalAmount)}</Text>
                    </HStack>
                    {totalDueNow > 0 && (
                      <HStack justify="space-between">
                        <Text color="accent.banana" fontSize="xs" fontWeight="700">To Push Forward</Text>
                        <Text color="accent.banana" fontSize="md" fontWeight="800" fontFamily="mono">{currency(totalDueNow)}</Text>
                      </HStack>
                    )}
                  </Box>
                </Box>

                {/* CTA preview */}
                {totalDueNow > 0 ? (
                  <Box bg="surface.900" border="1px solid" borderColor="surface.800" borderRadius="lg" p={5} textAlign="center" mb={4}>
                    <Text color="surface.500" fontSize="2xs" textTransform="uppercase" letterSpacing="0.08em" mb={2}>To Push Forward</Text>
                    <Text color="accent.banana" fontSize="3xl" fontWeight="800" fontFamily="mono" mb={3}>{currency(totalDueNow)}</Text>
                    <Box display="inline-block" bg="brand.500" color="surface.950" px={8} py={3} borderRadius="full" fontWeight="800" fontSize="sm">
                      Approve and Push Forward
                    </Box>
                    <Text color="surface.600" fontSize="2xs" mt={3}>Client picks which sprints to fund</Text>
                  </Box>
                ) : (
                  <Box bg="surface.900" border="1px solid" borderColor="surface.800" borderRadius="lg" p={4} textAlign="center" mb={4}>
                    <Text color="white" fontSize="sm" fontWeight="700">Scope Confirmed</Text>
                    <Text color="surface.500" fontSize="xs">No payment due at this time</Text>
                  </Box>
                )}

                {/* Footer preview */}
                <HStack justify="space-between" pt={3} borderTop="1px solid" borderColor="surface.800">
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontSize="xs" fontWeight="700">NeonBurro</Text>
                    <Text color="surface.600" fontSize="2xs">Powered by The Burroship, LLC</Text>
                  </VStack>
                  <Image src="/main-sms-burro.webp" alt="NeonBurro" w="40px" borderRadius="md" />
                </HStack>
              </Box>
            </Box>
          </Box>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="surface.800" py={3}>
          <HStack spacing={3} w="full" justify="flex-end">
            <Button variant="ghost" onClick={onClose} isDisabled={sending} color="surface.400" size="sm">
              Cancel
            </Button>
            <Button
              leftIcon={sending ? undefined : <TbBolt />}
              bg="brand.500"
              color="surface.950"
              fontWeight="700"
              size="sm"
              onClick={handleSend}
              isLoading={sending}
              loadingText="Sending..."
              _hover={{ bg: 'brand.400', transform: 'translateY(-1px)' }}
            >
              Send Invoice{invoice.client_name ? ` to ${invoice.client_name.split(' ')[0]}` : ''}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InvoicePreview;