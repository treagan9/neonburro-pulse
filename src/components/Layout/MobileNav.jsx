// src/components/Layout/MobileNav.jsx
import { Box, HStack, VStack, Icon, Text } from '@chakra-ui/react';
import { TbHome, TbRocket, TbFileInvoice, TbInbox, TbChartBar } from 'react-icons/tb';
import { useLocation, useNavigate } from 'react-router-dom';

const MOBILE_ITEMS = [
  { path: '/dashboard/', label: 'Home', icon: TbHome },
  { path: '/projects/', label: 'Projects', icon: TbRocket },
  { path: '/invoicing/', label: 'Invoices', icon: TbFileInvoice },
  { path: '/forms/', label: 'Forms', icon: TbInbox },
  { path: '/analytics/', label: 'Analytics', icon: TbChartBar },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/dashboard/') return location.pathname === '/' || location.pathname === '/dashboard/';
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      display={{ base: 'block', lg: 'none' }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="surface.950"
      borderTop="1px solid"
      borderColor="surface.800"
      zIndex={20}
      pb="env(safe-area-inset-bottom)"
    >
      <HStack justify="space-around" py={2}>
        {MOBILE_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <VStack
              key={item.path}
              spacing={0.5}
              cursor="pointer"
              onClick={() => navigate(item.path)}
              opacity={active ? 1 : 0.5}
              transition="all 0.15s"
              _hover={{ opacity: 1 }}
              flex={1}
            >
              <Icon
                as={item.icon}
                boxSize={5}
                color={active ? 'brand.500' : 'surface.400'}
              />
              <Text
                fontSize="2xs"
                fontWeight={active ? '600' : '500'}
                color={active ? 'brand.500' : 'surface.400'}
              >
                {item.label}
              </Text>
            </VStack>
          );
        })}
      </HStack>
    </Box>
  );
};

export default MobileNav;
