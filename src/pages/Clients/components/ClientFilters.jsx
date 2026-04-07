// src/pages/Clients/components/ClientFilters.jsx
import { HStack, Box, Input, Button, Icon, Select, Text } from '@chakra-ui/react';
import { TbSearch, TbArrowsSort } from 'react-icons/tb';

const STATUS_LABELS = { all: 'All', active: 'Active', lead: 'Lead', inactive: 'Inactive' };

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'activity', label: 'Recent Activity' },
  { value: 'alphabetical', label: 'A → Z' },
  { value: 'most_funded', label: 'Most Funded' },
  { value: 'most_sprints', label: 'Most Sprints' },
];

const ClientFilters = ({
  search, onSearch,
  filterStatus, onFilterStatus,
  sortBy, onSortBy,
  counts,
}) => (
  <HStack spacing={3} flexWrap="wrap">
    {/* Search */}
    <Box position="relative" flex={1} minW="240px">
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
        placeholder="search by name, email, phone, company"
        pl={9}
        bg="transparent"
        border="1px solid"
        borderColor="surface.700"
        color="white"
        fontSize="sm"
        h="40px"
        borderRadius="lg"
        _hover={{ borderColor: 'surface.500' }}
        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
        _placeholder={{ color: 'surface.600' }}
      />
    </Box>

    {/* Status filter chips */}
    <HStack spacing={1}>
      {Object.entries(STATUS_LABELS).map(([key, label]) => (
        <Button
          key={key}
          size="xs"
          variant="ghost"
          color={filterStatus === key ? 'white' : 'surface.500'}
          bg={filterStatus === key ? 'surface.800' : 'transparent'}
          fontWeight="700"
          borderRadius="md"
          onClick={() => onFilterStatus(key)}
          _hover={{ bg: 'surface.850', color: 'white' }}
          h="32px"
        >
          {label} <Text as="span" color="surface.600" ml={1}>{counts[key] || 0}</Text>
        </Button>
      ))}
    </HStack>

    {/* Sort dropdown */}
    <HStack spacing={1.5}>
      <Icon as={TbArrowsSort} boxSize={3.5} color="surface.500" />
      <Select
        value={sortBy}
        onChange={(e) => onSortBy(e.target.value)}
        size="xs"
        bg="transparent"
        border="1px solid"
        borderColor="surface.700"
        color="surface.300"
        fontSize="xs"
        fontWeight="600"
        h="32px"
        borderRadius="md"
        w="auto"
        minW="140px"
        _hover={{ borderColor: 'surface.500' }}
        _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
        cursor="pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: '#0a0a0a' }}>
            {opt.label}
          </option>
        ))}
      </Select>
    </HStack>
  </HStack>
);

export default ClientFilters;