// src/components/Layout/MobileNav.jsx
// Bottom tab bar for mobile — 5 icon-only tabs + More sheet.
//
// Primary tabs: Dashboard, Clients, Invoicing, Projects, More
// More sheet opens a full-screen modal with Forms, Analytics, Calendar, Settings, Sign Out

import { useState } from 'react';
import {
  Box, HStack, VStack, Icon, Text, Modal, ModalOverlay, ModalContent,
  ModalBody, ModalCloseButton, Divider,
} from '@chakra-ui/react';
import {
  TbLayoutDashboard, TbUsers, TbFileInvoice, TbRocket, TbDotsVertical,
  TbInbox, TbChartBar, TbCalendar, TbSettings, TbLogout,
} from 'react-icons/tb';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const PRIMARY_TABS = [
  { path: '/dashboard/', icon: TbLayoutDashboard, label: 'Dashboard' },
  { path: '/clients/',   icon: TbUsers,           label: 'Clients' },
  { path: '/invoicing/', icon: TbFileInvoice,     label: 'Invoicing' },
  { path: '/projects/',  icon: TbRocket,          label: 'Projects' },
];

const MORE_ITEMS = [
  { path: '/forms/',     icon: TbInbox,     label: 'Forms',     desc: 'Inbound submissions' },
  { path: '/analytics/', icon: TbChartBar,  label: 'Analytics', desc: 'Traffic and trends' },
  { path: '/calendar/',  icon: TbCalendar,  label: 'Calendar',  desc: 'Scheduling and sprints' },
  { path: '/settings/',  icon: TbSettings,  label: 'Settings',  desc: 'Profile and preferences' },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/dashboard/') {
      return location.pathname === '/' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  const moreActive = MORE_ITEMS.some((item) => isActive(item.path));

  const handleNavigate = (path) => {
    setMoreOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setMoreOpen(false);
    await supabase.auth.signOut();
    navigate('/login/');
  };

  return (
    <>
      <Box
        display={{ base: 'block', lg: 'none' }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="rgba(10, 10, 10, 0.92)"
        backdropFilter="saturate(180%) blur(20px)"
        borderTop="1px solid"
        borderColor="rgba(255,255,255,0.06)"
        zIndex={20}
        pb="env(safe-area-inset-bottom)"
      >
        <HStack justify="space-around" py={2} px={1}>
          {PRIMARY_TABS.map((item) => (
            <TabButton
              key={item.path}
              item={item}
              active={isActive(item.path)}
              onClick={() => handleNavigate(item.path)}
            />
          ))}
          <TabButton
            item={{ icon: TbDotsVertical, label: 'More' }}
            active={moreActive || moreOpen}
            onClick={() => setMoreOpen(true)}
          />
        </HStack>
      </Box>

      <Modal
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        size="full"
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
        <ModalContent
          bg="surface.950"
          m={0}
          borderRadius={0}
          color="white"
        >
          <ModalCloseButton
            top={4}
            right={4}
            color="surface.400"
            _hover={{ color: 'white', bg: 'surface.900' }}
            borderRadius="full"
            size="lg"
          />
          <ModalBody
            pt="max(env(safe-area-inset-top), 64px)"
            pb="max(env(safe-area-inset-bottom), 32px)"
            px={5}
          >
            <VStack align="stretch" spacing={8}>
              <VStack align="start" spacing={1}>
                <Text
                  fontSize="2xs"
                  fontWeight="600"
                  color="brand.500"
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                  fontFamily="mono"
                >
                  More
                </Text>
                <Text
                  fontSize="3xl"
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                  lineHeight="1.1"
                >
                  Everything else.
                </Text>
              </VStack>

              <VStack align="stretch" spacing={1}>
                {MORE_ITEMS.map((item) => (
                  <SheetRow
                    key={item.path}
                    item={item}
                    active={isActive(item.path)}
                    onClick={() => handleNavigate(item.path)}
                  />
                ))}
              </VStack>

              <Divider borderColor="rgba(255,255,255,0.06)" />

              <SheetRow
                item={{
                  icon: TbLogout,
                  label: 'Sign out',
                  desc: 'See you next time',
                }}
                destructive
                onClick={handleSignOut}
              />
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const TabButton = ({ item, active, onClick }) => (
  <VStack
    spacing={0}
    cursor="pointer"
    onClick={onClick}
    flex={1}
    py={2}
    position="relative"
    role="button"
    aria-label={item.label}
    transition="transform 160ms cubic-bezier(0.4, 0, 0.2, 1)"
    _active={{ transform: 'scale(0.92)' }}
  >
    {active && (
      <Box
        position="absolute"
        top={0}
        left="50%"
        transform="translateX(-50%)"
        w="24px"
        h="2px"
        borderRadius="full"
        bg="brand.500"
        boxShadow="0 0 8px rgba(0,229,229,0.7)"
      />
    )}
    <Icon
      as={item.icon}
      boxSize={6}
      color={active ? 'brand.500' : 'surface.500'}
      transition="color 160ms"
    />
  </VStack>
);

const SheetRow = ({ item, active, destructive, onClick }) => (
  <Box
    as="button"
    onClick={onClick}
    textAlign="left"
    w="100%"
    px={4}
    py={4}
    borderRadius="xl"
    bg={active ? 'surface.900' : 'transparent'}
    transition="all 160ms cubic-bezier(0.4, 0, 0.2, 1)"
    _hover={{ bg: 'surface.900' }}
    _active={{ bg: 'surface.800', transform: 'scale(0.99)' }}
  >
    <HStack spacing={4}>
      <Box
        w="40px"
        h="40px"
        borderRadius="lg"
        bg={destructive ? 'rgba(255,51,102,0.08)' : 'surface.900'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Icon
          as={item.icon}
          boxSize={5}
          color={destructive ? 'accent.coral' : active ? 'brand.500' : 'surface.300'}
        />
      </Box>
      <VStack align="start" spacing={0} flex={1}>
        <Text
          fontSize="md"
          fontWeight="600"
          color={destructive ? 'accent.coral' : 'white'}
          lineHeight="1.2"
        >
          {item.label}
        </Text>
        {item.desc && (
          <Text fontSize="xs" color="surface.500" lineHeight="1.3">
            {item.desc}
          </Text>
        )}
      </VStack>
    </HStack>
  </Box>
);

export default MobileNav;
