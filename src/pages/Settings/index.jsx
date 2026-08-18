// src/pages/Settings/index.jsx
// Settings, on Paper. A narrow centered edit column (640px), kicker only, no big
// title, because this is a vertical edit surface not a list. Team management is
// visible to super_admin and admin. No oxford commas, no dashes.

import { useState, useEffect } from 'react';
import { Box, VStack, Spinner, Divider } from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';
import SettingsHeader from './components/SettingsHeader';
import SettingsAvatar from './components/SettingsAvatar';
import SettingsProfile from './components/SettingsProfile';
import SettingsPassword from './components/SettingsPassword';
import SettingsTeam from './components/SettingsTeam';
import SettingsAccountInfo from './components/SettingsAccountInfo';
import SettingsFooter from './components/SettingsFooter';

const P = colors.paper;
const SectionDivider = () => <Divider borderColor={P.hair} my={2} />;

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchProfile(); }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!error && data) setProfile(data);
    setLoading(false);
  };

  const canManageTeam = ['super_admin', 'admin'].includes(profile?.role);

  if (loading) {
    return (
      <Box minH="100vh" bg={P.mat} display="flex" alignItems="center" justifyContent="center">
        <Spinner size="md" color={P.limeDeep} thickness="2px" />
      </Box>
    );
  }

  return (
    <Box position="relative" minH="100vh" bg={P.mat}>
      <Box position="absolute" top={0} left={0} right={0} h="300px" bg={`radial-gradient(ellipse at top center, ${P.lime}12, transparent 70%)`} pointerEvents="none" />

      <Box maxW="640px" mx="auto" px={{ base: 5, md: 8 }} py={{ base: 8, md: 12 }} position="relative">
        <VStack spacing={{ base: 8, md: 10 }} align="stretch">
          <SettingsHeader />
          <SettingsAvatar user={user} profile={profile} setProfile={setProfile} />
          <SectionDivider />
          <SettingsProfile user={user} profile={profile} setProfile={setProfile} />
          <SectionDivider />
          <SettingsPassword user={user} />
          {canManageTeam && (
            <>
              <SectionDivider />
              <SettingsTeam currentUserId={user.id} currentUserRole={profile?.role} />
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
