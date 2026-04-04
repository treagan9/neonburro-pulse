// src/pages/Dashboard/components/SystemHeader.jsx
import { Box, HStack, Text, IconButton, VStack } from '@chakra-ui/react';
import { TbRefresh } from 'react-icons/tb';
import { format } from 'date-fns';

const SystemHeader = ({ onRefresh, refreshing }) => {
  const now = new Date();

  return (
    <HStack justify="space-between" align="start">
      <VStack align="start" spacing={1}>
        <HStack spacing={3} align="center">
          <Box w="8px" h="8px" borderRadius="full" bg="accent.neon" boxShadow="0 0 8px rgba(57,255,20,0.6)" />
          <Text
            fontSize="xs"
            fontWeight="700"
            color="accent.neon"
            letterSpacing="0.1em"
            textTransform="uppercase"
            fontFamily="mono"
          >
            Systems Active
          </Text>
        </HStack>
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="800" color="white" lineHeight="1.2">
          Command Center
        </Text>
        <Text color="surface.500" fontSize="xs" fontFamily="mono">
          {format(now, 'EEEE, MMMM d, yyyy')} · {format(now, 'h:mm a')} MST
        </Text>
      </VStack>
      <IconButton
        icon={<TbRefresh />}
        variant="ghost"
        color="surface.500"
        size="sm"
        aria-label="Refresh"
        _hover={{ color: 'brand.500', bg: 'surface.850' }}
        onClick={onRefresh}
        isLoading={refreshing}
      />
    </HStack>
  );
};

export default SystemHeader;