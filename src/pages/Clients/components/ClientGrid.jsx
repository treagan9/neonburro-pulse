// src/pages/Clients/components/ClientGrid.jsx
import {
  Box, VStack, HStack, Text, SimpleGrid, Icon, Badge,
  Center, Spinner, Divider, Button,
} from '@chakra-ui/react';
import { TbUsers, TbMail, TbPhone, TbBuilding } from 'react-icons/tb';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  active:   { label: 'Active',   bg: 'rgba(57,255,20,0.08)',    border: 'rgba(57,255,20,0.25)',   color: 'green.400',   accent: 'accent.neon' },
  lead:     { label: 'Lead',     bg: 'rgba(255,229,0,0.08)',    border: 'rgba(255,229,0,0.25)',   color: 'yellow.400',  accent: 'accent.banana' },
  inactive: { label: 'Inactive', bg: 'rgba(128,128,128,0.08)',  border: 'rgba(128,128,128,0.25)', color: 'surface.500', accent: 'surface.700' },
};

const ClientCard = ({ client, onEdit }) => {
  const config = STATUS_CONFIG[client.status] || STATUS_CONFIG.active;

  return (
    <Box
      bg="surface.900"
      border="1px solid"
      borderColor="surface.800"
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.15s"
      cursor="pointer"
      onClick={() => onEdit(client)}
      _hover={{
        borderColor: 'surface.600',
        transform: 'translateY(-1px)',
        shadow: '0 4px 20px rgba(0,229,229,0.06)',
      }}
    >
      <Box h="2px" bg={config.accent} />
      <Box p={4}>
        <HStack justify="space-between" align="start" mb={3}>
          <VStack align="start" spacing={0.5} flex={1} minW={0}>
            <Text color="white" fontSize="sm" fontWeight="700" noOfLines={1}>
              {client.name}
            </Text>
            {client.company && (
              <HStack spacing={1.5}>
                <Icon as={TbBuilding} boxSize={3} color="surface.500" />
                <Text color="surface.400" fontSize="xs" noOfLines={1}>{client.company}</Text>
              </HStack>
            )}
          </VStack>
          <Badge
            fontSize="2xs"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.05em"
            px={2}
            py={0.5}
            borderRadius="full"
            bg={config.bg}
            color={config.color}
            border="1px solid"
            borderColor={config.border}
          >
            {config.label}
          </Badge>
        </HStack>

        <VStack align="start" spacing={1.5}>
          {client.email && (
            <HStack spacing={1.5}>
              <Icon as={TbMail} boxSize={3} color="surface.600" />
              <Text color="surface.400" fontSize="xs" noOfLines={1}>{client.email}</Text>
            </HStack>
          )}
          {client.phone && (
            <HStack spacing={1.5}>
              <Icon as={TbPhone} boxSize={3} color="surface.600" />
              <Text color="surface.400" fontSize="xs">{client.phone}</Text>
            </HStack>
          )}
        </VStack>

        <Divider borderColor="surface.800" my={3} />

        <Text color="surface.600" fontSize="2xs" fontFamily="mono">
          {format(new Date(client.created_at), 'MMM d, yyyy')}
        </Text>
      </Box>
    </Box>
  );
};

const ClientGrid = ({ clients, loading, onEdit, onAdd, isEmpty }) => {
  if (loading) {
    return (
      <Center py={12}>
        <Spinner size="lg" color="brand.500" thickness="3px" />
      </Center>
    );
  }

  if (clients.length === 0) {
    return (
      <Box
        bg="surface.900"
        border="1px dashed"
        borderColor="surface.700"
        borderRadius="xl"
        p={8}
        textAlign="center"
      >
        <VStack spacing={2}>
          <Icon as={TbUsers} boxSize={8} color="surface.600" />
          <Text color="surface.400" fontSize="sm">
            {isEmpty ? 'No clients yet' : 'No clients match your search'}
          </Text>
          {isEmpty && (
            <Button
              size="sm"
              variant="outline"
              borderColor="brand.500"
              color="brand.500"
              onClick={onAdd}
              mt={2}
            >
              Add your first client
            </Button>
          )}
        </VStack>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={3}>
      {clients.map((client) => (
        <ClientCard key={client.id} client={client} onEdit={onEdit} />
      ))}
    </SimpleGrid>
  );
};

export default ClientGrid;