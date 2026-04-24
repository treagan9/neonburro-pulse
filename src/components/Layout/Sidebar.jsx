// src/components/Layout/Sidebar.jsx
// Desktop sidebar with expand/collapse toggle.
// - Expanded (240px): avatar + name + full nav labels + settings footer
// - Collapsed (64px): avatar + icon-only nav + tooltips on hover
// - Uses custom Avatar component (same as SettingsAvatar/ActivityStream)
// - Preference persists via profiles.sidebar_collapsed (passed from AppShell)

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Divider, Icon, Tooltip,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  TbLayoutDashboard, TbUsers, TbFileInvoice, TbInbox,
  TbCalendar, TbChartBar, TbSettings,
  TbChevronLeft, TbChevronRight,
} from 'react-icons/tb';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Avatar from '../common/Avatar';

const NAV_ITEMS = [
  { path: '/dashboard/', label: 'Dashboard', icon: TbLayoutDashboard },
  { path: '/clients/',   label: 'Clients',   icon: TbUsers },
  { path: '/invoicing/', label: 'Invoicing', icon: TbFileInvoice },
  { path: '/forms/',     label: 'Forms',     icon: TbInbox },
  { path: '/calendar/',  label: 'Calendar',  icon: TbCalendar },
  { path: '/analytics/', label: 'Analytics', icon: TbChartBar },
];

const FOOTER_ITEM = { path: '/settings/', label: 'Settings', icon: TbSettings };

const Sidebar = ({ collapsed = false, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  // Refetch whenever user changes (not just on mount)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled && data) setProfile(data);
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [user?.id]);

  const isActive = (path) => {
    if (path === '/dashboard/') {
      return location.pathname === '/' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  const displayName = profile?.display_name || profile?.username || 'NeonBurro';

  return (
    <Box
      w={collapsed ? '64px' : '240px'}
      h="100vh"
      bg="surface.950"
      borderRight="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      position="fixed"
      left={0}
      top={0}
      display={{ base: 'none', lg: 'flex' }}
      flexDirection="column"
      transition="width 240ms cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex={10}
    >
      {/* Brand + user identity */}
      <HStack
        px={collapsed ? 2 : 4}
        py={5}
        spacing={collapsed ? 0 : 3}
        justify={collapsed ? 'center' : 'flex-start'}
      >
        <Avatar
          name={displayName}
          url={profile?.avatar_url}
          size="sm"
          presence="online"
        />
        {!collapsed && (
          <Box flex={1} minW={0}>
            <Text color="white" fontWeight="700" fontSize="sm" lineHeight="1.2" noOfLines={1}>
              Pulse
            </Text>
            <Text color="surface.500" fontSize="2xs" fontFamily="mono" noOfLines={1}>
              {displayName}
            </Text>
          </Box>
        )}
      </HStack>

      <Divider borderColor="rgba(255,255,255,0.06)" />

      {/* Primary nav */}
      <VStack
        spacing={0.5}
        px={collapsed ? 2 : 3}
        py={3}
        align="stretch"
        flex={1}
      >
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            active={isActive(item.path)}
            collapsed={collapsed}
            onClick={() => navigate(item.path)}
          />
        ))}
      </VStack>

      {/* Footer: settings + collapse toggle */}
      <VStack
        spacing={0.5}
        px={collapsed ? 2 : 3}
        pt={2}
        pb={3}
        align="stretch"
        borderTop="1px solid"
        borderColor="rgba(255,255,255,0.06)"
      >
        <NavButton
          item={FOOTER_ITEM}
          active={isActive(FOOTER_ITEM.path)}
          collapsed={collapsed}
          onClick={() => navigate(FOOTER_ITEM.path)}
        />

        <Tooltip
          label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          placement="right"
          hasArrow
          bg="surface.800"
          color="white"
          fontSize="xs"
          openDelay={300}
        >
          <Box
            as="button"
            onClick={onToggle}
            h="40px"
            w="100%"
            borderRadius="lg"
            bg="transparent"
            color="surface.500"
            display="flex"
            alignItems="center"
            justifyContent={collapsed ? 'center' : 'flex-end'}
            px={collapsed ? 0 : 3}
            transition="all 160ms cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{ bg: 'surface.900', color: 'white' }}
            mt={1}
          >
            <Icon
              as={collapsed ? TbChevronRight : TbChevronLeft}
              boxSize={4}
            />
          </Box>
        </Tooltip>
      </VStack>

      {!collapsed && (
        <Box px={4} py={2}>
          <Text color="surface.700" fontSize="2xs" fontFamily="mono">
            PULSE ϟ v1.0
          </Text>
        </Box>
      )}
    </Box>
  );
};

const NavButton = ({ item, active, collapsed, onClick }) => {
  const button = (
    <Box
      as="button"
      onClick={onClick}
      h="40px"
      w="100%"
      px={collapsed ? 0 : 4}
      borderRadius="lg"
      bg={active ? 'surface.900' : 'transparent'}
      color={active ? 'white' : 'surface.500'}
      display="flex"
      alignItems="center"
      justifyContent={collapsed ? 'center' : 'flex-start'}
      gap={collapsed ? 0 : 3}
      cursor="pointer"
      position="relative"
      transition="all 160ms cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{ bg: 'surface.900', color: 'white' }}
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
      <Icon as={item.icon} boxSize={collapsed ? 5 : 4} flexShrink={0} />
      {!collapsed && (
        <Text
          fontSize="sm"
          fontWeight={active ? '600' : '500'}
          letterSpacing={active ? '-0.01em' : '0'}
        >
          {item.label}
        </Text>
      )}
    </Box>
  );

  if (collapsed) {
    return (
      <Tooltip
        label={item.label}
        placement="right"
        hasArrow
        bg="surface.800"
        color="white"
        fontSize="xs"
        openDelay={300}
      >
        {button}
      </Tooltip>
    );
  }
  return button;
};

export default Sidebar;
