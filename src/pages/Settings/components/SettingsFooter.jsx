// src/pages/Settings/components/SettingsFooter.jsx
import { HStack, Text } from '@chakra-ui/react';

const SettingsFooter = ({ user }) => {
  const lastLogin = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <HStack justify="space-between" pt={2} pb={4}>
      {lastLogin && (
        <Text fontSize="xs" color="surface.600" fontFamily="mono">
          Last login {lastLogin}
        </Text>
      )}
      <Text fontSize="xs" color="surface.700" fontFamily="mono">
        PULSE v1.0
      </Text>
    </HStack>
  );
};

export default SettingsFooter;