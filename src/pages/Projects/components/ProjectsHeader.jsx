// src/pages/Projects/components/ProjectsHeader.jsx
import { HStack, Box, Text, Button } from '@chakra-ui/react';
import { TbPlus } from 'react-icons/tb';

const ProjectsHeader = ({ counts, onAdd }) => (
  <HStack justify="space-between" flexWrap="wrap" gap={3}>
    <Box>
      <Text fontSize="2xl" fontWeight="700" color="white">Projects</Text>
      <Text color="surface.400" fontSize="sm" mt={0.5}>
        {counts.active || 0} active, {counts.all} total
      </Text>
    </Box>
    <Button
      leftIcon={<TbPlus />}
      size="sm"
      bg="accent.purple"
      color="white"
      fontWeight="700"
      borderRadius="lg"
      _hover={{ bg: '#7C3AED', transform: 'translateY(-1px)' }}
      onClick={onAdd}
    >
      New Project
    </Button>
  </HStack>
);

export default ProjectsHeader;