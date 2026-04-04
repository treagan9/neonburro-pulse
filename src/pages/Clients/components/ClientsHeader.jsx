// src/pages/Clients/components/ClientsHeader.jsx
import { HStack, Box, Text, Button } from '@chakra-ui/react';
import { TbPlus } from 'react-icons/tb';

const ClientsHeader = ({ counts, onAdd }) => (
  <HStack justify="space-between" flexWrap="wrap" gap={3}>
    <Box>
      <Text fontSize="2xl" fontWeight="700" color="white">Clients</Text>
      <Text color="surface.400" fontSize="sm" mt={0.5}>
        {counts.active} active, {counts.all} total
      </Text>
    </Box>
    <Button
      leftIcon={<TbPlus />}
      size="sm"
      bg="brand.500"
      color="surface.950"
      fontWeight="700"
      borderRadius="lg"
      _hover={{ bg: 'brand.400', transform: 'translateY(-1px)' }}
      onClick={onAdd}
    >
      Add Client
    </Button>
  </HStack>
);

export default ClientsHeader;