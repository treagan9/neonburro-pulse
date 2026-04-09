// src/pages/Clients/components/ClientGrid.jsx
// Row-based list. Click row -> /clients/:id/ detail page
// Hover shows an edit icon that opens the modal for quick edits

import {
  Box, VStack, HStack, Text, Icon, Center, Spinner, Button,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { TbUsers, TbBolt, TbFolder, TbEdit } from 'react-icons/tb';
import { getInitials, getAvatarColor, timeAgo } from '../../../utils/phone';

const STATUS_DOT = {
  active:   '#39FF14',
  lead:     '#FFE500',
  inactive: '#737373',
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

const currency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
};

const ClientRow = ({ client, onEdit }) => {
  const navigate = useNavigate();
  const initials = getInitials(client.name);
  const avatarColor = getAvatarColor(client.name);
  const statusColor = STATUS_DOT[client.status] || STATUS_DOT.active;
  const sprintCount = client.sprint_count || 0;
  const projectCount = client.project_count || 0;
  const totalFunded = client.total_funded || 0;
  const tags = client.tags || [];

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(client);
  };

  return (
    <Box
      py={3.5}
      pl={4}
      pr={4}
      borderBottom="1px solid"
      borderColor="surface.900"
      borderLeft="2px solid"
      borderLeftColor="transparent"
      cursor="pointer"
      transition="all 0.15s ease-out"
      role="group"
      onClick={() => navigate(`/clients/${client.id}/`)}
      _hover={{
        borderLeftColor: avatarColor,
        bg: 'rgba(255,255,255,0.015)',
        transform: 'translateX(2px)',
      }}
    >
      <HStack spacing={4} align="center">
        {/* Status dot */}
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg={statusColor}
          boxShadow={client.status === 'active' ? `0 0 8px ${statusColor}80` : 'none'}
          flexShrink={0}
        />

        {/* Avatar */}
        <Box
          w="36px"
          h="36px"
          borderRadius="full"
          bg={avatarColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          transition="all 0.15s"
          _groupHover={{ boxShadow: `0 0 16px ${avatarColor}40` }}
        >
          <Text color="surface.950" fontSize="xs" fontWeight="800" letterSpacing="-0.02em">
            {initials}
          </Text>
        </Box>

        {/* Name + company + tags */}
        <VStack align="start" spacing={0} flex={1} minW={0}>
          <HStack spacing={2}>
            <Text color="white" fontSize="sm" fontWeight="700" noOfLines={1}>
              {client.name}
            </Text>
            {tags.length > 0 && (
              <HStack spacing={1}>
                {tags.slice(0, 3).map((tag) => (
                  <Box
                    key={tag}
                    w="5px"
                    h="5px"
                    borderRadius="full"
                    bg={TAG_COLORS[tag] || '#737373'}
                  />
                ))}
                {tags.length > 3 && (
                  <Text fontSize="2xs" color="surface.600" fontFamily="mono">
                    +{tags.length - 3}
                  </Text>
                )}
              </HStack>
            )}
          </HStack>
          <HStack spacing={1.5}>
            {client.company && (
              <Text color="surface.500" fontSize="xs" noOfLines={1}>
                {client.company}
              </Text>
            )}
            {!client.company && client.email && (
              <Text color="surface.500" fontSize="xs" noOfLines={1}>
                {client.email}
              </Text>
            )}
          </HStack>
        </VStack>

        {/* Stats */}
        <HStack spacing={5} display={{ base: 'none', md: 'flex' }}>
          {projectCount > 0 && (
            <HStack spacing={1.5}>
              <Icon as={TbFolder} boxSize={3} color="surface.600" />
              <Text color="surface.400" fontSize="xs" fontFamily="mono" fontWeight="700">
                {projectCount}
              </Text>
            </HStack>
          )}
          <HStack spacing={1.5}>
            <Icon as={TbBolt} boxSize={3} color="surface.600" />
            <Text color="surface.400" fontSize="xs" fontFamily="mono" fontWeight="700">
              {sprintCount}
            </Text>
          </HStack>
          <Text
            color={totalFunded > 0 ? 'white' : 'surface.700'}
            fontSize="xs"
            fontFamily="mono"
            fontWeight="700"
            minW="60px"
            textAlign="right"
          >
            {currency(totalFunded)}
          </Text>
        </HStack>

        {/* Timestamp */}
        <Text
          color="surface.700"
          fontSize="2xs"
          fontFamily="mono"
          minW="60px"
          textAlign="right"
          display={{ base: 'none', lg: 'block' }}
        >
          {timeAgo(client.last_activity_at || client.created_at)}
        </Text>

        {/* Edit icon - only visible on hover */}
        <Box
          as="button"
          onClick={handleEditClick}
          opacity={0}
          color="surface.600"
          p={1}
          borderRadius="md"
          transition="all 0.15s"
          _groupHover={{ opacity: 0.6 }}
          _hover={{ opacity: '1 !important', color: 'brand.500', bg: 'surface.850' }}
        >
          <Icon as={TbEdit} boxSize={3.5} />
        </Box>
      </HStack>
    </Box>
  );
};

const ClientGrid = ({ clients, loading, onEdit, onAdd, isEmpty }) => {
  if (loading) {
    return (
      <Center py={16}>
        <VStack spacing={3}>
          <Spinner size="md" color="brand.500" thickness="2px" />
          <Text color="surface.600" fontSize="xs" fontFamily="mono">
            Loading clients
          </Text>
        </VStack>
      </Center>
    );
  }

  if (clients.length === 0) {
    return (
      <Box py={20} textAlign="center">
        <VStack spacing={4}>
          <Icon as={TbUsers} boxSize={10} color="surface.700" />
          <VStack spacing={1}>
            <Text color="white" fontSize="md" fontWeight="700">
              {isEmpty ? 'No clients yet' : 'No matches'}
            </Text>
            <Text color="surface.500" fontSize="xs">
              {isEmpty ? 'Add your first client to the herd' : 'Try a different search or filter'}
            </Text>
          </VStack>
          {isEmpty && (
            <Button
              size="sm"
              variant="outline"
              borderColor="brand.500"
              color="brand.500"
              fontWeight="700"
              borderRadius="full"
              onClick={onAdd}
              mt={2}
              _hover={{ bg: 'rgba(0,229,229,0.08)' }}
            >
              Add your first client
            </Button>
          )}
        </VStack>
      </Box>
    );
  }

  return (
    <Box borderTop="1px solid" borderColor="surface.900">
      {clients.map((client) => (
        <ClientRow key={client.id} client={client} onEdit={onEdit} />
      ))}
    </Box>
  );
};

export default ClientGrid;