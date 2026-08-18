// src/pages/Clients/components/ClientFilters.jsx
// Paper filters. A sticky rounded search, a filter row, and a quieter sort row.
// Mobile stacks, desktop is inline. Local Paper styles. No oxford commas, no dashes.

import { HStack, VStack, Box, Input, Text, Icon } from '@chakra-ui/react';
import { TbSearch } from 'react-icons/tb';
import colors from '../../../theme/colors';

const P = colors.paper;

const STATUS_OPTIONS = [
  { value: 'all',      label: 'All' },
  { value: 'active',   label: 'Active' },
  { value: 'lead',     label: 'Leads' },
  { value: 'inactive', label: 'Inactive' },
];

const SORT_OPTIONS = [
  { value: 'recent',       label: 'Recent' },
  { value: 'activity',     label: 'Activity' },
  { value: 'alphabetical', label: 'A to Z' },
  { value: 'most_funded',  label: 'Funded' },
  { value: 'most_sprints', label: 'Sprints' },
];

const ClientFilters = ({ search, onSearch, filterStatus, onFilterStatus, sortBy, onSortBy, counts }) => (
  <VStack align="stretch" spacing={5}>
    <HStack spacing={3} bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="full" px={5} h="52px" position="sticky" top={4} zIndex={2} _focusWithin={{ borderColor: P.lime, boxShadow: `0 0 0 3px ${P.lime}22` }}>
      <Icon as={TbSearch} boxSize={4} color={P.inkMuted} flexShrink={0} />
      <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name, email, company, phone, or tag" variant="unstyled" color={P.ink} fontSize="sm" _placeholder={{ color: P.inkFaint }} />
    </HStack>

    <HStack spacing={7} flexWrap="wrap" align="center">
      {STATUS_OPTIONS.map((opt) => {
        const active = filterStatus === opt.value;
        const count = counts[opt.value] || 0;
        return (
          <Box key={opt.value} onClick={() => onFilterStatus(opt.value)} position="relative" pb={2} cursor="pointer">
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight={active ? '700' : '500'} color={active ? P.ink : P.inkMuted}>{opt.label}</Text>
              <Text fontSize="2xs" fontFamily="mono" fontWeight="700" color={active ? P.limeDeep : P.inkFaint}>{count}</Text>
            </HStack>
            {active && <Box position="absolute" bottom="-1px" left={0} right={0} h="2px" bg={P.lime} borderRadius="full" />}
          </Box>
        );
      })}
    </HStack>

    <HStack spacing={5} flexWrap="wrap" align="center" pt={1}>
      <Text fontSize="3xs" fontFamily="mono" color={P.inkFaint} textTransform="uppercase" letterSpacing="0.15em" fontWeight="700">Sort</Text>
      {SORT_OPTIONS.map((opt) => {
        const active = sortBy === opt.value;
        return (
          <Text key={opt.value} onClick={() => onSortBy(opt.value)} cursor="pointer" fontSize="xs" fontFamily="mono" fontWeight={active ? '700' : '500'} letterSpacing="0.04em" color={active ? P.limeDeep : P.inkMuted} _hover={{ color: P.ink }}>
            {opt.label}
          </Text>
        );
      })}
    </HStack>
  </VStack>
);

export default ClientFilters;
