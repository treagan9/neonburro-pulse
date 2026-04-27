// src/pages/Auth/Login.jsx
// Pulse admin sign-in.
// Design: editorial dark mode, matches client portal login (siblings).
// Logo clickable to neonburro.com. No scroll. Centered. Fixed.
// Forgot-password inline with banana easter egg preserved.
// Username lookup goes through lookup_email_by_username RPC (security definer)
// so the anon role never reads profiles directly.

import { useState, useRef, useEffect } from 'react';
import {
  Box, VStack, Text, Input, Button, FormControl,
  Image, Icon, HStack, Collapse,
  InputGroup, InputRightElement,
} from '@chakra-ui/react';
import { GiBananaPeeled } from 'react-icons/gi';
import { TbLock, TbAlertTriangle, TbEye, TbEyeOff, TbArrowRight } from 'react-icons/tb';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// ---------- helpers ----------

const tokens = {
  canvas: '#0A0A0A',
  brand: '#00E5E5',
  brandHover: '#26F2F2',
  banana: '#FFE500',
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.65)',
    tertiary: 'rgba(255, 255, 255, 0.45)',
    muted: 'rgba(255, 255, 255, 0.30)',
  },
  divider: {
    soft: 'rgba(255, 255, 255, 0.12)',
  },
};

const inputStyle = {
  bg: 'transparent',
  border: '1px solid',
  borderColor: tokens.divider.soft,
  color: tokens.text.primary,
  fontSize: 'md',
  h: '52px',
  borderRadius: 'xl',
  px: 4,
  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  _hover: { borderColor: tokens.text.tertiary },
  _focus: {
    borderColor: tokens.brand,
    boxShadow: `0 0 0 1px ${tokens.brand}`,
    outline: 'none',
  },
  _focusVisible: {
    borderColor: tokens.brand,
    boxShadow: `0 0 0 1px ${tokens.brand}`,
    outline: 'none',
  },
  _placeholder: {
    color: tokens.text.muted,
    fontSize: 'md',
    fontWeight: '400',
  },
};

const isEmail = (value) => value.includes('@');

const resolveEmail = async (input) => {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) throw new Error('Username not recognized');
  if (isEmail(trimmed)) return trimmed;

  const { data, error } = await supabase.rpc('lookup_email_by_username', {
    p_username: trimmed,
  });
  if (error) {
    console.error('lookup_email_by_username failed', error);
    throw new Error('Could not check username, try again');
  }
  if (!data) throw new Error('Username not recognized');
  return data;
};

