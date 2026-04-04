// src/pages/Settings/index.jsx
import { useState, useEffect } from 'react';
import { Box, VStack, Text, Divider } from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import SettingsAvatar from './components/SettingsAvatar';
import SettingsProfile from './components/SettingsProfile';
import SettingsPassword from './components/SettingsPassword';
import SettingsFooter from './components/SettingsFooter';

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
    if (!error && data) setProfile(data);
    setLoading(false);
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
      <VStack spacing={8} align="stretch" maxW="400px">
        <Box>
          <Text fontSize="2xl" fontWeight="700" color="white">Settings</Text>
          <Text color="surface.500" fontSize="sm" mt={0.5}>
            Manage your profile and account
          </Text>
        </Box>

        <SettingsAvatar
          user={user}
          profile={profile}
          setProfile={setProfile}
        />

        <Divider borderColor="surface.800" />

        <SettingsProfile
          user={user}
          profile={profile}
          setProfile={setProfile}
        />

        <Divider borderColor="surface.800" />

        <SettingsPassword user={user} />

        <Divider borderColor="surface.800" />

        <SettingsFooter user={user} />
      </VStack>
    </Box>
  );
};

export default Settings;