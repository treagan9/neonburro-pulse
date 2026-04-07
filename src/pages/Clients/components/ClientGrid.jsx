// src/pages/Clients/components/ClientGrid.jsx
import {
  Box, VStack, HStack, Text, SimpleGrid, Icon, Badge,
  Center, Spinner, Divider, Button, Wrap, WrapItem,
} from '@chakra-ui/react';
import {
  TbUsers, TbMail, TbPhone, TbBuilding, TbBolt,
  TbCash, TbWorld,
} from 'react-icons/tb';
import { format } from 'date-fns';
import { formatPhoneDisplay, getInitials, getAvatarColor, timeAgo } from '../../../utils/phone';

const STATUS_CONFIG = {
  active:   { label: 'Active',   bg: 'rgba(57,255,20,0.08)',    border: 'rgba(57,255,20,0.25)',   color: '#39FF14',    accent: '#39FF14' },
  lead:     { label: 'Lead',     bg: 'rgba(255,229,0,0.08)',    border: 'rgba(255,229,0,0.25)',   color: '#FFE500',    accent: '#FFE500' },
  inactive: { label: 'Inactive', bg: 'rgba(128,128,128,0.08)',  border: 'rgba(128,128,128,0.25)', color: '#737373',    accent: '#737373' },
};

const TAG_COLORS = {
  local: '#00E5E5',
  recurring: '#39FF14',
  vip: '#FFE500',
  lab: '#8B5CF6',
  hosting: '#06B6D4',
  web3: '#EC4899',
  subscription: '#FF6B35',
};

const currency = (val) => `$${parseFloat(val || 0).toLocaleString()}`;

