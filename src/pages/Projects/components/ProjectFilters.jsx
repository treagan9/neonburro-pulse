// src/pages/Projects/components/ProjectFilters.jsx
import { HStack, Box, Input, Button, Icon } from '@chakra-ui/react';
import { TbSearch } from 'react-icons/tb';

const STATUS_LABELS = {
  all: 'All',
  lead: 'Lead',
  proposal: 'Proposal',
  active: 'Active',
  complete: 'Complete',
  archived: 'Archived',
};

const ProjectFilters = ({ search, onSearch, filterStatus, onFilterStatus, counts }) => (
  <HStack spacing={3} flexWrap="wrap">
    <Box position="relative" flex={1} minW="200px">
      <Icon
        as={TbSearch}
        position="absolute"
        left={3}
        top="50%"
        transform="translateY(-50%)"
        color="surface.600"
        boxSize={4}
        zIndex={1}
      />
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="search projects"
        pl={9}
        bg="transparent"
        border="1px solid"
        borderColor="surface.700"
        color="white"
        fontSize="sm"
        h="40px"
        borderRadius="lg"
        _hover={{ borderColor: 'surface.500' }}
        _focus={{ borderColor: 'accent.purple', boxShadow: '0 0 0 1px var(--chakra-colors-accent-purple)' }}
        _placeholder={{ color: 'surface.600' }}
      />
    </Box>
    <HStack spacing={1} flexWrap="wrap">
      {Object.entries(STATUS_LABELS).map(([key, label]) => (
        <Button
          key={key}
          size="xs"
          variant="ghost"
          color={filterStatus === key ? 'white' : 'surface.500'}
          bg={filterStatus === key ? 'surface.800' : 'transparent'}
          fontWeight="600"
          borderRadius="md"
          onClick={() => onFilterStatus(key)}
          _hover={{ bg: 'surface.850', color: 'white' }}
        >
          {label} ({counts[key] || 0})
        </Button>
      ))}
    </HStack>
  </HStack>
);

export default ProjectFilters;