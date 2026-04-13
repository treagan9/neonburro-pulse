// src/components/Layout/AppShell.jsx
// Main layout shell - sidebar + header + content + mobile nav
// Content is left-tucked with max-w 1100px so it has anchor + breathing room

import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

const AppShell = () => {
  return (
    <Flex minH="100vh" bg="surface.950">
      <Sidebar />
      <Box
        flex={1}
        ml={{ base: 0, lg: '240px' }}
        minH="100vh"
        w={{ base: '100%', lg: 'auto' }}
        maxW="100%"
        overflow="hidden"
      >
        <Header />
        <Box
          as="main"
          w="100%"
          maxW={{ base: '100%', lg: '1100px' }}
          mx={{ base: 0, lg: 0 }}
          px={{ base: 4, md: 8, lg: 10 }}
          pb={{ base: '80px', lg: 0 }}
        >
          <Outlet />
        </Box>
      </Box>
      <MobileNav />
    </Flex>
  );
};

export default AppShell;
