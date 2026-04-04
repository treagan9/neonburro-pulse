// src/components/Layout/AppShell.jsx
// Main layout shell - sidebar + header + content + mobile nav
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
        <Box as="main" w="100%" maxW="100%" pb={{ base: '80px', lg: 0 }}>
          <Outlet />
        </Box>
      </Box>
      <MobileNav />
    </Flex>
  );
};

export default AppShell;
