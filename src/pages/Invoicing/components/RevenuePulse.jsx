// src/pages/Invoicing/components/RevenuePulse.jsx
import { Box, HStack, Text, SimpleGrid, Spinner } from '@chakra-ui/react';

const SignalCard = ({ tag, value, label, accent, loading }) => (
  <Box
    bg="surface.900"
    border="1px solid"
    borderColor="surface.800"
    borderRadius="xl"
    p={4}
    position="relative"
    overflow="hidden"
  >
    <Box position="absolute" top={0} left={0} w="100%" h="2px" bg={accent} opacity={0.6} />
    <HStack spacing={2} mb={3}>
      <Box
        px={2}
        py={0.5}
        borderRadius="md"
        bg={`${accent}12`}
        border="1px solid"
        borderColor={`${accent}30`}
      >
        <Text
          fontSize="2xs"
          fontFamily="mono"
          fontWeight="700"
          color={accent}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {tag}
        </Text>
      </Box>
    </HStack>
    <Text color="white" fontSize="2xl" fontWeight="800" fontFamily="mono" lineHeight="1" mb={1}>
      {loading ? <Spinner size="sm" color={accent} /> : value}
    </Text>
    <Text color="surface.500" fontSize="xs" fontWeight="600">{label}</Text>
  </Box>
);

const RevenuePulse = ({ revenue, outstanding, drafts, loading }) => (
  <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
    <SignalCard
      tag="Revenue"
      value={`$${revenue.toLocaleString()}`}
      label="Collected to date"
      accent="#39FF14"
      loading={loading}
    />
    <SignalCard
      tag="Outstanding"
      value={`$${outstanding.toLocaleString()}`}
      label="Pending payment"
      accent="#FFE500"
      loading={loading}
    />
    <SignalCard
      tag="Drafts"
      value={drafts}
      label="Ready to send"
      accent="#00E5E5"
      loading={loading}
    />
  </SimpleGrid>
);

export default RevenuePulse;