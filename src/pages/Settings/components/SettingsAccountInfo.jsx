// src/pages/Settings/components/SettingsAccountInfo.jsx
import { VStack, HStack, Text, Box, Icon, Divider } from '@chakra-ui/react';
import { TbCalendar, TbClock, TbShield, TbId } from 'react-icons/tb';
import { format } from 'date-fns';

const InfoRow = ({ icon, label, value, mono = false }) => (
  <HStack
    justify="space-between"
    py={3}
    px={3}
    borderRadius="lg"
    transition="all 0.15s"
    _hover={{ bg: 'rgba(255,255,255,0.02)' }}
  >
    <HStack spacing={2.5}>
      <Icon as={icon} boxSize={3.5} color="surface.600" />
      <Text color="surface.500" fontSize="xs" fontWeight="600">{label}</Text>
    </HStack>
    <Text
      color="white"
      fontSize="xs"
      fontWeight="700"
      fontFamily={mono ? 'mono' : undefined}
    >
      {value}
    </Text>
  </HStack>
);

const SettingsAccountInfo = ({ user, profile }) => {
  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), 'MMM d, yyyy')
    : '—';

  const lastLogin = user?.last_sign_in_at
    ? format(new Date(user.last_sign_in_at), 'MMM d · h:mm a')
    : 'first session';

  const userId = user?.id ? `${user.id.slice(0, 8)}...` : '—';

  return (
    <VStack spacing={4} align="stretch">
      <HStack spacing={2.5} px={1}>
        <Box w="6px" h="6px" borderRadius="full" bg="surface.500" />
        <Text
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="surface.500"
          fontFamily="mono"
        >
          Account Info
        </Text>
      </HStack>

      <VStack spacing={0} align="stretch" divider={<Divider borderColor="surface.850" />}>
        <InfoRow
          icon={TbShield}
          label="Role"
          value={profile?.role?.toUpperCase() || 'STAFF'}
          mono
        />
        <InfoRow
          icon={TbCalendar}
          label="Member since"
          value={memberSince}
        />
        <InfoRow
          icon={TbClock}
          label="Last login"
          value={lastLogin}
        />
        <InfoRow
          icon={TbId}
          label="User ID"
          value={userId}
          mono
        />
      </VStack>
    </VStack>
  );
};

export default SettingsAccountInfo;