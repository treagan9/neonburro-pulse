// src/pages/Auth/AcceptInvite.jsx
import { useState, useEffect } from 'react';
import {
  Box, VStack, Text, Input, Button, FormControl,
  Center, Image, Icon, HStack, InputGroup, InputRightElement,
  Spinner,
} from '@chakra-ui/react';
import { GiBananaPeeled } from 'react-icons/gi';
import { TbCheck, TbAlertTriangle, TbEye, TbEyeOff, TbUser } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const AcceptInvite = () => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState('');
  const navigate = useNavigate();

  // Capture the invite session from URL hash
  useEffect(() => {
    const handleInviteSession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setError('This invite link has expired or is invalid. Please ask for a new one.');
          setReady(true);
          return;
        }

        // Get the invited user's email
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setInvitedEmail(user.email);
          // Pre-fill display name from email if possible
          const emailName = user.email.split('@')[0];
          setDisplayName(emailName.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
        }

        // Clear the hash so refresh doesn't break
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        // No tokens - check if there's already a session (came in without hash)
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setInvitedEmail(user.email);
          const emailName = user.email.split('@')[0];
          setDisplayName(emailName.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
        } else {
          setError('No invite token found. Please use the link from your invite email.');
        }
      }
      setReady(true);
    };

    handleInviteSession();
  }, []);

  const handleAccept = async () => {
    setError('');

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('Username can only contain lowercase letters, numbers, and underscores');
      return;
    }
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
      // Check if username is taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        throw new Error('That username is already taken');
      }

      // Set the password
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw pwError;

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expired. Please use the invite link again.');

      // Create or update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          display_name: displayName.trim(),
          username: username.toLowerCase().trim(),
          role: 'admin', // default role - owner can promote later
        }, { onConflict: 'id' });

      if (profileError) throw profileError;

      setSuccess(true);

      // Sign out so they log in fresh with new credentials
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login/');
      }, 2500);

    } catch (err) {
      setError(err.message || 'Could not complete invite');
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    bg: 'transparent',
    border: '1px solid',
    borderColor: 'surface.700',
    color: 'white',
    fontSize: 'sm',
    h: '48px',
    borderRadius: 'xl',
    _hover: { borderColor: 'surface.500' },
    _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' },
    _placeholder: { color: 'surface.600', fontSize: 'sm' },
  };

  const passwordInputBase = { ...inputBase, pr: '44px' };

  if (!ready) {
    return (
      <Box minH="100vh" bg="surface.950" display="flex" alignItems="center" justifyContent="center">
        <Spinner color="brand.500" size="lg" thickness="2px" />
      </Box>
    );
  }

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
        <Box w="100%" maxW="380px">
          <VStack spacing={7} align="stretch">
            <Center>
              <Image src="/logo-main.svg" alt="NeonBurro" w="120px" h="auto" />
            </Center>

            {!success && (
              <VStack spacing={2} textAlign="center">
                <HStack spacing={2}>
                  <Icon as={GiBananaPeeled} boxSize={5} color="accent.banana" />
                  <Text fontSize="sm" color="accent.banana" fontWeight="700" letterSpacing="wider" textTransform="uppercase">
                    Welcome to the herd
                  </Text>
                </HStack>
                <Text fontSize="lg" color="white" fontWeight="700">
                  You've been invited to NeonBurro Pulse
                </Text>
                {invitedEmail && (
                  <Text fontSize="xs" color="surface.400">
                    {invitedEmail}
                  </Text>
                )}
              </VStack>
            )}

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
                  You're in
                </Text>
                <Text fontSize="xs" color="surface.400" textAlign="center">
                  Redirecting to login...
                </Text>
              </VStack>
            ) : invitedEmail ? (
              <VStack spacing={4}>
                <FormControl>
                  <Text fontSize="2xs" color="surface.500" fontWeight="700" mb={1.5} letterSpacing="wider" textTransform="uppercase">
                    Your Name
                  </Text>
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Tyler Reagan"
                    autoComplete="name"
                    {...inputBase}
                  />
                </FormControl>

                <FormControl>
                  <Text fontSize="2xs" color="surface.500" fontWeight="700" mb={1.5} letterSpacing="wider" textTransform="uppercase">
                    Pick a Username
                  </Text>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="treagan"
                    autoComplete="username"
                    {...inputBase}
                  />
                  <Text fontSize="2xs" color="surface.600" mt={1.5}>
                    Lowercase letters, numbers, and underscores only
                  </Text>
                </FormControl>

                <FormControl>
                  <Text fontSize="2xs" color="surface.500" fontWeight="700" mb={1.5} letterSpacing="wider" textTransform="uppercase">
                    Password
                  </Text>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
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
                  <Text fontSize="2xs" color="surface.500" fontWeight="700" mb={1.5} letterSpacing="wider" textTransform="uppercase">
                    Confirm Password
                  </Text>
                  <InputGroup>
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Type it again"
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
                  loadingText="Setting up..."
                  fontSize="sm"
                  fontWeight="700"
                  onClick={handleAccept}
                  bg="brand.500"
                  color="surface.950"
                  _hover={{ bg: 'brand.400', transform: 'translateY(-1px)' }}
                  _active={{ transform: 'translateY(0)' }}
                  mt={2}
                >
                  Join the Herd
                </Button>
              </VStack>
            ) : null}
          </VStack>
        </Box>
      </Center>
    </Box>
  );
};

export default AcceptInvite;