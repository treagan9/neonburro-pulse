// src/components/Layout/AppShell.jsx
// SENTINEL: NB_PULSE_SHELL_V3
//
// The frame every protected page renders inside, rebuilt as warm dark chrome
// holding a rounded cream sheet.
//
// ── WHAT V3 CHANGES AND WHY ─────────────────────────────────────────────────
// V2 was a cool near-black sidebar butting a cream page along a hard 1px seam,
// two different temperatures meeting at a line, and the page's own padding sat
// INSIDE this file's px rail so the content was pushed twice off the left edge,
// which read as dead space. Tyler's note, verbatim in spirit: make it look like
// a good portal, blend the colors, kill the dead space, the sidebar can stay
// dark.
//
// So: the whole shell now sits on chrome.ground, a WARM near-black in the same
// family as the cream (see colors.chrome). The sidebar is that same dark, no
// border, so it reads as the frame not a panel. The content is a cream sheet
// (paper.mat) with its LEFT corners rounded, lifting off the dark rail like a
// sheet of paper on a desk. That single rounded reveal is the whole blend.
//
// PADDING moved out. Every converted page owns its own px, minH and maxW, so this
// file adds none. That removes the double inset that was the dead space.
//
// SCROLL is split by breakpoint. On desktop the sheet is a fixed-height panel
// that scrolls its own content, so the rounded corners stay put and the dark
// frame never scrolls. On a phone there is no rail and no rounding, so the window
// scrolls normally and the bottom pill floats over it. pb clears the pill.
//
// No oxford commas, no em dashes.

import { useState, useEffect } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';
import { SIDEBAR_W, SIDEBAR_W_COLLAPSED, TABBAR_PAD, EASE, SLOW } from '../../theme/layout';

const C = colors.chrome;

const AppShell = ({ children }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Loaded in the background. The sidebar renders expanded immediately rather
  // than waiting on a round trip.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('sidebar_collapsed')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled && data?.sidebar_collapsed) setCollapsed(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const toggle = async () => {
    const next = !collapsed;
    setCollapsed(next);
    if (!user) return;
    await supabase.from('profiles').update({ sidebar_collapsed: next }).eq('id', user.id);
  };

  return (
    // 100dvh, not 100vh: the cream sheet must fill the REAL viewport. On a phone
    // 100vh is the tall pre-scroll value and leaves a dark band under the content
    // once the URL bar collapses, and the fixed pill drops into that band and
    // vanishes against the dark. dvh tracks the live viewport and closes the gap.
    <Flex minH="100dvh" bg={C.ground} align="stretch">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <Box
        flex={1}
        minW={0}
        ml={{ base: 0, lg: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W }}
        minH="100dvh"
        h={{ lg: '100dvh' }}
        transition={`margin-left ${SLOW} ${EASE}`}
        display="flex"
        flexDirection="column"
      >
        <Header />

        <Box
          as="main"
          w="100%"
          flex={1}
          bg={colors.paper.mat}
          borderRadius={{ base: 0, lg: '22px 0 0 22px' }}
          overflowY={{ lg: 'auto' }}
          overflowX={{ lg: 'hidden' }}
          pb={{ base: TABBAR_PAD, lg: 0 }}
          sx={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children || <Outlet />}
        </Box>
      </Box>

      <MobileNav />
    </Flex>
  );
};

export default AppShell;
