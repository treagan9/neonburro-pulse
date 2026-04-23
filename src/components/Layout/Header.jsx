// src/components/Layout/Header.jsx
// Top header bar — minimal on desktop, user menu on mobile + tablet
//
// Desktop (lg+ = 1024px+): empty (sidebar shows everything)
// Below lg: avatar dropdown for Settings/Sign Out
//
// Bug fix: previously used md (768px) as threshold which left 768-1023px
// window with no avatar + no sidebar. Now matches sidebar breakpoint (lg).

import {
  Box, Text, Avatar as ChakraAvatar, Menu, MenuButton, MenuList,
  MenuItem, MenuDivider, useBreakpointValue,
} from '@chakra-ui/react';
import { TbSettings, TbLogout } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const Header = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const showAvatar = useBreakpointValue({ base: true, lg: false });

  const displayName =
    profile?.display_name ||
    profile?.username ||
    user?.email?.split('@')[0] ||
    'User';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login/');
  };

  // Desktop (lg+): sidebar handles everything, no header content
  if (!showAvatar) {
    return null;
  }

  // Mobile + tablet: avatar dropdown top-right
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
        <MenuList
          bg="surface.900"
          borderColor="surface.700"
          py={1}
          minW="220px"
          boxShadow="0 12px 40px rgba(0,0,0,0.6)"
        >
          <Box px={3} py={2.5}>
            <Text color="white" fontSize="sm" fontWeight="700" noOfLines={1}>
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
