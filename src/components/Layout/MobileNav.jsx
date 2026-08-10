// src/components/Layout/MobileNav.jsx
// SENTINEL: NB_PULSE_MOBILENAV_V2
//
// Four tabs and a More sheet, all of it read from lib/nav.js.
//
// ── THE TWO THINGS THAT WERE ACTUALLY BROKEN ────────────────────────────────
//
//   MESSAGES DID NOT EXIST ON A PHONE. It was in the sidebar and in neither the
//   primary tabs nor the More sheet, so on mobile the feature was simply gone.
//
//   THE PROJECTS TAB WENT NOWHERE. /projects/ redirects to /clients/, so it
//   navigated somewhere with a different name and then never highlighted.
//
// Both came from the same cause: two hand typed lists that had to agree and had
// no mechanism forcing them to. There is one list now.
//
// ── LABELS ARE BACK UNDER THE ICONS ─────────────────────────────────────────
// V1 was icon only. An icon only tab bar is fine for five verbs everybody
// already knows and wrong for an admin tool, where Forms and Invoicing and
// Clients are three rectangles with people in them. The labels cost nine pixels
// of height and remove the guessing.
//
// No oxford commas, no em dashes.

import { useState } from 'react';
import {
  Box, HStack, VStack, Icon, Text, Modal, ModalOverlay, ModalContent,
  ModalBody, ModalCloseButton, Divider, Image,
} from '@chakra-ui/react';
import { TbDots, TbLogout } from 'react-icons/tb';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MOBILE_PRIMARY, MOBILE_MORE, isActivePath } from '../../lib/nav';
import colors from '../../theme/colors';
import { TABBAR_H, EASE, FAST } from '../../theme/layout';

const GLOW = `0 0 10px ${colors.accent.signal}66`;

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const active = (path) => isActivePath(location.pathname, path);
  const moreActive = MOBILE_MORE.some((i) => active(i.path));

  const go = (path) => { setOpen(false); navigate(path); };

  const signOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    navigate('/login/');
  };

  return (
    <>
      <Box
        as="nav"
        aria-label="Primary"
        display={{ base: 'block', lg: 'none' }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="rgba(11, 11, 10, 0.88)"
        borderTop="1px solid"
        borderColor="divider.soft"
        zIndex={20}
        pb="env(safe-area-inset-bottom)"
        sx={{
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        }}
      >
        <HStack spacing={0} align="stretch" h={TABBAR_H}>
          {MOBILE_PRIMARY.map((item) => (
            <Tab key={item.path} item={item} active={active(item.path)} onClick={() => go(item.path)} />
          ))}
          <Tab item={{ icon: TbDots, label: 'More' }} active={moreActive || open}
            onClick={() => setOpen(true)} />
        </HStack>
      </Box>

      <Modal isOpen={open} onClose={() => setOpen(false)} size="full" motionPreset="slideInBottom">
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
        <ModalContent bg="surface.950" m={0} borderRadius={0} color="text.primary">
          <ModalCloseButton top={4} right={4} size="lg" borderRadius="full"
            color="surface.400" _hover={{ color: 'text.primary', bg: 'surface.900' }} />

          <ModalBody px={5} pt="max(env(safe-area-inset-top), 56px)"
            pb="max(env(safe-area-inset-bottom), 32px)">
            <VStack align="stretch" spacing={8}>

              <HStack spacing={3} align="center">
                <Image src="/logo-main.png" alt="" w="26px" h="26px" />
                <Box>
                  <Text color="text.primary" fontSize="15px" fontWeight="600" letterSpacing="-0.02em" lineHeight="1.1">
                    Pulse
                  </Text>
                  <Text color="surface.500" fontFamily="mono" fontSize="9px" letterSpacing="0.14em">
                    neonburro
                  </Text>
                </Box>
              </HStack>

              <VStack align="stretch" spacing={1}>
                {MOBILE_MORE.map((item) => (
                  <Row key={item.path} item={item} active={active(item.path)} onClick={() => go(item.path)} />
                ))}
              </VStack>

              <Divider borderColor="divider.soft" />

              <Row item={{ icon: TbLogout, label: 'Sign out', desc: 'See you next time' }}
                destructive onClick={signOut} />
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const Tab = ({ item, active, onClick }) => (
  <VStack
    as="button"
    onClick={onClick}
    aria-label={item.label}
    aria-current={active ? 'page' : undefined}
    flex={1}
    spacing={1}
    justify="center"
    position="relative"
    transition={`transform ${FAST} ${EASE}`}
    _active={{ transform: 'scale(0.94)' }}
  >
    {active && (
      <Box position="absolute" top={0} left="50%" transform="translateX(-50%)"
        w="22px" h="2px" borderRadius="full" bg="brand.500" boxShadow={GLOW} />
    )}
    <Icon as={item.icon} boxSize="21px" color={active ? 'brand.500' : 'surface.500'}
      transition={`color ${FAST} ${EASE}`} />
    <Text fontSize="9px" fontWeight={active ? '600' : '500'} letterSpacing="0.02em"
      color={active ? 'text.primary' : 'surface.600'} transition={`color ${FAST} ${EASE}`}>
      {item.label}
    </Text>
  </VStack>
);

const Row = ({ item, active, destructive, onClick }) => (
  <Box as="button" onClick={onClick} textAlign="left" w="100%" px={4} py={4} borderRadius="14px"
    bg={active ? 'surface.900' : 'transparent'} transition={`all ${FAST} ${EASE}`}
    _hover={{ bg: 'surface.900' }} _active={{ bg: 'surface.800', transform: 'scale(0.99)' }}>
    <HStack spacing={4}>
      <Box w="38px" h="38px" borderRadius="11px" flexShrink={0}
        bg={destructive ? 'status.redMuted' : 'surface.900'}
        display="flex" alignItems="center" justifyContent="center">
        <Icon as={item.icon} boxSize="18px"
          color={destructive ? 'accent.coral' : active ? 'brand.500' : 'surface.300'} />
      </Box>
      <VStack align="start" spacing={0} flex={1} minW={0}>
        <Text fontSize="15px" fontWeight="600" letterSpacing="-0.01em" lineHeight="1.2"
          color={destructive ? 'accent.coral' : 'text.primary'}>
          {item.label}
        </Text>
        {item.desc && (
          <Text fontSize="xs" color="surface.500" lineHeight="1.4" noOfLines={1}>
            {item.desc}
          </Text>
        )}
      </VStack>
    </HStack>
  </Box>
);

export default MobileNav;
