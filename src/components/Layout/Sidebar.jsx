// src/components/Layout/Sidebar.jsx
// NeonBurro Pulse sidebar navigation
import { Box, VStack, HStack, Text, Icon, Divider } from '@chakra-ui/react';
import {
  TbHome, TbUsers, TbRocket, TbFileInvoice,
  TbInbox, TbCalendar, TbChartBar, TbSettings,
} from 'react-icons/tb';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard/', label: 'Dashboard', icon: TbHome },
  { path: '/clients/', label: 'Clients', icon: TbUsers },
  { path: '/projects/', label: 'Projects', icon: TbRocket },
  { path: '/invoicing/', label: 'Invoicing', icon: TbFileInvoice },
  { path: '/forms/', label: 'Forms', icon: TbInbox },
  { path: '/calendar/', label: 'Calendar', icon: TbCalendar },
  { path: '/analytics/', label: 'Analytics', icon: TbChartBar },
  { path: '/settings/', label: 'Settings', icon: TbSettings },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/dashboard/') return location.pathname === '/' || location.pathname === '/dashboard/';
    return location.pathname.startsWith(path);
  };

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
      display={{ base: 'none', lg: 'block' }}
    >
      {/* Logo */}
      <HStack px={6} py={5} spacing={3}>
        <Box
          w="32px"
          h="32px"
          borderRadius="lg"
          bg="brand.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="sm" fontWeight="800" color="surface.950">NB</Text>
        </Box>
        <Box>
          <Text color="white" fontWeight="800" fontSize="lg" lineHeight="1.2">Pulse</Text>
          <Text color="surface.500" fontSize="xs">NeonBurro</Text>
        </Box>
      </HStack>

      <Divider borderColor="surface.800" />

      {/* Nav items */}
      <VStack spacing={1} px={3} py={4} align="stretch">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <HStack
              key={item.path}
              px={3}
              py={2.5}
              borderRadius="lg"
              cursor="pointer"
              bg={active ? 'surface.800' : 'transparent'}
              color={active ? 'white' : 'surface.400'}
              _hover={{ bg: 'surface.850', color: 'white' }}
              onClick={() => navigate(item.path)}
              transition="all 0.15s"
            >
              <Icon as={item.icon} boxSize={5} color={active ? 'brand.500' : 'inherit'} />
              <Text fontSize="sm" fontWeight={active ? '600' : '500'}>{item.label}</Text>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
};

export default Sidebar;
