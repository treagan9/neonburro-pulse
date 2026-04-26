// src/pages/Clients/components/ClientFilters.jsx
// New layout: sticky rounded search bar (full-width on mobile)
// Filter row + sort row both visible, refined via shared ui constants.
// Mobile: stacks vertically. Desktop: inline.

import { HStack, VStack, Box, Input, Text, Icon } from '@chakra-ui/react';
import { TbSearch } from 'react-icons/tb';
import {
  SEARCH_INPUT_WRAP_PROPS,
  SEARCH_INPUT_PROPS,
  buildFilterTabProps,
  FILTER_TAB_LABEL_PROPS,
  FILTER_TAB_COUNT_PROPS,
  FILTER_TAB_UNDERLINE_PROPS,
  SORT_TAB_LABEL_PROPS,
} from '../../../lib/uiConstants';

const STATUS_OPTIONS = [
  { value: 'all',      label: 'All' },
  { value: 'active',   label: 'Active' },
  { value: 'lead',     label: 'Leads' },
  { value: 'inactive', label: 'Inactive' },
];

const SORT_OPTIONS = [
  { value: 'recent',       label: 'Recent' },
  { value: 'activity',     label: 'Activity' },
  { value: 'alphabetical', label: 'A → Z' },
  { value: 'most_funded',  label: 'Funded' },
  { value: 'most_sprints', label: 'Sprints' },
];

const ClientFilters = ({
  search, onSearch,
  filterStatus, onFilterStatus,
  sortBy, onSortBy,
  counts,
}) => (
  <VStack align="stretch" spacing={5}>
    {/* SEARCH - sticky rounded bar, full-width on all sizes */}
    <Box {...SEARCH_INPUT_WRAP_PROPS}>
      <Icon as={TbSearch} boxSize={4} color="surface.500" flexShrink={0} />
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search by name, email, company, phone, or tag"
        {...SEARCH_INPUT_PROPS}
      />
    </Box>

    {/* FILTER ROW - primary filters, larger and more prominent */}
    <HStack spacing={6} flexWrap="wrap" align="center">
      {STATUS_OPTIONS.map((opt) => {
        const active = filterStatus === opt.value;
        const count = counts[opt.value] || 0;
        return (
          <Box key={opt.value} onClick={() => onFilterStatus(opt.value)} {...buildFilterTabProps(active)}>
            <HStack spacing={2}>
              <Text {...FILTER_TAB_LABEL_PROPS(active)}>{opt.label}</Text>
              <Text {...FILTER_TAB_COUNT_PROPS(active)}>{count}</Text>
            </HStack>
            {active && <Box {...FILTER_TAB_UNDERLINE_PROPS} />}
          </Box>
        );
      })}
    </HStack>

    {/* SORT ROW - secondary, smaller, mono */}
    <HStack spacing={5} flexWrap="wrap" align="center" pt={1}>
      <Text
        fontSize="3xs"
        fontFamily="mono"
        color="surface.700"
        textTransform="uppercase"
        letterSpacing="0.15em"
        fontWeight="700"
      >
        Sort
      </Text>
      {SORT_OPTIONS.map((opt) => {
        const active = sortBy === opt.value;
        return (
          <Text
            key={opt.value}
            onClick={() => onSortBy(opt.value)}
            {...SORT_TAB_LABEL_PROPS(active)}
          >
            {opt.label}
          </Text>
        );
      })}
    </HStack>
  </VStack>
);

export default ClientFilters;
