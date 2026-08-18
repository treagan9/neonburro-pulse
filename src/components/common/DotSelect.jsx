// src/components/common/DotSelect.jsx
// SENTINEL: NB_DOTSELECT_V1
//
// One dropdown for the whole tool. Native <select> put a browser arrow that
// collided with our rounded cream fields and looked cheap, and every screen did
// it slightly differently. This is the replacement everywhere: a clean Paper
// field with the value on the left and a small lime dot on the right that breathes
// with a very subtle pulse. Press the field (or the dot) and a Paper menu opens.
//
// Drop-in shape:
//   <DotSelect value={x} onChange={setX} options={[{value,label,hint?}]}
//     placeholder="Choose a client" />
// onChange receives the raw value, not an event, so a caller that needs a number
// wraps it: onChange={(v) => setX(Number(v))}. Options can carry a `hint` shown
// dim on the right of a row. maxH keeps a long client list scrollable.
//
// Keep the look identical everywhere. That sameness is the point. No oxford
// commas, no em dashes.

import {
  Menu, MenuButton, MenuList, MenuItem, Box, HStack, Text, Icon, Portal,
} from '@chakra-ui/react';
import { TbCheck } from 'react-icons/tb';
import colors from '../../theme/colors';

const P = colors.paper;

const PULSE = {
  animation: 'nbDotPulse 2.4s ease-in-out infinite',
  '@keyframes nbDotPulse': {
    '0%, 100%': { boxShadow: `0 0 0 0 ${P.lime}66`, opacity: 1 },
    '50%': { boxShadow: `0 0 0 5px ${P.lime}00`, opacity: 0.85 },
  },
};

const DotSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  h = '46px',
  maxH = '280px',
  isDisabled = false,
  matchWidth = true,
}) => {
  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <Menu placement="bottom-start" matchWidth={matchWidth} isLazy autoSelect={false}>
      {({ isOpen }) => (
        <>
          <MenuButton
            type="button"
            disabled={isDisabled}
            w="100%"
            h={h}
            px={3.5}
            textAlign="left"
            bg={P.sheet}
            border="1px solid"
            borderColor={isOpen ? P.lime : P.hair}
            borderRadius="lg"
            transition="border-color 0.15s, box-shadow 0.15s"
            boxShadow={isOpen ? `0 0 0 3px ${P.lime}33` : 'none'}
            opacity={isDisabled ? 0.5 : 1}
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            _hover={{ borderColor: isDisabled ? P.hair : (isOpen ? P.lime : P.inkFaint) }}
          >
            <HStack justify="space-between" spacing={3}>
              <Text fontSize="sm" color={selected ? P.ink : P.inkFaint} noOfLines={1}>
                {selected ? selected.label : placeholder}
              </Text>
              <Box
                w="9px"
                h="9px"
                borderRadius="full"
                bg={P.lime}
                flexShrink={0}
                sx={isDisabled ? {} : PULSE}
              />
            </HStack>
          </MenuButton>

          <Portal>
            <MenuList
              bg={P.sheet}
              border="1px solid"
              borderColor={P.hair}
              borderRadius="14px"
              boxShadow="0 14px 38px rgba(36,26,22,0.20)"
              py={1.5}
              maxH={maxH}
              overflowY="auto"
              zIndex={1600}
            >
              {options.map((o) => {
                const isSel = String(o.value) === String(value);
                return (
                  <MenuItem
                    key={String(o.value)}
                    onClick={() => onChange(o.value)}
                    bg="transparent"
                    px={3}
                    py={2}
                    _hover={{ bg: P.sunken }}
                    _focus={{ bg: P.sunken }}
                  >
                    <HStack justify="space-between" w="100%" spacing={3}>
                      <HStack spacing={2.5} minW={0}>
                        <Box w="6px" h="6px" borderRadius="full" bg={isSel ? P.lime : P.hair} flexShrink={0} />
                        <Text fontSize="sm" color={isSel ? P.ink : P.inkSec} fontWeight={isSel ? '600' : '500'} noOfLines={1}>
                          {o.label}
                        </Text>
                      </HStack>
                      <HStack spacing={2} flexShrink={0}>
                        {o.hint && <Text fontSize="2xs" fontFamily="mono" color={P.inkFaint}>{o.hint}</Text>}
                        {isSel && <Icon as={TbCheck} boxSize={3.5} color={P.limeDeep} />}
                      </HStack>
                    </HStack>
                  </MenuItem>
                );
              })}
            </MenuList>
          </Portal>
        </>
      )}
    </Menu>
  );
};

export default DotSelect;
