// src/pages/Calendar/index.jsx
import { Box, Text, Center, VStack } from '@chakra-ui/react';

const Calendar = () => {
  return (
    <Box p={{ base: 4, md: 6 }}>
      <Text fontSize="2xl" fontWeight="700" color="white" mb={4}>Calendar</Text>
      <Box bg="surface.900" border="1px solid" borderColor="surface.800" borderRadius="xl" p={8}>
        <Center>
          <VStack spacing={2}>
            <Text color="surface.400" fontSize="sm">Phase 2 - Coming soon</Text>
          </VStack>
        </Center>
      </Box>
    </Box>
  );
};

export default Calendar;
