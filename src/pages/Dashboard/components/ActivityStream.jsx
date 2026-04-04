// src/pages/Dashboard/components/ActivityStream.jsx
import {
  Box, VStack, HStack, Text, Icon, Center, Spinner, Divider,
} from '@chakra-ui/react';
import {
  TbPlus, TbEdit, TbTrash, TbMail, TbCheck, TbUser,
  TbActivity, TbRocket, TbLock,
} from 'react-icons/tb';
import { formatDistanceToNow } from 'date-fns';

const ACTIVITY_MAP = {
  client_created:  { icon: TbPlus,   color: '#39FF14', label: 'client added' },
  client_updated:  { icon: TbEdit,   color: '#00E5E5', label: 'client updated' },
  client_deleted:  { icon: TbTrash,  color: '#FF3366', label: 'client removed' },
  project_created: { icon: TbRocket, color: '#8B5CF6', label: 'project created' },
  project_updated: { icon: TbEdit,   color: '#8B5CF6', label: 'project updated' },
  project_deleted: { icon: TbTrash,  color: '#FF3366', label: 'project removed' },
  invoice_sent:    { icon: TbMail,   color: '#00E5E5', label: 'invoice sent' },
  invoice_paid:    { icon: TbCheck,  color: '#39FF14', label: 'payment received' },
  login:           { icon: TbUser,   color: '#737373', label: 'signed in' },
  password_changed:{ icon: TbLock,   color: '#FFE500', label: 'password changed' },
};

const ActivityItem = ({ activity }) => {
  const config = ACTIVITY_MAP[activity.action] || { icon: TbActivity, color: '#737373', label: activity.action?.replace(/_/g, ' ') };
  const entityName = activity.metadata?.client_name || activity.metadata?.project_name || activity.metadata?.invoice_number || '';
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

  return (
    <HStack spacing={3} py={2.5} align="start">
      <Box
        w="6px"
        h="6px"
        borderRadius="full"
        bg={config.color}
        mt={2}
        flexShrink={0}
        boxShadow={`0 0 6px ${config.color}60`}
      />
      <Box flex={1} minW={0}>
        <HStack spacing={1.5} flexWrap="wrap">
          <Text color="surface.300" fontSize="xs">
            {config.label}
          </Text>
          {entityName && (
            <Text color="white" fontSize="xs" fontWeight="700" noOfLines={1}>
              {entityName}
            </Text>
          )}
        </HStack>
        <Text color="surface.600" fontSize="2xs" fontFamily="mono" mt={0.5}>
          {timeAgo}
        </Text>
      </Box>
    </HStack>
  );
};

const ActivityStream = ({ activities, loading }) => {
  return (
    <Box
      bg="surface.900"
      border="1px solid"
      borderColor="surface.800"
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
    >
      <HStack spacing={2} mb={4}>
        <Box w="6px" h="6px" borderRadius="full" bg="brand.500" boxShadow="0 0 6px rgba(0,229,229,0.5)" />
        <Text
          color="brand.500"
          fontSize="xs"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.1em"
          fontFamily="mono"
        >
          Activity Stream
        </Text>
      </HStack>

      {loading ? (
        <Center py={6}>
          <Spinner size="sm" color="brand.500" thickness="2px" />
        </Center>
      ) : activities.length === 0 ? (
        <VStack py={6} spacing={2}>
          <Text color="surface.600" fontSize="xs" fontFamily="mono">
            No signals yet
          </Text>
          <Text color="surface.700" fontSize="2xs">
            Activity will appear here as the system runs
          </Text>
        </VStack>
      ) : (
        <VStack align="stretch" spacing={0} divider={<Divider borderColor="surface.850" />}>
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ActivityStream;