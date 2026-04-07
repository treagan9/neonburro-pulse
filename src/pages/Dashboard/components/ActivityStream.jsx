// src/pages/Dashboard/components/ActivityStream.jsx
import {
  Box, VStack, HStack, Text, Icon, Center, Spinner, Divider,
} from '@chakra-ui/react';
import {
  TbPlus, TbEdit, TbTrash, TbMail, TbCheck, TbUser,
  TbActivity, TbRocket, TbLock, TbBolt, TbEye,
} from 'react-icons/tb';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../../../components/common/Avatar';
import { usePresence } from '../../../hooks/usePresence';

const ACTIVITY_MAP = {
  client_created:   { icon: TbPlus,   color: '#00E5E5', verb: 'added client' },
  client_updated:   { icon: TbEdit,   color: '#00E5E5', verb: 'updated client' },
  client_deleted:   { icon: TbTrash,  color: '#FF3366', verb: 'removed client' },
  project_created:  { icon: TbRocket, color: '#8B5CF6', verb: 'created project' },
  project_updated:  { icon: TbEdit,   color: '#8B5CF6', verb: 'updated project' },
  project_deleted:  { icon: TbTrash,  color: '#FF3366', verb: 'removed project' },
  invoice_created:  { icon: TbBolt,   color: '#FFE500', verb: 'drafted invoice' },
  invoice_sent:     { icon: TbMail,   color: '#00E5E5', verb: 'sent invoice' },
  invoice_viewed:   { icon: TbEye,    color: '#FFE500', verb: 'opened invoice' },
  invoice_paid:     { icon: TbCheck,  color: '#39FF14', verb: 'received payment' },
  login:            { icon: TbUser,   color: '#737373', verb: 'signed in' },
  password_changed: { icon: TbLock,   color: '#FFE500', verb: 'changed password' },
};

const ActivityItem = ({ activity, profileMap }) => {
  const config = ACTIVITY_MAP[activity.action] || {
    icon: TbActivity,
    color: '#737373',
    verb: activity.action?.replace(/_/g, ' '),
  };

  const profile = activity.user_id ? profileMap[activity.user_id] : null;
  const { getStatus } = usePresence();
  const status = activity.user_id ? getStatus(activity.user_id) : null;

  const entityName =
    activity.metadata?.client_name ||
    activity.metadata?.project_name ||
    activity.metadata?.invoice_number ||
    '';

  const amount = activity.metadata?.total
    ? `$${parseFloat(activity.metadata.total).toLocaleString()}`
    : null;

  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });
  const Icon_ = config.icon;

  return (
    <HStack
      spacing={3}
      py={3}
      px={3}
      align="start"
      borderRadius="lg"
      transition="all 0.15s"
      _hover={{ bg: 'surface.850' }}
      role="group"
    >
      {/* User avatar with presence */}
      <Avatar
        name={profile?.display_name || 'System'}
        url={profile?.avatar_url}
        size="sm"
        presence={status}
      />

      <Box flex={1} minW={0}>
        <HStack spacing={1.5} flexWrap="wrap" align="center" mb={0.5}>
          <Text color="white" fontSize="xs" fontWeight="700">
            {profile?.display_name || 'System'}
          </Text>
          <Text color="surface.500" fontSize="xs">{config.verb}</Text>
          {entityName && (
            <Box
              px={1.5}
              py={0.5}
              borderRadius="md"
              bg={`${config.color}10`}
              border="1px solid"
              borderColor={`${config.color}25`}
              transition="all 0.2s"
              _groupHover={{ bg: `${config.color}18`, borderColor: `${config.color}40` }}
            >
              <Text color={config.color} fontSize="2xs" fontWeight="700" fontFamily="mono">
                {entityName}
              </Text>
            </Box>
          )}
          {amount && (
            <Text color="accent.neon" fontSize="xs" fontWeight="700" fontFamily="mono">
              {amount}
            </Text>
          )}
        </HStack>
        <HStack spacing={1.5}>
          <Icon as={Icon_} boxSize={2.5} color="surface.600" />
          <Text color="surface.600" fontSize="2xs" fontFamily="mono">
            {timeAgo}
          </Text>
        </HStack>
      </Box>
    </HStack>
  );
};

const ActivityStream = ({ activities, profileMap = {}, loading }) => {
  return (
    <Box
      bg="surface.900"
      border="1px solid"
      borderColor="surface.800"
      borderRadius="2xl"
      p={{ base: 4, md: 5 }}
      position="relative"
      overflow="hidden"
    >
      {/* Subtle ambient gradient */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="120px"
        bg="radial-gradient(ellipse at top left, rgba(0,229,229,0.04), transparent 60%)"
        pointerEvents="none"
      />

      <HStack spacing={2} mb={4} position="relative">
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg="brand.500"
          boxShadow="0 0 8px rgba(0,229,229,0.6)"
        />
        <Text
          color="brand.500"
          fontSize="xs"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.12em"
          fontFamily="mono"
        >
          Activity Stream
        </Text>
      </HStack>

      {loading ? (
        <Center py={10} position="relative">
          <Spinner size="sm" color="brand.500" thickness="2px" />
        </Center>
      ) : activities.length === 0 ? (
        <VStack py={10} spacing={2} position="relative">
          <Icon as={TbActivity} boxSize={6} color="surface.700" />
          <Text color="surface.500" fontSize="xs" fontFamily="mono">
            No signals yet
          </Text>
          <Text color="surface.700" fontSize="2xs">
            Activity appears here as the system runs
          </Text>
        </VStack>
      ) : (
        <VStack
          align="stretch"
          spacing={1}
          position="relative"
          divider={<Divider borderColor="surface.850" />}
        >
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} profileMap={profileMap} />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ActivityStream;