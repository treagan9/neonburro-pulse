// src/pages/Settings/components/SettingsPassword.jsx
// Change password on Paper. Verifies the current password by re-signing in, then
// updates. The security section carries a gold accent to set it apart. No dashes.

import { useState } from 'react';
import { VStack, HStack, Text, Input, Button, FormControl, FormLabel, Icon, useToast, Box, InputGroup, InputRightElement } from '@chakra-ui/react';
import { TbCheck, TbEye, TbEyeOff } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import colors from '../../../theme/colors';

const P = colors.paper;

const inputProps = {
  bg: P.sheet, border: '1px solid', borderColor: P.hair, color: P.ink,
  fontSize: 'sm', h: '48px', borderRadius: 'xl',
  _hover: { borderColor: P.inkFaint },
  _focus: { borderColor: P.gold, boxShadow: `0 0 0 3px ${P.gold}2E` },
  _placeholder: { color: P.inkFaint, fontSize: 'sm' },
};

const PasswordField = ({ label, value, onChange, autoComplete, show, onToggle }) => (
  <FormControl>
    <FormLabel fontSize="2xs" fontWeight="700" color={P.inkMuted} mb={2} textTransform="uppercase" letterSpacing="0.05em" fontFamily="mono">{label}</FormLabel>
    <InputGroup>
      <Input type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} placeholder={show ? '' : '••••••••'} {...inputProps} pr={12} />
      <InputRightElement h="48px" pr={2}>
        <Box as="button" type="button" onClick={onToggle} p={1.5} borderRadius="md" color={P.inkFaint} _hover={{ color: P.gold }} transition="all 0.15s">
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
    if (newPassword.length < 6) { toast({ title: 'Password too short', description: 'Must be at least 6 characters', status: 'warning', duration: 3000 }); return; }
    if (newPassword !== confirmPassword) { toast({ title: 'Passwords do not match', status: 'warning', duration: 3000 }); return; }
    setChanging(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (signInError) throw new Error('Current password is incorrect');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setChanged(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast({ title: 'Password updated', status: 'success', duration: 2000 });
      setTimeout(() => setChanged(false), 3000);
    } catch (err) {
      toast({ title: 'Password change failed', description: err.message, status: 'error', duration: 3000 });
    } finally {
      setChanging(false);
    }
  };

  return (
    <VStack spacing={5} align="stretch">
      <HStack spacing={2.5} px={1}>
        <Box w="6px" h="6px" borderRadius="full" bg={P.gold} />
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.14em" textTransform="uppercase" color={P.gold} fontFamily="mono">Password</Text>
      </HStack>

      <PasswordField label="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
      <PasswordField label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" show={showNew} onToggle={() => setShowNew(!showNew)} />
      <PasswordField label="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />

      <Button w="100%" h="48px" borderRadius="xl" fontSize="sm" fontWeight="700" isLoading={changing} loadingText="Updating..." onClick={handleChange} isDisabled={!currentPassword || !newPassword || !confirmPassword} leftIcon={changed ? <TbCheck /> : undefined} bg={changed ? P.green : P.gold} color="#fff" transition="all 0.2s" _hover={{ bg: changed ? P.green : '#856A00', transform: 'translateY(-1px)' }} _active={{ transform: 'translateY(0)' }} _disabled={{ opacity: 0.35, cursor: 'not-allowed', _hover: { transform: 'none' } }}>
        {changed ? 'Password updated' : 'Change password'}
      </Button>
    </VStack>
  );
};

export default SettingsPassword;
