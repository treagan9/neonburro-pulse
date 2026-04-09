// src/components/Layout/Sidebar.jsx
// Icon-free nav, Projects removed - clients are the source of truth
import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Divider, Avatar,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const NAV_ITEMS = [
  { path: '/dashboard/', label: 'Dashboard' },
  { path: '/clients/', label: 'Clients' },
  { path: '/invoicing/', label: 'Invoicing' },
  { path: '/forms/', label: 'Forms' },
  { path: '/calendar/', label: 'Calendar' },
  { path: '/analytics/', label: 'Analytics' },
  { path: '/settings/', label: 'Settings' },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => { if (data) setProfile(data); });
    }
  }, [user]);

  const isActive = (path) => {
    if (path === '/dashboard/') return location.pathname === '/' || location.pathname === '/dashboard/';
    return location.pathname.startsWith(path);
  };

  const displayName = profile?.display_name || profile?.username || 'NeonBurro';

  return (
    <Box
      w="240px"
      h="100vh"
      bg="surface.950"
      borderRight="1px solid"
      borderColor="surface.800"
      position="fixed"
      left={0}
      top={0}
      display={{ base: 'none', lg: 'flex' }}
      flexDirection="column"
    >
      <HStack px={5} py={4} spacing={3}>
        <Avatar
          size="sm"
          name={displayName}
          src={profile?.avatar_url || ''}
          bg="brand.500"
          color="surface.950"
          border="2px solid"
          borderColor="surface.800"
        />
        <Box flex={1} minW={0}>
          <Text color="white" fontWeight="800" fontSize="md" lineHeight="1.2" noOfLines={1}>Pulse</Text>
          <Text color="surface.500" fontSize="2xs" fontFamily="mono" noOfLines={1}>{displayName}</Text>
        </Box>
        <Box w="6px" h="6px" borderRadius="full" bg="accent.neon" boxShadow="0 0 6px rgba(57,255,20,0.5)" />
      </HStack>

      <Divider borderColor="surface.800" />

      <VStack spacing={0.5} px={3} py={3} align="stretch" flex={1}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Box
              key={item.path}
              px={4}
              py={2.5}
              borderRadius="lg"
              cursor="pointer"
              bg={active ? 'surface.850' : 'transparent'}
              color={active ? 'white' : 'surface.500'}
              _hover={{ bg: 'surface.850', color: 'white' }}
              onClick={() => navigate(item.path)}
              transition="all 0.15s"
              position="relative"
            >
              {active && (
                <Box
                  position="absolute"
                  left={0}
                  top="50%"
                  transform="translateY(-50%)"
                  w="3px"
                  h="18px"
                  borderRadius="full"
                  bg="brand.500"
                  boxShadow="0 0 8px rgba(0,229,229,0.6)"
                />
              )}
              <Text
                fontSize="sm"
                fontWeight={active ? '700' : '500'}
                letterSpacing={active ? '-0.01em' : '0'}
              >
                {item.label}
              </Text>
            </Box>
          );
        })}
      </VStack>

      <Box px={5} py={3} borderTop="1px solid" borderColor="surface.800">
        <Text color="surface.700" fontSize="2xs" fontFamily="mono">PULSE v1.0</Text>
      </Box>
    </Box>
  );
};

export default Sidebar;