// src/components/Layout/Sidebar.jsx
// SENTINEL: NB_PULSE_SIDEBAR_V2
//
// ── WHAT CHANGED AND WHY ────────────────────────────────────────────────────
//
// THE LOCKUP. V1 opened with the signed in user's avatar, then the word Pulse,
// then their name underneath. So the first thing in the app was a photograph of
// whoever was looking at it, and neonburro appeared nowhere in the shell at all.
// It now opens with the same burro mark the marketing site puts in its nav, the
// product name, and the house name under it. The user moved to the bottom, next
// to Settings, which is where an account lives in every tool anybody already
// knows how to use.
//
// TYPE. V1 ran 700 weight labels. The marketing site runs 600 with tight
// negative tracking, and that single difference is most of what made Pulse feel
// like a different company. Labels are 500, the active one is 600, and nothing
// in the shell is bolder than that.
//
// THE ACTIVE MARK. Kept, because it works. A 3px lime bar on the left edge with
// a soft glow, which is the same signal the bottom bar uses so the two navs
// agree about what selected looks like.
//
// NAV COMES FROM lib/nav.js. This file no longer owns the list. See that file
// for the two bugs that caused.
//
// No oxford commas, no em dashes.

import { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Icon, Tooltip, Image } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { NAV, SETTINGS_ITEM, isActivePath } from '../../lib/nav';
import colors from '../../theme/colors';
import { SIDEBAR_W, SIDEBAR_W_COLLAPSED, EASE, FAST, SLOW } from '../../theme/layout';
import Avatar from '../common/Avatar';

const GLOW = `0 0 10px ${colors.accent.signal}66`;

const Sidebar = ({ collapsed = false, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled && data) setProfile(data);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const name = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'You';
  const active = (path) => isActivePath(location.pathname, path);

  return (
    <Box
      as="nav"
      aria-label="Primary"
      w={collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W}
      h="100vh"
      bg="surface.950"
      borderRight="1px solid"
      borderColor="divider.soft"
      position="fixed"
      left={0}
      top={0}
      display={{ base: 'none', lg: 'flex' }}
      flexDirection="column"
      transition={`width ${SLOW} ${EASE}`}
      zIndex={10}
    >
      {/* ── the lockup ─────────────────────────────────────────────────── */}
      <Box
        as="button"
        onClick={() => navigate('/today/')}
        px={collapsed ? 0 : 5}
        py={6}
        display="flex"
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'flex-start'}
        gap={3}
        transition={`opacity ${FAST} ${EASE}`}
        _hover={{ opacity: 0.85 }}
        aria-label="Pulse, go to Today"
      >
        <Image src="/logo-main.png" alt="" w="28px" h="28px" flexShrink={0} draggable={false} />
        {!collapsed && (
          <Box textAlign="left" minW={0}>
            <Text color="text.primary" fontWeight="600" fontSize="15px"
              letterSpacing="-0.02em" lineHeight="1.1">
              Pulse
            </Text>
            <Text color="surface.500" fontFamily="mono" fontSize="9px"
              letterSpacing="0.14em" lineHeight="1.5" textTransform="lowercase">
              neonburro
            </Text>
          </Box>
        )}
      </Box>

      {/* ── the pages ──────────────────────────────────────────────────── */}
      <VStack spacing={0.5} px={collapsed ? 2.5 : 3} pt={2} align="stretch" flex={1}>
        {NAV.map((item) => (
          <NavButton key={item.path} item={item} active={active(item.path)}
            collapsed={collapsed} onClick={() => navigate(item.path)} />
        ))}
      </VStack>

      {/* ── you, then settings, then the toggle ────────────────────────── */}
      <VStack spacing={0.5} px={collapsed ? 2.5 : 3} pt={3} pb={3} align="stretch"
        borderTop="1px solid" borderColor="divider.soft">

        <Box as="button" onClick={() => navigate('/settings/')}
          h="44px" px={collapsed ? 0 : 2} borderRadius="10px"
          display="flex" alignItems="center" gap={3}
          justifyContent={collapsed ? 'center' : 'flex-start'}
          transition={`background ${FAST} ${EASE}`}
          _hover={{ bg: 'surface.900' }}>
          <Avatar name={name} url={profile?.avatar_url} size="xs" presence="online" />
          {!collapsed && (
            <Text color="surface.400" fontSize="xs" fontWeight="500" noOfLines={1} textAlign="left">
              {name}
            </Text>
          )}
        </Box>

        <NavButton item={SETTINGS_ITEM} active={active(SETTINGS_ITEM.path)}
          collapsed={collapsed} onClick={() => navigate(SETTINGS_ITEM.path)} />

        <Tooltip label={collapsed ? 'Expand' : 'Collapse'} placement="right" hasArrow
          bg="surface.800" color="text.primary" fontSize="xs" openDelay={400}>
          <Box as="button" onClick={onToggle} h="34px" w="100%" mt={1} borderRadius="10px"
            color="surface.600" display="flex" alignItems="center"
            justifyContent={collapsed ? 'center' : 'flex-end'} px={collapsed ? 0 : 3}
            transition={`all ${FAST} ${EASE}`}
            _hover={{ bg: 'surface.900', color: 'text.primary' }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <Icon as={collapsed ? TbChevronRight : TbChevronLeft} boxSize={3.5} />
          </Box>
        </Tooltip>
      </VStack>
    </Box>
  );
};

const NavButton = ({ item, active, collapsed, onClick }) => {
  const button = (
    <Box
      as="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      h="42px"
      w="100%"
      px={collapsed ? 0 : 3}
      borderRadius="10px"
      bg={active ? 'surface.900' : 'transparent'}
      color={active ? 'text.primary' : 'surface.500'}
      display="flex"
      alignItems="center"
      justifyContent={collapsed ? 'center' : 'flex-start'}
      gap={collapsed ? 0 : 3}
      position="relative"
      transition={`all ${FAST} ${EASE}`}
      _hover={{ bg: 'surface.900', color: 'text.primary' }}
    >
      {active && (
        <Box position="absolute" left="-12px" top="50%" transform="translateY(-50%)"
          w="3px" h="18px" borderRadius="full" bg="brand.500" boxShadow={GLOW} />
      )}
      <Icon as={item.icon} boxSize={collapsed ? '19px' : '17px'} flexShrink={0}
        color={active ? 'brand.500' : 'inherit'} />
      {!collapsed && (
        <Text fontSize="sm" fontWeight={active ? '600' : '500'} letterSpacing="-0.01em">
          {item.label}
        </Text>
      )}
    </Box>
  );

  if (!collapsed) return button;
  return (
    <Tooltip label={item.label} placement="right" hasArrow bg="surface.800"
      color="text.primary" fontSize="xs" openDelay={400}>
      {button}
    </Tooltip>
  );
};

export default Sidebar;
