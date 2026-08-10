// src/components/Layout/AppShell.jsx
// SENTINEL: NB_PULSE_SHELL_V2
//
// The frame every protected page renders inside.
//
// ── THE ONE REAL CHANGE ─────────────────────────────────────────────────────
// V1 wrapped content in maxW 1400px with mx auto, so on any monitor wider than
// about 1650px the app drifted into the middle of the screen while the sidebar
// stayed pinned to the left edge. The gap between the nav and the first column
// of a table grew as the window did, which is the opposite of what a dense tool
// should do with more room.
//
// Content is left aligned now. SHEET still caps the width so a table cannot run
// three thousand pixels wide, it just does not centre what it caps. That is the
// same call the marketing site documents in its own layout file, and it is the
// only call that lets a fixed sidebar and a page heading share a left edge.
//
// The gutter also went from five steps to one. base 20px, md and up 28px.
//
// ── MOBILE ──────────────────────────────────────────────────────────────────
// Bottom padding is TABBAR_PAD, which is the bar height plus the iOS safe area
// plus breathing room, so the last row of any list clears the tabs on a notched
// phone instead of sitting one pixel under them.
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
import {
  RAIL, SHEET, SIDEBAR_W, SIDEBAR_W_COLLAPSED, TABBAR_PAD, BAND_Y, EASE, SLOW,
} from '../../theme/layout';

const AppShell = ({ children }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Loaded in the background. The sidebar renders expanded immediately rather
  // than waiting on a round trip, because a nav that appears half a second late
  // is worse than one that occasionally starts a pixel wide.
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
    <Flex minH="100vh" bg="surface.950">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <Box
        flex={1}
        minW={0}
        ml={{ base: 0, lg: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W }}
        minH="100vh"
        transition={`margin-left ${SLOW} ${EASE}`}
        display="flex"
        flexDirection="column"
      >
        <Header />

        <Box
          as="main"
          w="100%"
          maxW={SHEET}
          flex={1}
          px={RAIL}
          pt={BAND_Y}
          pb={{ base: TABBAR_PAD, lg: 10 }}
        >
          {children || <Outlet />}
        </Box>
      </Box>

      <MobileNav />
    </Flex>
  );
};

export default AppShell;
