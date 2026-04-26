// src/pages/Settings/index.jsx
// Settings page - kicker only, no big title.
// Form column stays narrow (640px) for focused editing - this page is
// intentionally tighter than Dashboard/Clients/Invoicing because it's
// a vertical edit surface, not a list.

import { useState, useEffect } from 'react';
import { Box, VStack, Spinner, Divider } from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { PAGE_AMBIENT_GLOW_PROPS } from '../../lib/uiConstants';
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
      <Box {...PAGE_AMBIENT_GLOW_PROPS} />

      {/* Centered narrow column - settings is a form surface, not a list */}
      <Box maxW="640px" mx="auto" position="relative">
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
      </Box>
    </Box>
  );
};

export default Settings;
