// src/pages/Auth/Login.jsx
import { useState } from 'react';
import {
  Box, VStack, Text, Input, Button, FormControl,
  Alert, AlertIcon, Center, Image, Icon, HStack,
  Collapse,
} from '@chakra-ui/react';
import { GiBananaPeeled } from 'react-icons/gi';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
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
      {/* Subtle top glow */}
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
        <Box w="100%" maxW="360px">
          <VStack spacing={6} align="stretch">

            {/* Logo */}
            <Center>
              <Image
                src="/logo-main.svg"
                alt="NeonBurro"
                w="80px"
                h="auto"
              />
            </Center>

            {/* Login form */}
            <Box
              bg="surface.900"
              border="1px solid"
              borderColor="surface.800"
              borderRadius="2xl"
              p={7}
            >
              <VStack as="form" onSubmit={handleSubmit} spacing={4}>
                {error && (
                  <Alert
                    status="error"
                    borderRadius="lg"
                    bg="status.redMuted"
                    border="1px solid"
                    borderColor="status.red"
                    py={2}
                  >
                    <AlertIcon color="status.red" boxSize={4} />
                    <Text fontSize="xs" color="status.red">{error}</Text>
                  </Alert>
                )}

                <FormControl>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="surface.950"
                    border="1px solid"
                    borderColor="surface.700"
                    color="white"
                    fontSize="sm"
                    h="48px"
                    borderRadius="xl"
                    _hover={{ borderColor: 'surface.600' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    _placeholder={{ color: 'surface.600', fontSize: 'sm' }}
                    placeholder="username"
                    required
                  />
                </FormControl>

                <FormControl>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="surface.950"
                    border="1px solid"
                    borderColor="surface.700"
                    color="white"
                    fontSize="sm"
                    h="48px"
                    borderRadius="xl"
                    _hover={{ borderColor: 'surface.600' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    _placeholder={{ color: 'surface.600', fontSize: 'sm' }}
                    placeholder="password"
                    required
                  />
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

                {/* Forgot password toggle */}
                <Text
                  fontSize="xs"
                  color="surface.500"
                  cursor="pointer"
                  _hover={{ color: 'accent.banana' }}
                  onClick={() => { setShowForgot(!showForgot); setResetSent(false); setError(''); }}
                  textAlign="center"
                  transition="color 0.15s"
                  userSelect="none"
                >
                  Forgot password?
                </Text>
              </VStack>

              {/* Forgot password panel */}
              <Collapse in={showForgot} animateOpacity>
                <Box
                  mt={4}
                  pt={4}
                  borderTop="1px solid"
                  borderColor="surface.800"
                >
                  {resetSent ? (
                    <VStack spacing={2}>
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
                        <Text fontSize="xs" color="surface.400">
                          Even burros forget sometimes
                        </Text>
                      </HStack>
                      <Input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        bg="surface.950"
                        border="1px solid"
                        borderColor="surface.700"
                        color="white"
                        fontSize="sm"
                        h="44px"
                        borderRadius="xl"
                        _hover={{ borderColor: 'surface.600' }}
                        _focus={{ borderColor: 'accent.banana', boxShadow: '0 0 0 1px #FFE500' }}
                        _placeholder={{ color: 'surface.600', fontSize: 'sm' }}
                        placeholder="your email"
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
                </Box>
              </Collapse>
            </Box>

          </VStack>
        </Box>
      </Center>
    </Box>
  );
};

export default Login;
