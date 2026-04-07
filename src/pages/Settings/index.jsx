// src/pages/Settings/index.jsx
import { useState, useEffect } from 'react';
import { Box, VStack, Container, Spinner, Divider } from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import SettingsHeader from './components/SettingsHeader';
import SettingsAvatar from './components/SettingsAvatar';
import SettingsProfile from './components/SettingsProfile';
import SettingsPassword from './components/SettingsPassword';
import SettingsTeam from './components/SettingsTeam';
import SettingsAccountInfo from './components/SettingsAccountInfo';
import SettingsFooter from './components/SettingsFooter';

const SectionDivider = () => (
  <Divider borderColor="surface.850" my={2} />
);

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
      {/* Ambient background - same as login */}
      <Box
        position="absolute"
        top="-200px"
        left="50%"
        transform="translateX(-50%)"
        w="800px"
        h="800px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0,229,229,0.04) 0%, transparent 60%)"
        pointerEvents="none"
      />

      <Container
        maxW={{ base: '100%', md: '640px' }}
        px={{ base: 4, md: 8 }}
        py={{ base: 6, md: 12 }}
        position="relative"
      >
        <VStack spacing={{ base: 8, md: 10 }} align="stretch">
          <SettingsHeader />

          <SettingsAvatar
            user={user}
            profile={profile}
            setProfile={setProfile}
          />

          <SectionDivider />

          <SettingsProfile
            user={user}
            profile={profile}
            setProfile={setProfile}
          />

          <SectionDivider />

          <SettingsPassword user={user} />

          {isOwner && (
            <>
              <SectionDivider />
              <SettingsTeam currentUserId={user.id} />
            </>
          )}

          <SectionDivider />

          <SettingsAccountInfo user={user} profile={profile} />

          <SettingsFooter user={user} />
        </VStack>
      </Container>
    </Box>
  );
};

export default Settings;