const ClientCard = ({ client, onEdit }) => {
  const config = STATUS_CONFIG[client.status] || STATUS_CONFIG.active;
  const initials = getInitials(client.name);
  const avatarColor = getAvatarColor(client.name);

  const sprintCount = client.sprint_count || 0;
  const totalFunded = client.total_funded || 0;
  const lastActivity = client.last_activity_at || client.created_at;

  return (
    <Box
      bg="surface.900"
      border="1px solid"
      borderColor="surface.800"
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.2s"
      cursor="pointer"
      onClick={() => onEdit(client)}
      _hover={{
        borderColor: avatarColor,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 24px ${avatarColor}15`,
      }}
      position="relative"
    >
      {/* Status accent line */}
      <Box h="2px" bg={config.accent} />

      <Box p={4}>
        {/* Header: Avatar + Name + Status */}
        <HStack spacing={3} align="start" mb={3}>
          <Box
            w="44px"
            h="44px"
            borderRadius="full"
            bg={avatarColor}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            border="2px solid"
            borderColor={`${avatarColor}40`}
            boxShadow={`0 0 20px ${avatarColor}20`}
          >
            <Text color="surface.950" fontSize="sm" fontWeight="800" letterSpacing="-0.02em">
              {initials}
            </Text>
          </Box>
          <VStack align="start" spacing={0} flex={1} minW={0}>
            <HStack w="100%" justify="space-between" align="start">
              <Text color="white" fontSize="sm" fontWeight="800" noOfLines={1} flex={1}>
                {client.name}
              </Text>
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
                flexShrink={0}
                ml={2}
              >
                {config.label}
              </Badge>
            </HStack>
            {client.company && (
              <HStack spacing={1.5} mt={0.5}>
                <Icon as={TbBuilding} boxSize={3} color="surface.500" />
                <Text color="surface.400" fontSize="xs" noOfLines={1}>{client.company}</Text>
              </HStack>
            )}
          </VStack>
        </HStack>

        {/* Sprint stats row */}
        <HStack
          spacing={3}
          py={2.5}
          px={3}
          bg="surface.850"
          border="1px solid"
          borderColor="surface.800"
          borderRadius="lg"
          mb={3}
        >
          <HStack spacing={1.5} flex={1}>
            <Icon as={TbBolt} boxSize={3.5} color="accent.neon" />
            <VStack align="start" spacing={0}>
              <Text color="white" fontSize="sm" fontWeight="800" lineHeight="1" fontFamily="mono">
                {sprintCount}
              </Text>
              <Text color="surface.600" fontSize="2xs" fontWeight="600">
                sprint{sprintCount !== 1 ? 's' : ''}
              </Text>
            </VStack>
          </HStack>
          <Divider orientation="vertical" h="24px" borderColor="surface.700" />
          <HStack spacing={1.5} flex={1}>
            <Icon as={TbCash} boxSize={3.5} color="accent.banana" />
            <VStack align="start" spacing={0}>
              <Text color="white" fontSize="sm" fontWeight="800" lineHeight="1" fontFamily="mono">
                {currency(totalFunded)}
              </Text>
              <Text color="surface.600" fontSize="2xs" fontWeight="600">
                funded
              </Text>
            </VStack>
          </HStack>
        </HStack>

        {/* Contact details */}
        <VStack align="start" spacing={1.5} mb={3}>
          {client.email && (
            <HStack spacing={1.5}>
              <Icon as={TbMail} boxSize={3} color="surface.600" />
              <Text color="surface.400" fontSize="xs" noOfLines={1}>{client.email}</Text>
            </HStack>
          )}
          {client.phone && (
            <HStack spacing={1.5}>
              <Icon as={TbPhone} boxSize={3} color="surface.600" />
              <Text color="surface.400" fontSize="xs" fontFamily="mono">
                {formatPhoneDisplay(client.phone)}
              </Text>
            </HStack>
          )}
          {client.website && (
            <HStack spacing={1.5}>
              <Icon as={TbWorld} boxSize={3} color="surface.600" />
              <Text color="surface.400" fontSize="xs" noOfLines={1}>{client.website}</Text>
            </HStack>
          )}
        </VStack>

        {/* Tags / Signal stickers */}
        {client.tags && client.tags.length > 0 && (
          <Wrap spacing={1} mb={3}>
            {client.tags.slice(0, 4).map((tag) => {
              const color = TAG_COLORS[tag] || '#737373';
              return (
                <WrapItem key={tag}>
                  <Box
                    px={1.5}
                    py={0.5}
                    borderRadius="full"
                    bg={`${color}12`}
                    border="1px solid"
                    borderColor={`${color}30`}
                  >
                    <Text fontSize="2xs" color={color} fontWeight="700" textTransform="uppercase" letterSpacing="0.02em">
                      {tag}
                    </Text>
                  </Box>
                </WrapItem>
              );
            })}
            {client.tags.length > 4 && (
              <WrapItem>
                <Text fontSize="2xs" color="surface.600" px={1.5} py={0.5}>
                  +{client.tags.length - 4}
                </Text>
              </WrapItem>
            )}
          </Wrap>
        )}

        {/* Footer: Last activity */}
        <HStack
          justify="space-between"
          pt={2.5}
          borderTop="1px solid"
          borderColor="surface.800"
        >
          <Text color="surface.600" fontSize="2xs" fontFamily="mono">
            Active {timeAgo(lastActivity)}
          </Text>
          {client.portal_pin && (
            <Text color="surface.700" fontSize="2xs" fontFamily="mono" letterSpacing="0.1em">
              PIN · {client.portal_pin}
            </Text>
          )}
        </HStack>
      </Box>
    </Box>
  );
};

const ClientGrid = ({ clients, loading, onEdit, onAdd, isEmpty }) => {
  if (loading) {
    return (
      <Center py={12}>
        <VStack spacing={3}>
          <Spinner size="lg" color="brand.500" thickness="3px" />
          <Text color="surface.500" fontSize="xs">Loading clients</Text>
        </VStack>
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
        p={12}
        textAlign="center"
      >
        <VStack spacing={3}>
          <Box
            w="60px"
            h="60px"
            borderRadius="full"
            bg="surface.850"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={TbUsers} boxSize={7} color="surface.600" />
          </Box>
          <VStack spacing={1}>
            <Text color="white" fontSize="md" fontWeight="700">
              {isEmpty ? 'No clients yet' : 'No matches'}
            </Text>
            <Text color="surface.500" fontSize="xs">
              {isEmpty
                ? 'Start by adding your first client to the herd'
                : 'Try a different search or filter'}
            </Text>
          </VStack>
          {isEmpty && (
            <Button
              size="sm"
              bg="brand.500"
              color="surface.950"
              fontWeight="700"
              borderRadius="lg"
              onClick={onAdd}
              mt={2}
              _hover={{ bg: 'brand.400', transform: 'translateY(-1px)' }}
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