// src/pages/Settings/index.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Box, VStack, HStack, Text, Input, Button, FormControl,
  FormLabel, Icon, Avatar, Center, Divider, useToast,
} from '@chakra-ui/react';
import {
  TbUser, TbLock, TbCheck, TbAlertTriangle,
  TbCamera, TbMail, TbAt, TbShield,
} from 'react-icons/tb';
import { GiBananaPeeled } from 'react-icons/gi';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const SectionHeader = ({ icon, label, accent = 'brand.500' }) => (
  <HStack spacing={2} pb={1}>
    <Icon as={icon} boxSize={4} color={accent} />
    <Text
      fontSize="xs"
      fontWeight="700"
      letterSpacing="0.08em"
      textTransform="uppercase"
      color={accent}
    >
      {label}
    </Text>
  </HStack>
);

const FieldInput = ({ label, icon, ...props }) => (
  <FormControl>
    <FormLabel
      fontSize="xs"
      fontWeight="600"
      color="surface.500"
      mb={1.5}
    >
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
      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
      _placeholder={{ color: 'surface.600', fontSize: 'sm' }}
      {...props}
    />
  </FormControl>
);

const Settings = () => {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Success/error
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      setProfile(data);
      setDisplayName(data.display_name || '');
      setUsername(data.username || '');
      setPhone(data.phone || '');
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Avatar must be under 2MB',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
    setUploadingAvatar(false);

    toast({
      title: 'Avatar updated',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileSaved(false);

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
      setProfileSaved(true);
      setProfile((prev) => ({
        ...prev,
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
      }));
      setTimeout(() => setProfileSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordChanged(false);

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Must be at least 6 characters',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setChangingPassword(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect');

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordChanged(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChanged(false), 3000);
    } catch (err) {
      toast({
        title: 'Password change failed',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Box p={{ base: 4, md: 6 }}>
        <Text color="surface.500" fontSize="sm">Loading settings...</Text>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch" maxW="520px">

        {/* Page header */}
        <Box>
          <Text fontSize="2xl" fontWeight="700" color="white">Settings</Text>
          <Text color="surface.500" fontSize="sm" mt={0.5}>
            Manage your profile and account
          </Text>
        </Box>

        {/* === PROFILE SECTION === */}
        <Box
          bg="surface.900"
          border="1px solid"
          borderColor="surface.800"
          borderRadius="xl"
          p={{ base: 5, md: 6 }}
        >
          <VStack spacing={5} align="stretch">
            <SectionHeader icon={TbUser} label="Profile" />

            {/* Avatar */}
            <Center>
              <Box position="relative">
                <Avatar
                  size="xl"
                  name={displayName || username || 'NB'}
                  src={profile?.avatar_url || ''}
                  bg="surface.700"
                  color="brand.500"
                  border="3px solid"
                  borderColor="surface.700"
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                  opacity={uploadingAvatar ? 0.5 : 1}
                  transition="all 0.2s"
                  _hover={{ borderColor: 'brand.500' }}
                />
                <Center
                  position="absolute"
                  bottom={0}
                  right={0}
                  w="28px"
                  h="28px"
                  borderRadius="full"
                  bg="brand.500"
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                  transition="all 0.2s"
                  _hover={{ bg: 'brand.400', transform: 'scale(1.1)' }}
                >
                  <Icon as={TbCamera} boxSize={3.5} color="surface.950" />
                </Center>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
              </Box>
            </Center>

            {/* Fields */}
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

            {/* Email (read-only) */}
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
                bg="surface.850"
              >
                <Icon as={TbMail} boxSize={4} color="surface.600" />
                <Text fontSize="sm" color="surface.500">{user?.email}</Text>
              </HStack>
            </FormControl>

            {/* Role badge */}
            <HStack spacing={2}>
              <Icon as={TbShield} boxSize={4} color="accent.purple" />
              <Text fontSize="xs" fontWeight="600" color="accent.purple" textTransform="uppercase" letterSpacing="0.05em">
                {profile?.role || 'admin'}
              </Text>
            </HStack>

            {/* Save */}
            <Button
              w="100%"
              h="44px"
              borderRadius="xl"
              fontSize="sm"
              fontWeight="700"
              isLoading={saving}
              loadingText="Saving..."
              onClick={handleSaveProfile}
              leftIcon={profileSaved ? <TbCheck /> : undefined}
              bg={profileSaved ? 'accent.neon' : 'brand.500'}
              color="surface.950"
              _hover={{
                bg: profileSaved ? 'accent.neon' : 'brand.400',
                transform: 'translateY(-1px)',
              }}
              _active={{ transform: 'translateY(0)' }}
            >
              {profileSaved ? 'Saved' : 'Save Profile'}
            </Button>
          </VStack>
        </Box>

        {/* === PASSWORD SECTION === */}
        <Box
          bg="surface.900"
          border="1px solid"
          borderColor="surface.800"
          borderRadius="xl"
          p={{ base: 5, md: 6 }}
        >
          <VStack spacing={5} align="stretch">
            <SectionHeader icon={TbLock} label="Password" accent="accent.banana" />

            <FieldInput
              label="Current password"
              type="password"
              placeholder="current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />

            <FieldInput
              label="New password"
              type="password"
              placeholder="new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />

            <FieldInput
              label="Confirm new password"
              type="password"
              placeholder="confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            <Button
              w="100%"
              h="44px"
              borderRadius="xl"
              fontSize="sm"
              fontWeight="700"
              isLoading={changingPassword}
              loadingText="Updating..."
              onClick={handleChangePassword}
              isDisabled={!currentPassword || !newPassword || !confirmPassword}
              leftIcon={passwordChanged ? <TbCheck /> : undefined}
              bg={passwordChanged ? 'accent.neon' : 'accent.banana'}
              color="surface.950"
              _hover={{
                bg: passwordChanged ? 'accent.neon' : '#E6CE00',
                transform: 'translateY(-1px)',
              }}
              _active={{ transform: 'translateY(0)' }}
              _disabled={{
                opacity: 0.3,
                cursor: 'not-allowed',
                _hover: { transform: 'none' },
              }}
            >
              {passwordChanged ? 'Password Updated' : 'Change Password'}
            </Button>
          </VStack>
        </Box>

        {/* === ACCOUNT INFO === */}
        <Box
          bg="surface.900"
          border="1px solid"
          borderColor="surface.800"
          borderRadius="xl"
          p={{ base: 5, md: 6 }}
        >
          <VStack spacing={4} align="stretch">
            <SectionHeader icon={GiBananaPeeled} label="System" accent="accent.warm" />

            <HStack justify="space-between">
              <Text fontSize="xs" color="surface.500">User ID</Text>
              <Text fontSize="xs" color="surface.600" fontFamily="mono">{user?.id?.slice(0, 12)}...</Text>
            </HStack>

            <Divider borderColor="surface.800" />

            <HStack justify="space-between">
              <Text fontSize="xs" color="surface.500">Auth provider</Text>
              <Text fontSize="xs" color="surface.600" fontFamily="mono">supabase</Text>
            </HStack>

            <Divider borderColor="surface.800" />

            <HStack justify="space-between">
              <Text fontSize="xs" color="surface.500">Last sign in</Text>
              <Text fontSize="xs" color="surface.600" fontFamily="mono">
                {user?.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })
                  : '--'}
              </Text>
            </HStack>

            <Divider borderColor="surface.800" />

            <HStack justify="space-between">
              <Text fontSize="xs" color="surface.500">Version</Text>
              <Text fontSize="xs" color="brand.500" fontFamily="mono" fontWeight="600">PULSE v1.0</Text>
            </HStack>
          </VStack>
        </Box>

      </VStack>
    </Box>
  );
};

export default Settings;