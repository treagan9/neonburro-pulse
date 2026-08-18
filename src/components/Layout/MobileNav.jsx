// src/components/Layout/MobileNav.jsx
// SENTINEL: NB_PULSE_MOBILENAV_V3
//
// The phone nav, rebuilt as a floating dark pill. V2 was a full width bar pinned
// to the bottom edge, one more rectangle. This is a single rounded pill in the
// warm chrome, floated off the bottom with a shadow, so it reads as an object on
// the cream rather than a border of it. Tyler asked for exactly this: a big pill
// with icons, dark background.
//
// THE ACTIVE TAB EXPANDS. Inactive tabs are icon only, a clean row of thumb sized
// targets. The active one grows into a lime pill and shows its label, so where
// you are is unmistakable and the accent is spent once, same lime as the sidebar
// bar. Four pages plus a More button, all read from lib/nav.js so the sidebar and
// the pill can never disagree about what exists.
//
// The wrapper is pointer-events none so the cream around the pill still takes
// taps. Only the pill itself is live. More opens a full sheet, repainted to
// chrome. No oxford commas, no em dashes.

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
import { EASE, FAST } from '../../theme/layout';

const C = colors.chrome;
const LIME = colors.paper.lime;
const LIME_INK = colors.paper.limeInk;

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
        display={{ base: 'flex', lg: 'none' }}
        justifyContent="center"
        position="fixed"
        left={0}
        right={0}
        bottom="calc(env(safe-area-inset-bottom) + 14px)"
        zIndex={20}
        pointerEvents="none"
        px={4}
      >
        <HStack
          as="nav"
          aria-label="Primary"
          spacing={1}
          p={1.5}
          borderRadius="full"
          bg="rgba(36, 26, 22, 0.90)"
          border="1px solid"
          borderColor={C.line}
          pointerEvents="auto"
          boxShadow="0 10px 34px rgba(0,0,0,0.42), 0 2px 8px rgba(0,0,0,0.3)"
          sx={{
            backdropFilter: 'saturate(160%) blur(18px)',
            WebkitBackdropFilter: 'saturate(160%) blur(18px)',
          }}
        >
          {MOBILE_PRIMARY.map((item) => (
            <PillTab key={item.path} item={item} active={active(item.path)} onClick={() => go(item.path)} />
          ))}
          <PillTab item={{ icon: TbDots, label: 'More' }} active={moreActive || open} onClick={() => setOpen(true)} />
        </HStack>
      </Box>

      <Modal isOpen={open} onClose={() => setOpen(false)} size="full" motionPreset="slideInBottom">
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
        <ModalContent bg={C.ground} m={0} borderRadius={0} color={C.text}>
          <ModalCloseButton top={4} right={4} size="lg" borderRadius="full"
            color={C.textMuted} _hover={{ color: C.text, bg: C.raised }} />

          <ModalBody px={5} pt="max(env(safe-area-inset-top), 56px)" pb="max(env(safe-area-inset-bottom), 32px)">
            <VStack align="stretch" spacing={8}>
              <HStack spacing={3} align="center">
                <Image src="/logo-main.png" alt="" w="26px" h="26px" />
                <Box>
                  <Text color={C.text} fontSize="15px" fontWeight="600" letterSpacing="-0.02em" lineHeight="1.1">
                    Pulse
                  </Text>
                  <Text color={C.textFaint} fontFamily="mono" fontSize="9px" letterSpacing="0.14em">
                    neonburro
                  </Text>
                </Box>
              </HStack>

              <VStack align="stretch" spacing={1}>
                {MOBILE_MORE.map((item) => (
                  <Row key={item.path} item={item} active={active(item.path)} onClick={() => go(item.path)} />
                ))}
              </VStack>

              <Divider borderColor={C.line} />

              <Row item={{ icon: TbLogout, label: 'Sign out', desc: 'See you next time' }}
                destructive onClick={signOut} />
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

// Inactive: a thumb sized icon. Active: a lime pill that shows its label.
const PillTab = ({ item, active, onClick }) => (
  <Box
    as="button"
    onClick={onClick}
    aria-label={item.label}
    aria-current={active ? 'page' : undefined}
    h="46px"
    minW="46px"
    px={active ? 4 : 0}
    borderRadius="full"
    bg={active ? LIME : 'transparent'}
    display="flex"
    alignItems="center"
    justifyContent="center"
    gap={active ? 2 : 0}
    transition={`background ${FAST} ${EASE}, padding ${FAST} ${EASE}`}
    _active={{ transform: 'scale(0.93)' }}
  >
    <Icon as={item.icon} boxSize="21px" color={active ? LIME_INK : C.textMuted}
      transition={`color ${FAST} ${EASE}`} />
    {active && (
      <Text fontSize="sm" fontWeight="700" letterSpacing="-0.01em" color={LIME_INK} whiteSpace="nowrap">
        {item.label}
      </Text>
    )}
  </Box>
);

const Row = ({ item, active, destructive, onClick }) => (
  <Box as="button" onClick={onClick} textAlign="left" w="100%" px={4} py={4} borderRadius="14px"
    bg={active ? C.raised : 'transparent'} transition={`all ${FAST} ${EASE}`}
    _hover={{ bg: C.raised }} _active={{ bg: C.raised, transform: 'scale(0.99)' }}>
    <HStack spacing={4}>
      <Box w="38px" h="38px" borderRadius="11px" flexShrink={0}
        bg={destructive ? 'rgba(194,64,47,0.16)' : C.raised}
        display="flex" alignItems="center" justifyContent="center">
        <Icon as={item.icon} boxSize="18px"
          color={destructive ? colors.paper.coral : active ? LIME : C.textMuted} />
      </Box>
      <VStack align="start" spacing={0} flex={1} minW={0}>
        <Text fontSize="15px" fontWeight="600" letterSpacing="-0.01em" lineHeight="1.2"
          color={destructive ? colors.paper.coral : C.text}>
          {item.label}
        </Text>
        {item.desc && (
          <Text fontSize="xs" color={C.textFaint} lineHeight="1.4" noOfLines={1}>
            {item.desc}
          </Text>
        )}
      </VStack>
    </HStack>
  </Box>
);

export default MobileNav;
