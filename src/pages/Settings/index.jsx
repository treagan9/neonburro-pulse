// src/pages/Settings/index.jsx
import { useState, useEffect } from 'react';
import { Box, VStack, Container, Text, Spinner, Center, HStack } from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import SettingsHeader from './components/SettingsHeader';
import SettingsAvatar from './components/SettingsAvatar';
import SettingsProfile from './components/SettingsProfile';
import SettingsPassword from './components/SettingsPassword';
import SettingsNotifications from './components/SettingsNotifications';
import SettingsTeam from './components/SettingsTeam';
import SettingsAccountInfo from './components/SettingsAccountInfo';
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

  const isOwner = profile?.role === 'owner';

  if (loading) {
    return (
      <Box minH="60vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="md" color="brand.500" thickness="2px" />
      </Box>
    );
  }

  return (
    <Box position="relative" minH="100%">
      {/* Ambient background */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="400px"
        bg="radial-gradient(ellipse at top center, rgba(0,229,229,0.025), transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="540px" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }} position="relative">
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          <SettingsHeader />

          <SettingsAvatar
            user={user}
            profile={profile}
            setProfile={setProfile}
          />

          <SettingsProfile
            user={user}
            profile={profile}
            setProfile={setProfile}
          />

          <SettingsPassword user={user} />

          <SettingsNotifications user={user} />

          {isOwner && <SettingsTeam currentUserId={user.id} />}

          <SettingsAccountInfo user={user} profile={profile} />

          <SettingsFooter user={user} />
        </VStack>
      </Container>
    </Box>
  );
};

export default Settings;