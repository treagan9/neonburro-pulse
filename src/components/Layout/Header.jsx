// src/components/Layout/Header.jsx
// Top header bar — minimal on desktop, user menu on mobile + tablet.
// Repainted to warmed near-black tokens. No hardcoded surface hexes.
//
// Desktop (lg+): empty (sidebar shows everything). Below lg: avatar dropdown.

import { useState, useEffect } from 'react';
import {
  Box, Text, Menu, MenuButton, MenuList,
  MenuItem, MenuDivider, useBreakpointValue,
} from '@chakra-ui/react';
import { TbSettings, TbLogout } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Avatar from '../common/Avatar';

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const showAvatar = useBreakpointValue({ base: true, lg: false });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url, role')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled && data) setProfile(data);
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [user?.id]);

  const displayName =
    profile?.display_name ||
    profile?.username ||
    user?.email?.split('@')[0] ||
    'User';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login/');
  };

  if (!showAvatar) return null;

  return (
    <Box position="absolute" top={4} right={4} zIndex={10}>
      <Menu placement="bottom-end">
        <MenuButton as={Box} cursor="pointer" _hover={{ opacity: 0.85 }} transition="opacity 0.15s">
          <Avatar name={displayName} url={profile?.avatar_url} size="sm" />
        </MenuButton>
        <MenuList
          bg="surface.900"
          borderColor="surface.700"
          py={1}
          minW="220px"
          boxShadow="modal"
        >
          <Box px={3} py={2.5}>
            <Text color="text.primary" fontSize="sm" fontWeight="700" noOfLines={1}>
              {displayName}
            </Text>
            <Text color="surface.500" fontSize="xs" noOfLines={1}>
              {user?.email}
            </Text>
            {profile?.role && (
              <Text
                color="accent.purple"
                fontSize="2xs"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.05em"
                fontFamily="mono"
                mt={1}
              >
                {profile.role}
              </Text>
            )}
          </Box>
          <MenuDivider borderColor="surface.800" />
          <MenuItem
            bg="transparent"
            _hover={{ bg: 'surface.800' }}
            icon={<TbSettings />}
            fontSize="sm"
            color="surface.300"
            onClick={() => navigate('/settings/')}
          >
            Settings
          </MenuItem>
          <MenuItem
            bg="transparent"
            _hover={{ bg: 'surface.800' }}
            icon={<TbLogout />}
            fontSize="sm"
            color="accent.coral"
            onClick={handleSignOut}
          >
            Sign Out
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
};

export default Header;
