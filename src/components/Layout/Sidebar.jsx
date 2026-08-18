// src/components/Layout/Sidebar.jsx
// SENTINEL: NB_PULSE_SIDEBAR_V3
//
// The rail, repainted onto the warm chrome (colors.chrome). V2 ran cool
// near-black surface tokens with a 1px right border, which is what made the dark
// half look like a different product from the cream half. There is no border
// now: the rail IS the dark frame, and the cream sheet next to it rounds its own
// left corners, so the separation is a soft reveal instead of a hard line.
//
// Everything structural is unchanged from V2 and still true: the lockup is the
// burro mark, the product name and the house name (never the user's face); the
// user lives at the bottom next to Settings; labels are 500 weight, the active
// one 600, nothing bolder; the active mark is a 3px lime bar with a soft glow,
// the same signal the bottom pill uses. NAV still comes from lib/nav.js.
//
// No oxford commas, no em dashes.

import { useState, useEffect } from 'react';
import { Box, VStack, Text, Icon, Tooltip, Image } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { NAV, SETTINGS_ITEM, isActivePath } from '../../lib/nav';
import colors from '../../theme/colors';
import { SIDEBAR_W, SIDEBAR_W_COLLAPSED, EASE, FAST, SLOW } from '../../theme/layout';
import Avatar from '../common/Avatar';

const C = colors.chrome;
const LIME = colors.paper.lime;
const GLOW = `0 0 10px ${LIME}66`;

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
      position="fixed"
      left={3}
      top={3}
      bottom={3}
      bg={C.ground}
      borderRadius="24px"
      overflow="hidden"
      boxShadow="0 10px 34px rgba(36,26,22,0.18)"
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
            <Text color={C.text} fontWeight="600" fontSize="15px" letterSpacing="-0.02em" lineHeight="1.1">
              Pulse
            </Text>
            <Text color={C.textFaint} fontFamily="mono" fontSize="9px" letterSpacing="0.14em" lineHeight="1.5" textTransform="lowercase">
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
        borderTop="1px solid" borderColor={C.line}>

        <Box as="button" onClick={() => navigate('/settings/')}
          h="44px" px={collapsed ? 0 : 2} borderRadius="10px"
          display="flex" alignItems="center" gap={3}
          justifyContent={collapsed ? 'center' : 'flex-start'}
          transition={`background ${FAST} ${EASE}`}
          _hover={{ bg: C.raised }}>
          <Avatar name={name} url={profile?.avatar_url} size="xs" presence="online" />
          {!collapsed && (
            <Text color={C.textMuted} fontSize="xs" fontWeight="500" noOfLines={1} textAlign="left">
              {name}
            </Text>
          )}
        </Box>

        <NavButton item={SETTINGS_ITEM} active={active(SETTINGS_ITEM.path)}
          collapsed={collapsed} onClick={() => navigate(SETTINGS_ITEM.path)} />

        <Tooltip label={collapsed ? 'Expand' : 'Collapse'} placement="right" hasArrow
          bg={C.raised} color={C.text} fontSize="xs" openDelay={400}>
          <Box as="button" onClick={onToggle} h="34px" w="100%" mt={1} borderRadius="10px"
            color={C.textFaint} display="flex" alignItems="center"
            justifyContent={collapsed ? 'center' : 'flex-end'} px={collapsed ? 0 : 3}
            transition={`all ${FAST} ${EASE}`}
            _hover={{ bg: C.raised, color: C.text }}
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
      bg={active ? C.raised : 'transparent'}
      color={active ? C.text : C.textMuted}
      display="flex"
      alignItems="center"
      justifyContent={collapsed ? 'center' : 'flex-start'}
      gap={collapsed ? 0 : 3}
      position="relative"
      transition={`all ${FAST} ${EASE}`}
      _hover={{ bg: C.raised, color: C.text }}
    >
      {active && (
        <Box position="absolute" left="-12px" top="50%" transform="translateY(-50%)"
          w="3px" h="18px" borderRadius="full" bg={LIME} boxShadow={GLOW} />
      )}
      <Icon as={item.icon} boxSize={collapsed ? '19px' : '17px'} flexShrink={0}
        color={active ? LIME : 'inherit'} />
      {!collapsed && (
        <Text fontSize="sm" fontWeight={active ? '600' : '500'} letterSpacing="-0.01em">
          {item.label}
        </Text>
      )}
    </Box>
  );

  if (!collapsed) return button;
  return (
    <Tooltip label={item.label} placement="right" hasArrow bg={C.raised}
      color={C.text} fontSize="xs" openDelay={400}>
      {button}
    </Tooltip>
  );
};

export default Sidebar;
