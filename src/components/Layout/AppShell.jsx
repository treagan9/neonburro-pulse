// src/components/Layout/AppShell.jsx
// Admin shell — unified layout that wraps every protected page.
// - Sidebar: fixed left, 240px expanded / 64px collapsed, persisted via profile
// - Content: max 1400px centered, responsive gutters, consistent rhythm
// - Mobile: full-bleed with bottom tab bar (5 icons + More sheet)
//
// Container math: content width scales from 100% (mobile) → 95% (desktop) → max 1400px

import { useState, useEffect } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const AppShell = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load collapsed preference from profiles on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('sidebar_collapsed')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled && data) {
        setCollapsed(!!data.sidebar_collapsed);
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Toggle + persist — optimistic local update, background write
  const toggleCollapsed = async () => {
    const next = !collapsed;
    setCollapsed(next);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ sidebar_collapsed: next })
      .eq('id', user.id);
  };

  const sidebarWidth = collapsed ? '64px' : '240px';

  return (
    <Flex minH="100vh" bg="surface.950">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        loaded={loaded}
      />

      <Box
        flex={1}
        ml={{ base: 0, lg: sidebarWidth }}
        minH="100vh"
        transition="margin-left 240ms cubic-bezier(0.4, 0, 0.2, 1)"
        display="flex"
        flexDirection="column"
      >
        <Header />

        <Box
          as="main"
          w="100%"
          maxW="1400px"
          mx="auto"
          flex={1}
          px={{ base: 4, sm: 5, md: 6, lg: 8, xl: 10 }}
          py={{ base: 5, md: 8, lg: 10 }}
          pb={{ base: '88px', lg: 10 }}
        >
          <Outlet />
        </Box>
      </Box>

      <MobileNav />
    </Flex>
  );
};

export default AppShell;
