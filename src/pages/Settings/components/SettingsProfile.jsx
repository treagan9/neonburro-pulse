// src/pages/Settings/components/SettingsProfile.jsx
import { useState } from 'react';
import {
  VStack, HStack, Text, Input, Button, FormControl,
  FormLabel, Icon, useToast,
} from '@chakra-ui/react';
import { TbUser, TbMail, TbShield, TbCheck } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';

const FieldInput = ({ label, ...props }) => (
  <FormControl>
    <FormLabel fontSize="xs" fontWeight="600" color="surface.500" mb={1.5}>
      {label}
    </FormLabel>
    <Input
      bg="transparent"
      border="1px solid"
      borderColor="surface.700"
      color="white"
      fontSize="sm"
      h="44px"
      borderRadius="xl"
      _hover={{ borderColor: 'surface.500' }}
      _focus={{
        borderColor: 'brand.500',
        boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
      }}
      _placeholder={{ color: 'surface.600', fontSize: 'sm' }}
      {...props}
    />
  </FormControl>
);

const SettingsProfile = ({ user, profile, setProfile }) => {
  const toast = useToast();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    if (username && username !== profile?.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim().toLowerCase())
        .neq('id', user.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: 'Username taken',
          description: 'That username is already in use',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Save failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
      setSaved(true);
      setProfile((prev) => ({
        ...prev,
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
      }));
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <VStack spacing={5} align="stretch">
      <HStack spacing={2}>
        <Icon as={TbUser} boxSize={4} color="brand.500" />
        <Text
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color="brand.500"
        >
          Profile
        </Text>
      </HStack>

      <FieldInput
        label="Display name"
        placeholder="Tyler Reagan"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <FieldInput
        label="Username"
        placeholder="treagan"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <FieldInput
        label="Phone"
        placeholder="(970) 555-1234"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <FormControl>
        <FormLabel fontSize="xs" fontWeight="600" color="surface.500" mb={1.5}>
          Email
        </FormLabel>
        <HStack
          h="44px"
          px={4}
          borderRadius="xl"
          border="1px solid"
          borderColor="surface.800"
        >
          <Icon as={TbMail} boxSize={4} color="surface.600" />
          <Text fontSize="sm" color="surface.500">{user?.email}</Text>
        </HStack>
      </FormControl>

      <HStack spacing={2}>
        <Icon as={TbShield} boxSize={4} color="accent.purple" />
        <Text
          fontSize="xs"
          fontWeight="600"
          color="accent.purple"
          textTransform="uppercase"
          letterSpacing="0.05em"
        >
          {profile?.role || 'admin'}
        </Text>
      </HStack>

      <Button
        w="100%"
        h="44px"
        borderRadius="xl"
        fontSize="sm"
        fontWeight="700"
        isLoading={saving}
        loadingText="Saving..."
        onClick={handleSave}
        leftIcon={saved ? <TbCheck /> : undefined}
        bg={saved ? 'accent.neon' : 'brand.500'}
        color="surface.950"
        _hover={{
          bg: saved ? 'accent.neon' : 'brand.400',
          transform: 'translateY(-1px)',
        }}
        _active={{ transform: 'translateY(0)' }}
      >
        {saved ? 'Saved' : 'Save Profile'}
      </Button>
    </VStack>
  );
};

export default SettingsProfile;