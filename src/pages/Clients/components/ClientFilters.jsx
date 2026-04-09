// src/pages/Clients/components/ClientFilters.jsx
// Naked filters - no boxes, text-only toggles, login DNA

import { HStack, Box, Input, Text, Icon, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { TbSearch } from 'react-icons/tb';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'lead', label: 'Leads' },
  { value: 'inactive', label: 'Inactive' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'activity', label: 'Activity' },
  { value: 'alphabetical', label: 'A → Z' },
  { value: 'most_funded', label: 'Funded' },
  { value: 'most_sprints', label: 'Sprints' },
];

const ClientFilters = ({
  search, onSearch,
  filterStatus, onFilterStatus,
  sortBy, onSortBy,
  counts,
}) => (
  <HStack spacing={6} flexWrap="wrap" align="center">
    {/* Search - naked, no container */}
    <InputGroup flex={1} minW="240px" maxW="400px">
      <InputLeftElement h="40px" pl={0} pointerEvents="none">
        <Icon as={TbSearch} boxSize={3.5} color="surface.600" />
      </InputLeftElement>
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search clients"
        pl={7}
        bg="transparent"
        border="none"
        borderBottom="1px solid"
        borderColor="surface.800"
        borderRadius={0}
        color="white"
        fontSize="sm"
        h="40px"
        _hover={{ borderColor: 'surface.700' }}
        _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
        _placeholder={{ color: 'surface.600' }}
      />
    </InputGroup>

    {/* Status filter - text only */}
    <HStack spacing={4}>
      {STATUS_OPTIONS.map((opt) => {
        const active = filterStatus === opt.value;
        const count = counts[opt.value] || 0;
        return (
          <Box
            key={opt.value}
            cursor="pointer"
            onClick={() => onFilterStatus(opt.value)}
            transition="all 0.15s"
            position="relative"
            pb={1}
          >
            <HStack spacing={1.5}>
              <Text
                fontSize="xs"
                fontWeight="700"
                color={active ? 'white' : 'surface.600'}
                letterSpacing="0.02em"
                _hover={!active ? { color: 'surface.400' } : {}}
              >
                {opt.label}
              </Text>
              <Text
                fontSize="2xs"
                color={active ? 'brand.500' : 'surface.700'}
                fontFamily="mono"
                fontWeight="700"
              >
                {count}
              </Text>
            </HStack>
            {active && (
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                h="2px"
                bg="brand.500"
                borderRadius="full"
                boxShadow="0 0 8px rgba(0,229,229,0.6)"
              />
            )}
          </Box>
        );
      })}
    </HStack>

    {/* Sort - text with arrow */}
    <HStack spacing={3}>
      {SORT_OPTIONS.map((opt, idx) => {
        const active = sortBy === opt.value;
        return (
          <Text
            key={opt.value}
            fontSize="2xs"
            fontWeight="700"
            color={active ? 'accent.banana' : 'surface.700'}
            letterSpacing="0.05em"
            textTransform="uppercase"
            cursor="pointer"
            onClick={() => onSortBy(opt.value)}
            transition="color 0.15s"
            _hover={!active ? { color: 'surface.500' } : {}}
          >
            {opt.label}
          </Text>
        );
      })}
    </HStack>
  </HStack>
);

export default ClientFilters;