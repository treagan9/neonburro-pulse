// src/pages/Settings/components/SettingsProfile.jsx
import { useState, useEffect } from 'react';
import {
  VStack, HStack, Text, Input, Button, FormControl,
  FormLabel, Icon, useToast, Box, InputGroup, InputRightElement,
} from '@chakra-ui/react';
import { TbMail, TbCheck, TbAlertTriangle, TbAt, TbPhone } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import { formatPhoneDisplay, formatPhoneStorage, isValidPhone } from '../../../utils/phone';

const inputProps = {
  bg: 'transparent',
  border: '1px solid',
  borderColor: 'surface.700',
  color: 'white',
  fontSize: 'sm',
  h: '48px',
  borderRadius: 'xl',
  _hover: { borderColor: 'surface.500' },
  _focus: {
    borderColor: 'brand.500',
    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
  },
  _placeholder: { color: 'surface.600', fontSize: 'sm' },
};

const SettingsProfile = ({ user, profile, setProfile }) => {
  const toast = useToast();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [phone, setPhone] = useState(formatPhoneDisplay(profile?.phone || ''));
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const phoneValid = phone ? isValidPhone(phone) : null;
  const usernameClean = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const usernameValid = usernameClean.length >= 3 && usernameClean === username.toLowerCase();

  useEffect(() => {
    if (!username || username === profile?.username) {
      setUsernameAvailable(null);
      return;
    }
    if (!usernameValid) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', usernameClean)
        .neq('id', user.id)
        .maybeSingle();
      setUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [username, profile?.username, user.id, usernameValid, usernameClean]);

  const handlePhoneChange = (e) => {
    setPhone(formatPhoneDisplay(e.target.value));
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({ title: 'Display name required', status: 'warning', duration: 2000 });
      return;
    }
    if (username && !usernameValid) {
      toast({
        title: 'Invalid username',
        description: 'Use lowercase letters, numbers, and underscores (min 3 chars)',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    if (username && username !== profile?.username && usernameAvailable === false) {
      toast({ title: 'Username taken', status: 'warning', duration: 2000 });
      return;
    }

    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        username: usernameClean || null,
        phone: formatPhoneStorage(phone) || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Save failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
      setSaving(false);
      return;
    }

    setProfile((prev) => ({
      ...prev,
      display_name: displayName.trim(),
      username: usernameClean || null,
      phone: formatPhoneStorage(phone) || null,
    }));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
    toast({ title: 'Profile saved', status: 'success', duration: 2000 });
  };

  return (
    <VStack spacing={5} align="stretch">
      {/* Section header - matches naked vibe */}
      <HStack spacing={2.5} px={1}>
        <Box w="6px" h="6px" borderRadius="full" bg="brand.500" boxShadow="0 0 8px rgba(0,229,229,0.6)" />
        <Text
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="brand.500"
          fontFamily="mono"
        >
          Profile
        </Text>
      </HStack>

      <FormControl>
        <FormLabel fontSize="2xs" fontWeight="700" color="surface.500" mb={2} textTransform="uppercase" letterSpacing="0.05em">
          Display name
        </FormLabel>
        <Input
          placeholder="Tyler Reagan"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          {...inputProps}
        />
      </FormControl>

      <FormControl>
        <FormLabel fontSize="2xs" fontWeight="700" color="surface.500" mb={2} textTransform="uppercase" letterSpacing="0.05em">
          Username
        </FormLabel>
        <InputGroup>
          <Input
            placeholder="treagan"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            {...inputProps}
            pl={10}
          />
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1} pointerEvents="none">
            <Icon as={TbAt} boxSize={4} color="surface.600" />
          </Box>
          {username && username !== profile?.username && (
            <InputRightElement h="48px">
              {checkingUsername ? (
                <Text fontSize="2xs" color="surface.500">checking</Text>
              ) : (
                <Icon
                  as={usernameAvailable ? TbCheck : TbAlertTriangle}
                  color={usernameAvailable ? 'accent.neon' : 'accent.banana'}
                  boxSize={4}
                />
              )}
            </InputRightElement>
          )}
        </InputGroup>
        <Text fontSize="2xs" color="surface.600" mt={2}>
          Used to log in. Lowercase letters, numbers, and underscores only.
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="2xs" fontWeight="700" color="surface.500" mb={2} textTransform="uppercase" letterSpacing="0.05em">
          Phone
        </FormLabel>
        <InputGroup>
          <Input
            type="tel"
            placeholder="(970) 555-1234"
            value={phone}
            onChange={handlePhoneChange}
            {...inputProps}
            pl={10}
          />
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1} pointerEvents="none">
            <Icon as={TbPhone} boxSize={4} color="surface.600" />
          </Box>
          {phoneValid !== null && (
            <InputRightElement h="48px">
              <Icon
                as={phoneValid ? TbCheck : TbAlertTriangle}
                color={phoneValid ? 'accent.neon' : 'accent.banana'}
                boxSize={4}
              />
            </InputRightElement>
          )}
        </InputGroup>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="2xs" fontWeight="700" color="surface.500" mb={2} textTransform="uppercase" letterSpacing="0.05em">
          Email
        </FormLabel>
        <HStack
          h="48px"
          px={4}
          borderRadius="xl"
          border="1px solid"
          borderColor="surface.800"
        >
          <Icon as={TbMail} boxSize={4} color="surface.600" />
          <Text fontSize="sm" color="surface.400" flex={1}>{user?.email}</Text>
          <Text fontSize="2xs" color="surface.600" fontFamily="mono">read only</Text>
        </HStack>
      </FormControl>

      <Button
        w="100%"
        h="48px"
        borderRadius="xl"
        fontSize="sm"
        fontWeight="700"
        isLoading={saving}
        loadingText="Saving..."
        onClick={handleSave}
        leftIcon={saved ? <TbCheck /> : undefined}
        bg={saved ? 'accent.neon' : 'brand.500'}
        color="surface.950"
        transition="all 0.2s"
        _hover={{
          bg: saved ? 'accent.neon' : 'brand.400',
          transform: 'translateY(-1px)',
          boxShadow: '0 8px 20px rgba(0,229,229,0.25)',
        }}
        _active={{ transform: 'translateY(0)' }}
      >
        {saved ? 'Saved' : 'Save Profile'}
      </Button>
    </VStack>
  );
};

export default SettingsProfile;