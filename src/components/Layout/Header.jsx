// src/components/Layout/Header.jsx
// Top header bar - minimal on desktop, user menu only on mobile
//
// Desktop: empty (sidebar shows everything)
// Mobile: avatar dropdown for Settings/Sign Out (hamburger handles nav)

import {
  Box, HStack, Text, Avatar as ChakraAvatar, Menu, MenuButton, MenuList,
  MenuItem, MenuDivider, useBreakpointValue,
} from '@chakra-ui/react';
import { TbSettings, TbLogout } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const Header = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login/');
  };

  // Desktop: no header content - sidebar is the source of truth
  if (!isMobile) {
    return null;
  }

  // Mobile: just the avatar dropdown for account actions
  // (the hamburger menu in MobileNav handles navigation)
  return (
    <Box
      position="absolute"
      top={4}
      right={4}
      zIndex={10}
    >
      <Menu placement="bottom-end">
        <MenuButton
          as={Box}
          cursor="pointer"
          _hover={{ opacity: 0.85 }}
          transition="opacity 0.15s"
        >
          <ChakraAvatar
            size="sm"
            name={displayName}
            src={profile?.avatar_url || ''}
            bg="surface.700"
            color="brand.500"
            border="2px solid"
            borderColor="surface.700"
          />
        </MenuButton>
        <MenuList bg="surface.900" borderColor="surface.700" py={1} minW="200px">
          <Box px={3} py={2}>
            <Text color="white" fontSize="sm" fontWeight="700">
              {displayName}
            </Text>
            <Text color="surface.500" fontSize="xs">
              {user?.email}
            </Text>
            {profile?.role && (
              <Text
                color="accent.purple"
                fontSize="2xs"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.05em"
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
            color="surface.300"
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
