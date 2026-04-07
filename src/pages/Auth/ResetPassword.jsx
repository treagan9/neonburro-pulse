// src/pages/Auth/ResetPassword.jsx
import { useState, useEffect } from 'react';
import {
  Box, VStack, Text, Input, Button, FormControl,
  Center, Image, Icon, HStack,
  InputGroup, InputRightElement,
} from '@chakra-ui/react';
import { GiBananaPeeled } from 'react-icons/gi';
import { TbCheck, TbAlertTriangle, TbEye, TbEyeOff } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  // Capture the recovery session from URL hash and prevent auto-redirect
  useEffect(() => {
    const handleRecoverySession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          // Clear the hash so user can't accidentally re-trigger
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      setReady(true);
    };

    handleRecoverySession();
  }, []);

  const handleReset = async () => {
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      // Sign out so they have to log in fresh with new password
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login/'), 2500);
    } catch (err) {
      setError(err.message || 'Could not update password');
    } finally {
      setLoading(false);
    }
  };

  const passwordInputBase = {
    bg: 'transparent',
    border: '1px solid',
    borderColor: 'surface.700',
    color: 'white',
    fontSize: 'sm',
    h: '48px',
    borderRadius: 'xl',
    pr: '44px',
    _hover: { borderColor: 'surface.500' },
    _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' },
    _placeholder: { color: 'surface.600', fontSize: 'sm' },
  };

  return (
    <Box minH="100vh" bg="surface.950" position="relative" overflow="hidden">
      <Box
        position="absolute"
        top="-300px"
        left="50%"
        transform="translateX(-50%)"
        w="800px"
        h="800px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0,229,229,0.04) 0%, transparent 60%)"
        pointerEvents="none"
      />

      <Center minH="100vh" px={4} position="relative" zIndex={1}>
        <Box w="100%" maxW="340px">
          <VStack spacing={8} align="stretch">
            <Center>
              <Image src="/logo-main.svg" alt="NeonBurro" w="120px" h="auto" />
            </Center>

            {error && (
              <HStack
                spacing={2}
                bg="rgba(255, 229, 0, 0.08)"
                border="1px solid"
                borderColor="rgba(255, 229, 0, 0.3)"
                borderRadius="xl"
                px={4}
                py={3}
              >
                <Icon as={TbAlertTriangle} boxSize={4} color="accent.banana" flexShrink={0} />
                <Text fontSize="xs" color="accent.banana">{error}</Text>
              </HStack>
            )}

            {success ? (
              <VStack spacing={3} py={4}>
                <Icon as={TbCheck} boxSize={10} color="brand.500" />
                <Text fontSize="lg" fontWeight="700" color="white" textAlign="center">
                  Password updated
                </Text>
                <Text fontSize="xs" color="surface.400" textAlign="center">
                  Redirecting to login...
                </Text>
              </VStack>
            ) : (
              <VStack spacing={4}>
                <HStack spacing={2}>
                  <Icon as={GiBananaPeeled} boxSize={5} color="accent.banana" />
                  <Text fontSize="sm" color="surface.400">Pick a new password</Text>
                </HStack>

                <FormControl>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="new password"
                      autoComplete="new-password"
                      {...passwordInputBase}
                    />
                    <InputRightElement h="48px" w="44px">
                      <Box
                        as="button"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        w="32px"
                        h="32px"
                        borderRadius="md"
                        color="surface.500"
                        opacity={0.6}
                        transition="all 0.15s"
                        _hover={{ color: 'brand.500', opacity: 1 }}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <Icon as={showPassword ? TbEyeOff : TbEye} boxSize={4} />
                      </Box>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <InputGroup>
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="confirm password"
                      autoComplete="new-password"
                      {...passwordInputBase}
                    />
                    <InputRightElement h="48px" w="44px">
                      <Box
                        as="button"
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        w="32px"
                        h="32px"
                        borderRadius="md"
                        color="surface.500"
                        opacity={0.6}
                        transition="all 0.15s"
                        _hover={{ color: 'brand.500', opacity: 1 }}
                        tabIndex={-1}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        <Icon as={showConfirm ? TbEyeOff : TbEye} boxSize={4} />
                      </Box>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  w="100%"
                  h="48px"
                  borderRadius="xl"
                  isLoading={loading}
                  loadingText="Updating..."
                  fontSize="sm"
                  fontWeight="700"
                  onClick={handleReset}
                  isDisabled={!ready}
                >
                  Update Password
                </Button>
              </VStack>
            )}
          </VStack>
        </Box>
      </Center>
    </Box>
  );
};

export default ResetPassword;