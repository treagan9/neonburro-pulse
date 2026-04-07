// src/pages/Settings/components/SettingsPassword.jsx
import { useState } from 'react';
import {
  VStack, HStack, Text, Input, Button, FormControl,
  FormLabel, Icon, useToast, Box, InputGroup, InputRightElement,
} from '@chakra-ui/react';
import { TbLock, TbCheck, TbEye, TbEyeOff } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';

const inputProps = {
  bg: 'transparent',
  border: '1px solid',
  borderColor: 'surface.700',
  color: 'white',
  fontSize: 'sm',
  h: '44px',
  borderRadius: 'xl',
  _hover: { borderColor: 'surface.500' },
  _focus: {
    borderColor: 'accent.banana',
    boxShadow: '0 0 0 1px #FFE500',
  },
  _placeholder: { color: 'surface.600', fontSize: 'sm' },
};

const PasswordField = ({ label, value, onChange, autoComplete, show, onToggle }) => (
  <FormControl>
    <FormLabel fontSize="xs" fontWeight="600" color="surface.500" mb={1.5}>
      {label}
    </FormLabel>
    <InputGroup>
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={show ? '' : '••••••••'}
        {...inputProps}
        pr={12}
      />
      <InputRightElement h="44px" pr={2}>
        <Box
          as="button"
          type="button"
          onClick={onToggle}
          p={1.5}
          borderRadius="md"
          color="surface.500"
          _hover={{ color: 'accent.banana', bg: 'surface.850' }}
          transition="all 0.15s"
        >
          <Icon as={show ? TbEyeOff : TbEye} boxSize={4} />
        </Box>
      </InputRightElement>
    </InputGroup>
  </FormControl>
);

const SettingsPassword = ({ user }) => {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', status: 'warning', duration: 3000 });
      return;
    }

    setChanging(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect');

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setChanged(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated', status: 'success', duration: 2000 });
      setTimeout(() => setChanged(false), 3000);
    } catch (err) {
      toast({
        title: 'Password change failed',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setChanging(false);
    }
  };

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
        bg="radial-gradient(circle at top right, rgba(255,229,0,0.05), transparent 60%)"
        pointerEvents="none"
      />

      <VStack spacing={5} align="stretch" position="relative">
        <HStack spacing={2}>
          <Box w="6px" h="6px" borderRadius="full" bg="accent.banana" boxShadow="0 0 8px rgba(255,229,0,0.6)" />
          <Text
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color="accent.banana"
            fontFamily="mono"
          >
            Password
          </Text>
        </HStack>

        <PasswordField
          label="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          show={showCurrent}
          onToggle={() => setShowCurrent(!showCurrent)}
        />

        <PasswordField
          label="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
        />

        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
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
          transition="all 0.2s"
          _hover={{
            bg: changed ? 'accent.neon' : '#E6CE00',
            transform: 'translateY(-1px)',
            boxShadow: '0 8px 20px rgba(255,229,0,0.25)',
          }}
          _active={{ transform: 'translateY(0)' }}
          _disabled={{
            opacity: 0.3,
            cursor: 'not-allowed',
            _hover: { transform: 'none', boxShadow: 'none' },
          }}
        >
          {changed ? 'Password Updated' : 'Change Password'}
        </Button>
      </VStack>
    </Box>
  );
};

export default SettingsPassword;