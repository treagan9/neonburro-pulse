// src/pages/Settings/components/SettingsAccountInfo.jsx
import { VStack, HStack, Text, Box, Icon, Divider } from '@chakra-ui/react';
import { TbInfoCircle, TbCalendar, TbClock, TbShield, TbId } from 'react-icons/tb';
import { format } from 'date-fns';

const InfoRow = ({ icon, label, value, mono = false }) => (
  <HStack justify="space-between" py={2}>
    <HStack spacing={2}>
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
    <Box
      bg="surface.900"
      border="1px solid"
      borderColor="surface.800"
      borderRadius="2xl"
      p={5}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        right={0}
        w="200px"
        h="200px"
        bg="radial-gradient(circle at top right, rgba(115,115,115,0.05), transparent 60%)"
        pointerEvents="none"
      />

      <VStack spacing={3} align="stretch" position="relative">
        <HStack spacing={2}>
          <Box w="6px" h="6px" borderRadius="full" bg="surface.500" />
          <Text
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.12em"
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
    </Box>
  );
};

export default SettingsAccountInfo;