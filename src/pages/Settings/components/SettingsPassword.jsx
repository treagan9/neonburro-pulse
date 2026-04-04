// src/pages/Settings/components/SettingsPassword.jsx
import { useState } from 'react';
import {
  VStack, HStack, Text, Input, Button, FormControl,
  FormLabel, Icon, useToast,
} from '@chakra-ui/react';
import { TbLock, TbCheck } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';

const FieldInput = ({ label, ...props }) => (
  <FormControl>
    <FormLabel fontSize="xs" fontWeight="600" color="surface.500" mb={1.5}>
      {label}
    </FormLabel>
    <Input
      bg="transparent"
      border="1px solid"
      borderColor="surface.700"
      color="white"
      fontSize="sm"
      h="44px"
      borderRadius="xl"
      _hover={{ borderColor: 'surface.500' }}
      _focus={{
        borderColor: 'accent.banana',
        boxShadow: '0 0 0 1px #FFE500',
      }}
      _placeholder={{ color: 'surface.600', fontSize: 'sm' }}
      {...props}
    />
  </FormControl>
);

const SettingsPassword = ({ user }) => {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [changed, setChanged] = useState(false);

  const handleChange = async () => {
    setChanged(false);

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Must be at least 6 characters',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setChanging(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect');

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setChanged(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setChanged(false), 3000);
    } catch (err) {
      toast({
        title: 'Password change failed',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setChanging(false);
    }
  };

  return (
    <VStack spacing={5} align="stretch">
      <HStack spacing={2}>
        <Icon as={TbLock} boxSize={4} color="accent.banana" />
        <Text
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color="accent.banana"
        >
          Password
        </Text>
      </HStack>

      <FieldInput
        label="Current password"
        type="password"
        placeholder="current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
      />

      <FieldInput
        label="New password"
        type="password"
        placeholder="new password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
      />

      <FieldInput
        label="Confirm new password"
        type="password"
        placeholder="confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
      />

      <Button
        w="100%"
        h="44px"
        borderRadius="xl"
        fontSize="sm"
        fontWeight="700"
        isLoading={changing}
        loadingText="Updating..."
        onClick={handleChange}
        isDisabled={!currentPassword || !newPassword || !confirmPassword}
        leftIcon={changed ? <TbCheck /> : undefined}
        bg={changed ? 'accent.neon' : 'accent.banana'}
        color="surface.950"
        _hover={{
          bg: changed ? 'accent.neon' : '#E6CE00',
          transform: 'translateY(-1px)',
        }}
        _active={{ transform: 'translateY(0)' }}
        _disabled={{
          opacity: 0.3,
          cursor: 'not-allowed',
          _hover: { transform: 'none' },
        }}
      >
        {changed ? 'Password Updated' : 'Change Password'}
      </Button>
    </VStack>
  );
};

export default SettingsPassword;