// ---------- component ----------

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
  const [errorShake, setErrorShake] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const identifierRef = useRef(null);
  const passwordRef = useRef(null);

  const from = location.state?.from?.pathname || '/dashboard/';

  useEffect(() => {
    const id = setTimeout(() => identifierRef.current?.focus(), 100);
    return () => clearTimeout(id);
  }, []);

  const triggerShake = () => {
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
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
      triggerShake();
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      triggerShake();
      setError('Please enter a valid email');
      return;
    }
    setResetLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password/` }
      );
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      triggerShake();
      setError(err.message || 'Could not send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Box
      position="fixed"
      inset={0}
      bg={tokens.canvas}
      overflow="hidden"
      sx={{
        '@keyframes shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
        '@keyframes fadeUp': {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Ambient radial glow — subtle cyan wash from top */}
      <Box
        position="absolute"
        top="-25%"
        left="50%"
        transform="translateX(-50%)"
        w={{ base: '140%', md: '800px' }}
        h={{ base: '600px', md: '800px' }}
        bg="radial-gradient(ellipse at center top, rgba(0,229,229,0.08), transparent 60%)"
        pointerEvents="none"
        zIndex={0}
      />

      {/* Centered content — uses flexbox to perfectly center, no overflow */}
      <Box
        position="relative"
        zIndex={1}
        h="100%"
        w="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
        pt="env(safe-area-inset-top)"
        pb="env(safe-area-inset-bottom)"
      >
        <Box
          w="100%"
          maxW="360px"
          animation="fadeUp 400ms cubic-bezier(0.4, 0, 0.2, 1)"
        >
          <VStack spacing={{ base: 10, md: 12 }} align="stretch">

            {/* Logo — clickable to neonburro.com, centered */}
            <Box
              as="a"
              href="https://neonburro.com/"
              target="_blank"
              rel="noopener noreferrer"
              display="flex"
              justifyContent="center"
              transition="transform 200ms cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{ transform: 'translateY(-2px)' }}
              _active={{ transform: 'scale(0.98)' }}
              cursor="pointer"
            >
              <Image
                src="/logo-main.svg"
                alt="NeonBurro"
                w={{ base: '104px', md: '120px' }}
                h="auto"
                display="block"
              />
            </Box>

            {/* Error banner — shakes on trigger */}
            <Collapse in={!!error} animateOpacity unmountOnExit>
              <HStack
                spacing={2.5}
                bg="rgba(255, 229, 0, 0.08)"
                border="1px solid"
                borderColor="rgba(255, 229, 0, 0.25)"
                borderRadius="xl"
                px={4}
                py={3}
                animation={errorShake ? 'shake 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'}
              >
                <Icon as={TbAlertTriangle} boxSize={4} color={tokens.banana} flexShrink={0} />
                <Text fontSize="xs" color={tokens.banana} lineHeight="1.4">
                  {error}
                </Text>
              </HStack>
            </Collapse>

            {/* Main sign-in form */}
            <VStack as="form" onSubmit={handleSubmit} spacing={4}>
              <FormControl>
                <Input
                  ref={identifierRef}
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="username or email"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  enterKeyHint="next"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      passwordRef.current?.focus();
                    }
                  }}
                  {...inputStyle}
                />
              </FormControl>

              <FormControl>
                <InputGroup>
                  <Input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    required
                    autoComplete="current-password"
                    enterKeyHint="go"
                    {...inputStyle}
                    pr="52px"
                  />
                  <InputRightElement h="52px" w="52px">
                    <Box
                      as="button"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      w="36px"
                      h="36px"
                      borderRadius="md"
                      color={tokens.text.tertiary}
                      transition="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                      _hover={{ color: tokens.brand }}
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
                h="56px"
                mt={2}
                bg={tokens.brand}
                color={tokens.canvas}
                fontSize="md"
                fontWeight="700"
                borderRadius="full"
                rightIcon={!loading && <Icon as={TbArrowRight} boxSize={4} />}
                isLoading={loading}
                loadingText="Signing in"
                transition="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  bg: tokens.brandHover,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 0 24px rgba(0, 229, 229, 0.3)',
                }}
                _active={{ transform: 'scale(0.98)' }}
                _focus={{ boxShadow: '0 0 0 2px rgba(0, 229, 229, 0.4)' }}
              >
                Sign in
              </Button>

              {/* Forgot-password trigger — subtle, appears after form */}
              <HStack
                spacing={1.5}
                justify="center"
                cursor="pointer"
                onClick={() => {
                  setShowForgot(!showForgot);
                  setResetSent(false);
                  setError('');
                }}
                color={tokens.text.tertiary}
                transition="color 200ms"
                _hover={{ color: tokens.brand }}
                userSelect="none"
                pt={3}
                pb={1}
              >
                <Icon as={TbLock} boxSize={3} />
                <Text fontSize="sm">Forgot password?</Text>
              </HStack>
            </VStack>

            {/* Forgot-password inline — banana easter egg preserved */}
            <Collapse in={showForgot} animateOpacity unmountOnExit>
              {resetSent ? (
                <VStack
                  spacing={3}
                  py={2}
                  animation="fadeUp 400ms cubic-bezier(0.4, 0, 0.2, 1)"
                >
                  <Icon as={GiBananaPeeled} boxSize={8} color={tokens.banana} />
                  <VStack spacing={1}>
                    <Text fontSize="sm" color={tokens.banana} fontWeight="600" textAlign="center">
                      Check your inbox.
                    </Text>
                    <Text fontSize="xs" color={tokens.text.tertiary} textAlign="center">
                      We sent a reset link. Feed the burro.
                    </Text>
                  </VStack>
                </VStack>
              ) : (
                <VStack spacing={3}>
                  <HStack spacing={2} justify="center">
                    <Icon as={GiBananaPeeled} boxSize={4} color={tokens.banana} />
                    <Text fontSize="xs" color={tokens.text.tertiary}>
                      Even burros forget sometimes.
                    </Text>
                  </HStack>
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your email"
                    autoComplete="email"
                    enterKeyHint="send"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleResetPassword();
                      }
                    }}
                    {...inputStyle}
                    _focus={{
                      borderColor: tokens.banana,
                      boxShadow: `0 0 0 1px ${tokens.banana}`,
                      outline: 'none',
                    }}
                  />
                  <Button
                    w="100%"
                    h="48px"
                    bg={tokens.banana}
                    color={tokens.canvas}
                    fontSize="sm"
                    fontWeight="700"
                    borderRadius="full"
                    isLoading={resetLoading}
                    loadingText="Sending"
                    onClick={handleResetPassword}
                    transition="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      bg: '#FFEF33',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 0 20px rgba(255, 229, 0, 0.3)',
                    }}
                    _active={{ transform: 'scale(0.98)' }}
                  >
                    Send reset link
                  </Button>
                </VStack>
              )}
            </Collapse>

          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;