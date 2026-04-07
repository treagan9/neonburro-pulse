// src/pages/Auth/Login.jsx
import { useState } from 'react';
import {
  Box, VStack, Text, Input, Button, FormControl,
  Center, Image, Icon, HStack, Collapse,
  InputGroup, InputRightElement,
} from '@chakra-ui/react';
import { GiBananaPeeled } from 'react-icons/gi';
import { TbLock, TbAlertTriangle, TbEye, TbEyeOff } from 'react-icons/tb';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard/';

  const resolveEmail = async (input) => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.includes('@')) return trimmed;
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', trimmed)
      .maybeSingle();
    if (!data) throw new Error('Username not recognized');
    return data.email;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const email = await resolveEmail(identifier);
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setResetLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password/`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset email');
    } finally {
      setResetLoading(false);
    }
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

            {/* Error - neon style */}
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

            {/* Form */}
            <VStack as="form" onSubmit={handleSubmit} spacing={4}>
              <FormControl>
                <Input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  bg="transparent"
                  border="1px solid"
                  borderColor="surface.700"
                  color="white"
                  fontSize="sm"
                  h="48px"
                  borderRadius="xl"
                  _hover={{ borderColor: 'surface.500' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  _placeholder={{ color: 'surface.600', fontSize: 'sm' }}
                  placeholder="username"
                  required
                  autoComplete="username"
                />
              </FormControl>

              <FormControl>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="transparent"
                    border="1px solid"
                    borderColor="surface.700"
                    color="white"
                    fontSize="sm"
                    h="48px"
                    borderRadius="xl"
                    pr="44px"
                    _hover={{ borderColor: 'surface.500' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    _placeholder={{ color: 'surface.600', fontSize: 'sm' }}
                    placeholder="password"
                    required
                    autoComplete="current-password"
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

              <Button
                type="submit"
                w="100%"
                h="48px"
                borderRadius="xl"
                isLoading={loading}
                loadingText="Signing in..."
                fontSize="sm"
                fontWeight="700"
              >
                Sign In
              </Button>

              <HStack
                spacing={1.5}
                justify="center"
                cursor="pointer"
                onClick={() => { setShowForgot(!showForgot); setResetSent(false); setError(''); }}
                opacity={0.35}
                _hover={{ opacity: 1 }}
                transition="opacity 0.2s"
                userSelect="none"
                pt={2}
              >
                <Icon as={TbLock} boxSize={3.5} color="surface.400" />
                <Text fontSize="xs" color="surface.400">Forgot password?</Text>
              </HStack>
            </VStack>

            {/* Forgot password */}
            <Collapse in={showForgot} animateOpacity>
              {resetSent ? (
                <VStack spacing={2} py={2}>
                  <Icon as={GiBananaPeeled} boxSize={8} color="accent.banana" />
                  <Text fontSize="sm" color="accent.banana" fontWeight="600" textAlign="center">
                    Check your inbox
                  </Text>
                  <Text fontSize="xs" color="surface.400" textAlign="center">
                    We sent a reset link. Feed the burro.
                  </Text>
                </VStack>
              ) : (
                <VStack spacing={3}>
                  <HStack spacing={2}>
                    <Icon as={GiBananaPeeled} boxSize={5} color="accent.banana" />
                    <Text fontSize="xs" color="surface.400">Even burros forget sometimes</Text>
                  </HStack>
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    bg="transparent"
                    border="1px solid"
                    borderColor="surface.700"
                    color="white"
                    fontSize="sm"
                    h="44px"
                    borderRadius="xl"
                    _hover={{ borderColor: 'surface.500' }}
                    _focus={{ borderColor: 'accent.banana', boxShadow: '0 0 0 1px #FFE500' }}
                    _placeholder={{ color: 'surface.600', fontSize: 'sm' }}
                    placeholder="email"
                  />
                  <Button
                    w="100%"
                    h="44px"
                    borderRadius="xl"
                    bg="accent.banana"
                    color="surface.950"
                    fontSize="sm"
                    fontWeight="700"
                    _hover={{ bg: '#E6CE00', transform: 'translateY(-1px)' }}
                    _active={{ transform: 'translateY(0)' }}
                    isLoading={resetLoading}
                    loadingText="Sending..."
                    onClick={handleResetPassword}
                  >
                    Send Reset Link
                  </Button>
                </VStack>
              )}
            </Collapse>

          </VStack>
        </Box>
      </Center>
    </Box>
  );
};

export default Login;