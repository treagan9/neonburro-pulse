// src/components/Layout/Header.jsx
import { useState, useEffect } from 'react';
import {
  Box, HStack, Text, IconButton, Menu, MenuButton, MenuList,
  MenuItem, Avatar, MenuDivider,
} from '@chakra-ui/react';
import { TbLogout, TbSettings, TbChevronDown } from 'react-icons/tb';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('display_name, username, avatar_url, role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => { if (data) setProfile(data); });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login/');
  };

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'User';

  return (
    <Box
      h="56px"
      borderBottom="1px solid"
      borderColor="surface.800"
      bg="surface.950"
      px={{ base: 4, md: 6 }}
      display="flex"
      alignItems="center"
      justifyContent="flex-end"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Menu>
        <MenuButton
          as={Box}
          cursor="pointer"
          borderRadius="full"
          transition="all 0.15s"
          _hover={{ opacity: 0.85 }}
        >
          <HStack spacing={2.5}>
            <Text
              color="surface.400"
              fontSize="xs"
              fontWeight="600"
              display={{ base: 'none', md: 'block' }}
            >
              {displayName}
            </Text>
            <Avatar
              size="sm"
              name={displayName}
              src={profile?.avatar_url || ''}
              bg="surface.700"
              color="brand.500"
              border="2px solid"
              borderColor="surface.700"
            />
          </HStack>
        </MenuButton>
        <MenuList bg="surface.900" borderColor="surface.700" py={1} minW="200px">
          <Box px={3} py={2}>
            <Text color="white" fontSize="sm" fontWeight="700">{displayName}</Text>
            <Text color="surface.500" fontSize="xs">{user?.email}</Text>
            {profile?.role && (
              <Text color="accent.purple" fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em" mt={1}>
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