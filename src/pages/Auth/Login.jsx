// src/pages/Auth/Login.jsx
import { useState } from 'react';
import {
  Box, VStack, HStack, Text, Input, Button, FormControl,
  FormLabel, Alert, AlertIcon, Center, Image, Link,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
    <Box minH="100vh" bg="surface.950" position="relative" overflow="hidden">
      {/* Subtle glow */}
      <Box
        position="absolute"
        top="-200px"
        left="50%"
        transform="translateX(-50%)"
        w="600px"
        h="600px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0,229,229,0.06) 0%, transparent 70%)"
        pointerEvents="none"
      />

      <Center minH="100vh" px={4} position="relative" zIndex={1}>
        <Box w="100%" maxW="380px">
          <VStack spacing={8} align="stretch">
            {/* Logo */}
            <VStack spacing={4}>
              <Image
                src="/logo-main.svg"
                alt="NeonBurro"
                w="48px"
                h="auto"
              />
              <HStack spacing={2} align="baseline">
                <Text
                  fontSize="2xl"
                  fontWeight="800"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  Pulse
                </Text>
                <Text fontSize="xs" color="surface.500" fontWeight="500">
                  by NeonBurro
                </Text>
              </HStack>
            </VStack>

            {/* Form */}
            <Box
              as="form"
              onSubmit={handleSubmit}
              bg="surface.900"
              border="1px solid"
              borderColor="surface.800"
              borderRadius="xl"
              p={6}
            >
              <VStack spacing={4}>
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
                    <Text fontSize="sm" color="status.red">{error}</Text>
                  </Alert>
                )}

                <FormControl>
                  <FormLabel fontSize="xs" color="surface.500" fontWeight="600" letterSpacing="0.03em">
                    Email
                  </FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="surface.950"
                    border="1px solid"
                    borderColor="surface.700"
                    color="white"
                    fontSize="sm"
                    h="44px"
                    _hover={{ borderColor: 'surface.600' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    _placeholder={{ color: 'surface.600' }}
                    placeholder="you@neonburro.com"
                    required
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" color="surface.500" fontWeight="600" letterSpacing="0.03em">
                    Password
                  </FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="surface.950"
                    border="1px solid"
                    borderColor="surface.700"
                    color="white"
                    fontSize="sm"
                    h="44px"
                    _hover={{ borderColor: 'surface.600' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    placeholder="••••••••"
                    _placeholder={{ color: 'surface.600' }}
                    required
                  />
                </FormControl>

                <Button
                  type="submit"
                  w="100%"
                  h="44px"
                  isLoading={loading}
                  loadingText="Signing in..."
                  fontSize="sm"
                >
                  Sign In
                </Button>

                <Link
                  fontSize="xs"
                  color="surface.500"
                  _hover={{ color: 'brand.500' }}
                  href="/forgot-password/"
                  textAlign="center"
                  w="100%"
                  display="block"
                >
                  Forgot password?
                </Link>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Center>
    </Box>
  );
};

export default Login;
