// src/pages/Invoicing/components/InvoicingHeader.jsx
import { HStack, Box, Text, Button } from '@chakra-ui/react';
import { TbPlus } from 'react-icons/tb';

const InvoicingHeader = ({ count, onCreate }) => (
  <HStack justify="space-between" flexWrap="wrap" gap={3}>
    <Box>
      <Text fontSize="2xl" fontWeight="700" color="white">Invoicing</Text>
      <Text color="surface.400" fontSize="sm" mt={0.5}>
        {count} total invoices
      </Text>
    </Box>
    <Button
      leftIcon={<TbPlus />}
      size="sm"
      bg="accent.neon"
      color="surface.950"
      fontWeight="700"
      borderRadius="lg"
      _hover={{ bg: '#2EE60D', transform: 'translateY(-1px)' }}
      onClick={onCreate}
    >
      New Invoice
    </Button>
  </HStack>
);

export default InvoicingHeader;