// src/pages/Invoicing/components/InvoicePreview.jsx
// Shows exactly what the client sees in their portal and email

import {
  Box, VStack, HStack, Text, Badge, Divider, Icon,
} from '@chakra-ui/react';
import { TbCheck, TbClock } from 'react-icons/tb';

const currency = (val) => {
  const num = parseFloat(val || 0);
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const FUNDING_MODE_LABELS = {
  pay_full: 'Fund in Full',
  deposit_50: '50% to Start',
  approve_only: 'Confirm Scope',
};

const FUNDING_MODE_COLORS = {
  pay_full: '#39FF14',
  deposit_50: '#FFE500',
  approve_only: '#737373',
};

const SprintCard = ({ sprint }) => {
  const isPaid = sprint.payment_status === 'paid' || sprint.locked;
  const mode = sprint.payment_mode || 'approve_only';
  const modeColor = FUNDING_MODE_COLORS[mode];
  const modeLabel = FUNDING_MODE_LABELS[mode];
  const amount = parseFloat(sprint.amount || 0);

  const dueNow =
    mode === 'pay_full' ? amount :
    mode === 'deposit_50' ? amount * 0.5 :
    0;

  return (
    <Box
      border="1px solid"
      borderColor={isPaid ? 'rgba(57,255,20,0.25)' : 'surface.800'}
      bg={isPaid ? 'rgba(57,255,20,0.03)' : 'surface.900'}
      borderRadius="xl"
      p={5}
      position="relative"
    >
      {isPaid && (
        <Box position="absolute" top={3} right={3}>
          <HStack
            spacing={1}
            bg="rgba(57,255,20,0.15)"
            border="1px solid rgba(57,255,20,0.4)"
            borderRadius="full"
            px={2}
            py={0.5}
          >
            <Icon as={TbCheck} boxSize={2.5} color="accent.neon" />
            <Text color="accent.neon" fontSize="2xs" fontWeight="800" letterSpacing="0.05em">
              PAID
            </Text>
          </HStack>
        </Box>
      )}

      <Text color="surface.600" fontSize="2xs" fontFamily="mono" fontWeight="700" mb={1}>
        {sprint.sprint_number || 'SPRINT'}
      </Text>
      <Text color="white" fontSize="md" fontWeight="700" mb={sprint.description ? 2 : 3}>
        {sprint.title || 'Untitled Sprint'}
      </Text>

      {sprint.description && (
        <Text color="surface.400" fontSize="sm" lineHeight="1.6" mb={3}>
          {sprint.description}
        </Text>
      )}

      <Badge
        fontSize="2xs"
        fontWeight="700"
        px={2.5}
        py={0.5}
        borderRadius="full"
        bg={`${modeColor}12`}
        color={modeColor}
        border="1px solid"
        borderColor={`${modeColor}30`}
        mb={3}
      >
        {modeLabel}
      </Badge>

      <Divider borderColor="surface.800" />

      <HStack justify="space-between" pt={3}>
        <Text color="surface.500" fontSize="xs">Sprint value</Text>
        <Text color="white" fontSize="sm" fontWeight="700" fontFamily="mono">
          {currency(amount)}
        </Text>
      </HStack>

      {dueNow > 0 && !isPaid && (
        <HStack justify="space-between" mt={1}>
          <Text color="surface.500" fontSize="xs">To push forward</Text>
          <Text color="accent.banana" fontSize="md" fontWeight="800" fontFamily="mono">
            {currency(dueNow)}
          </Text>
        </HStack>
      )}
    </Box>
  );
};

const InvoicePreview = ({ invoice, client, sprints }) => {
  if (!client || sprints.length === 0) {
    return (
      <Box py={16} textAlign="center">
        <VStack spacing={3}>
          <Icon as={TbClock} boxSize={10} color="surface.700" />
          <Text color="surface.500" fontSize="sm">
            {!client ? 'Select a client to see the preview' : 'Add sprints to see the preview'}
          </Text>
        </VStack>
      </Box>
    );
  }

  const totalValue = sprints.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
  const totalDueNow = sprints.reduce((sum, s) => {
    const amount = parseFloat(s.amount || 0);
    const mode = s.payment_mode || 'approve_only';
    if (mode === 'pay_full') return sum + amount;
    if (mode === 'deposit_50') return sum + amount * 0.5;
    return sum;
  }, 0);

  return (
    <VStack spacing={6} align="stretch">
      <HStack spacing={2} justify="center" pb={2}>
        <Box w="6px" h="6px" borderRadius="full" bg="brand.500" />
        <Text
          fontSize="2xs"
          color="brand.500"
          fontWeight="700"
          letterSpacing="0.12em"
          textTransform="uppercase"
          fontFamily="mono"
        >
          Client Preview
        </Text>
      </HStack>

      <Box
        bg="surface.950"
        border="1px solid"
        borderColor="surface.800"
        borderRadius="2xl"
        overflow="hidden"
      >
        <Box p={8} textAlign="center" borderBottom="1px solid" borderColor="surface.900">
          <Text fontSize="xs" color="brand.500" fontWeight="700" letterSpacing="0.15em" textTransform="uppercase" mb={2}>
            Your Sprints
          </Text>
          <Text color="white" fontSize="2xl" fontWeight="800" letterSpacing="-0.02em" mb={1}>
            Hi {client.name?.split(' ')[0] || 'there'}
          </Text>
          <Text color="surface.500" fontSize="sm">
            {sprints.length} sprint{sprints.length !== 1 ? 's' : ''} ready for your review
          </Text>
        </Box>

        <VStack spacing={4} p={6} align="stretch">
          {sprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </VStack>

        <Box p={6} borderTop="1px solid" borderColor="surface.900">
          <HStack justify="space-between" mb={2}>
            <Text color="surface.500" fontSize="sm">Total Project Value</Text>
            <Text color="white" fontSize="md" fontWeight="700" fontFamily="mono">
              {currency(totalValue)}
            </Text>
          </HStack>
          {totalDueNow > 0 && (
            <HStack justify="space-between">
              <Text color="surface.400" fontSize="sm" fontWeight="700">To Push Forward</Text>
              <Text color="accent.banana" fontSize="xl" fontWeight="800" fontFamily="mono">
                {currency(totalDueNow)}
              </Text>
            </HStack>
          )}
        </Box>

        <Box p={6} textAlign="center" borderTop="1px solid" borderColor="surface.900">
          <Box
            display="inline-block"
            bg="brand.500"
            color="surface.950"
            fontWeight="800"
            fontSize="sm"
            px={10}
            py={4}
            borderRadius="full"
            boxShadow="0 8px 24px rgba(0,229,229,0.3)"
          >
            Approve and Push Forward
          </Box>
          <Text color="surface.600" fontSize="2xs" mt={4}>
            Real people. Clear responses.
          </Text>
          <Text color="surface.700" fontSize="2xs" mt={1}>
            Neon Burro · Powered by The Burroship, LLC
          </Text>
        </Box>
      </Box>

      <Text color="surface.700" fontSize="2xs" fontFamily="mono" textAlign="center">
        This is exactly what {client.name?.split(' ')[0]} will see in their portal and email
      </Text>
    </VStack>
  );
};

export default InvoicePreview;