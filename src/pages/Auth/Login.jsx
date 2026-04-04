// src/pages/Auth/Login.jsx
import { useState } from 'react';
import {
  Box, VStack, HStack, Text, Input, Button, FormControl,
  FormLabel, Alert, AlertIcon, Center,
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
    <Center minH="100vh" bg="surface.950" px={4}>
      <Box w="100%" maxW="400px">
        <VStack spacing={8} align="stretch">
          {/* Logo */}
          <VStack spacing={2}>
            <HStack spacing={3}>
              <Box
                w="40px"
                h="40px"
                borderRadius="xl"
                bg="brand.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="md" fontWeight="800" color="surface.950">NB</Text>
              </Box>
              <Box>
                <Text fontSize="2xl" fontWeight="800" color="white" lineHeight="1.1">Pulse</Text>
                <Text fontSize="xs" color="surface.500">NeonBurro</Text>
              </Box>
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
                <Alert status="error" borderRadius="lg" bg="status.redMuted" border="1px solid" borderColor="status.red">
                  <AlertIcon color="status.red" />
                  <Text fontSize="sm" color="status.red">{error}</Text>
                </Alert>
              )}

              <FormControl>
                <FormLabel fontSize="sm" color="surface.400">Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  bg="surface.850"
                  border="1px solid"
                  borderColor="surface.700"
                  _hover={{ borderColor: 'surface.600' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  required
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="surface.400">Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="surface.850"
                  border="1px solid"
                  borderColor="surface.700"
                  _hover={{ borderColor: 'surface.600' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  required
                />
              </FormControl>

              <Button
                type="submit"
                w="100%"
                isLoading={loading}
                loadingText="Signing in..."
              >
                Sign In
              </Button>
            </VStack>
          </Box>

          <Text fontSize="xs" color="surface.600" textAlign="center">
            Bright tools. Bold experiences.
          </Text>
        </VStack>
      </Box>
    </Center>
  );
};

export default Login;
