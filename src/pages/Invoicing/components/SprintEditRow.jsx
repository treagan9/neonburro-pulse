// src/pages/Invoicing/components/SprintEditRow.jsx
// One row in the sprint list of the invoice editor.
// Inline editing for title, amount, payment_mode. Expand for description.
// Locked when sprint is paid. WIP toggle hides from billable total.

import { useState } from 'react';
import { Box, HStack, Input, Textarea, Text, Icon } from '@chakra-ui/react';
import { TbCheck, TbTrash } from 'react-icons/tb';
import { FUNDING_MODES } from '../../../lib/invoiceConstants';

const SprintEditRow = ({ sprint, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const isLocked = sprint.locked || sprint.payment_status === 'paid';
  const isWip = sprint.is_billable === false;

  return (
    <Box py={3} borderBottom="1px solid" borderColor="surface.900" role="group">
      <HStack align="start" spacing={3}>
        <Box
          w="16px"
          h="16px"
          borderRadius="sm"
          border="1.5px solid"
          borderColor={isWip ? 'surface.700' : 'brand.500'}
          bg={isWip ? 'transparent' : 'brand.500'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => !isLocked && onUpdate({ ...sprint, is_billable: isWip })}
          mt={1}
          cursor={isLocked ? 'not-allowed' : 'pointer'}
          flexShrink={0}
          transition="all 0.15s"
        >
          {!isWip && <Icon as={TbCheck} boxSize={2.5} color="surface.950" strokeWidth={3} />}
        </Box>

        <Box flex={1}>
          <HStack spacing={3} align="center" mb={1}>
            <Input
              value={sprint.title || ''}
              onChange={(e) => onUpdate({ ...sprint, title: e.target.value })}
              placeholder="Sprint title..."
              bg="transparent"
              border="none"
              color="white"
              fontSize="sm"
              fontWeight="700"
              h="28px"
              px={0}
              flex={1}
              isReadOnly={isLocked}
              _focus={{ boxShadow: 'none' }}
              _placeholder={{ color: 'surface.600', fontWeight: '500' }}
            />
            <Input
              value={sprint.amount || ''}
              onChange={(e) => onUpdate({ ...sprint, amount: e.target.value })}
              placeholder="0"
              type="number"
              step="0.01"
              bg="transparent"
              border="none"
              color="white"
              fontSize="sm"
              fontFamily="mono"
              fontWeight="700"
              h="28px"
              px={0}
              textAlign="right"
              w="80px"
              isReadOnly={isLocked}
              _focus={{ boxShadow: 'none' }}
              _placeholder={{ color: 'surface.600' }}
            />
            <Text color="surface.600" fontSize="xs" fontFamily="mono">USD</Text>
          </HStack>

          <HStack spacing={3} mt={1}>
            <Text color="surface.600" fontSize="2xs" fontFamily="mono" fontWeight="700">
              {sprint.sprint_number || '— not assigned yet —'}
            </Text>

            <HStack spacing={1.5}>
              {FUNDING_MODES.map((mode) => {
                const active = (sprint.payment_mode || 'approve_only') === mode.value;
                return (
                  <Box
                    key={mode.value}
                    as="button"
                    onClick={() => !isLocked && onUpdate({ ...sprint, payment_mode: mode.value })}
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    border="1px solid"
                    borderColor={active ? mode.color : 'surface.800'}
                    bg={active ? `${mode.color}12` : 'transparent'}
                    transition="all 0.15s"
                    cursor={isLocked ? 'not-allowed' : 'pointer'}
                  >
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      color={active ? mode.color : 'surface.600'}
                      textTransform="uppercase"
                    >
                      {mode.label}
                    </Text>
                  </Box>
                );
              })}
            </HStack>

            {isLocked && (
              <Text color="accent.neon" fontSize="2xs" fontFamily="mono" fontWeight="700">
                🔒 PAID
              </Text>
            )}
            {isWip && (
              <Text color="surface.600" fontSize="2xs" fontFamily="mono" fontWeight="700">
                WIP
              </Text>
            )}

            <Box flex={1} />

            <Box
              as="button"
              onClick={() => setExpanded(!expanded)}
              color="surface.600"
              _hover={{ color: 'surface.400' }}
              fontSize="2xs"
              fontFamily="mono"
              fontWeight="700"
              textTransform="uppercase"
            >
              {expanded ? 'Less' : 'Details'}
            </Box>

            {!isLocked && (
              <Box as="button" onClick={onDelete} color="surface.700" _hover={{ color: 'red.400' }}>
                <Icon as={TbTrash} boxSize={3.5} />
              </Box>
            )}
          </HStack>

          {expanded && (
            <Textarea
              value={sprint.description || ''}
              onChange={(e) => onUpdate({ ...sprint, description: e.target.value })}
              placeholder="What's happening in this sprint..."
              mt={3}
              bg="transparent"
              border="1px solid"
              borderColor="surface.800"
              borderRadius="lg"
              color="surface.300"
              fontSize="xs"
              rows={2}
              isReadOnly={isLocked}
              _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              _placeholder={{ color: 'surface.700' }}
            />
          )}
        </Box>
      </HStack>
    </Box>
  );
};

export default SprintEditRow;
