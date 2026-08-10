// src/pages/Clients/components/ClientGrid.jsx
// SENTINEL: NB_PULSE_CLIENT_GRID_V2
//
// One row per client. Press it to open them.
//
// ── MOBILE FIRST, WHICH V1 WAS NOT ──────────────────────────────────────────
// V1 hid the sprint count, the funded total and the last activity behind
// display base:none. So on a phone a client row was a dot, a face, a name and a
// company, and every number the page existed to show was gone. The row is built
// for the phone now and the desktop gets extra columns rather than the phone
// getting a truncated desktop.
//
// The second line carries the money on every width. If you only ever learn one
// thing about a client from this list it should be what they are worth, not
// what their company is called.
//
// ── THE SUBSCRIPTION PIP ────────────────────────────────────────────────────
// A client on a live subscription is a different kind of client from one who
// buys a sprint when they feel like it, and nothing in this app said which was
// which. The pip is a small lime dot with a tooltip, coloured by health, so a
// past due subscription is visible from the list rather than three clicks deep.
//
// ── HOVER IS NOT AN AFFORDANCE ──────────────────────────────────────────────
// V1 revealed the edit button on hover at opacity 0, which means it does not
// exist on a touch screen. It is always visible now at low contrast, which is
// how a control that only some people need should behave.
//
// No oxford commas, no em dashes.

import {
  Box, VStack, HStack, Text, Icon, Center, Spinner, Button, Tooltip,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { TbUsers, TbBolt, TbEdit, TbRepeat, TbChevronRight } from 'react-icons/tb';
import { timeAgo } from '../../../utils/phone';
import { subscriptionHealth, HEALTH_TONE, cadenceLabel, renewalLabel } from '../../../lib/billing';
import colors from '../../../theme/colors';
import { TYPE, EASE, FAST } from '../../../theme/layout';
import Avatar from '../../../components/common/Avatar';

const STATUS_DOT = {
  active: colors.status.green,
  lead: colors.accent.banana,
  inactive: colors.surface[500],
};

const TAG_COLORS = {
  local: colors.accent.signal,
  recurring: colors.status.green,
  vip: colors.accent.banana,
  lab: colors.accent.purple,
  hosting: colors.accent.cool,
  web3: '#EC4899',
  subscription: '#FF6B35',
};

const money = (v) => {
  const n = parseFloat(v || 0);
  if (!n) return '$0';
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
};

const ClientRow = ({ client, onEdit }) => {
  const navigate = useNavigate();
  const status = STATUS_DOT[client.status] || STATUS_DOT.active;
  const tags = client.tags || [];
  const sub = client.subscription || null;
  const health = subscriptionHealth(sub);

  return (
    <HStack
      as="button"
      onClick={() => navigate(`/clients/${client.id}/`)}
      w="100%"
      align="center"
      spacing={{ base: 3, md: 4 }}
      textAlign="left"
      py={{ base: 3.5, md: 4 }}
      px={{ base: 2, md: 3 }}
      borderBottom="1px solid"
      borderColor="surface.900"
      role="group"
      transition={`background ${FAST} ${EASE}`}
      _hover={{ bg: 'surface.900' }}
      _active={{ bg: 'surface.850' }}
    >
      <Box w="6px" h="6px" borderRadius="full" bg={status} flexShrink={0}
        boxShadow={client.status === 'active' ? `0 0 8px ${status}80` : 'none'} />

      <Avatar name={client.name} url={client.avatar_url} size="sm" border={false} />

      {/* Identity. Two lines on every width. */}
      <VStack align="start" spacing={0.5} flex={1} minW={0}>
        <HStack spacing={2} minW={0} w="100%">
          <Text fontSize={TYPE.body} fontWeight="600" color="text.primary"
            letterSpacing="-0.01em" noOfLines={1}>
            {client.name}
          </Text>

          {health !== 'none' && (
            <Tooltip
              label={`${cadenceLabel(sub)} · ${renewalLabel(sub)}`}
              placement="top" hasArrow bg="surface.800" color="text.primary"
              fontSize="xs" openDelay={300}
            >
              <HStack spacing={1} flexShrink={0}>
                <Icon as={TbRepeat} boxSize="11px" color={HEALTH_TONE[health]} />
              </HStack>
            </Tooltip>
          )}

          {tags.length > 0 && (
            <HStack spacing={1} flexShrink={0} display={{ base: 'none', sm: 'flex' }}>
              {tags.slice(0, 3).map((t) => (
                <Box key={t} w="5px" h="5px" borderRadius="full"
                  bg={TAG_COLORS[t] || colors.surface[500]} />
              ))}
            </HStack>
          )}
        </HStack>

        {/* The money line. Present at every width, which is the whole change. */}
        <HStack spacing={2} fontFamily="mono" fontSize={TYPE.micro} color="surface.600" minW={0}>
          <Text color={client.total_funded > 0 ? 'surface.400' : 'surface.700'} fontWeight="500"
            sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {money(client.total_funded)}
          </Text>
          <Text color="surface.800">·</Text>
          <HStack spacing={1}>
            <Icon as={TbBolt} boxSize="10px" />
            <Text sx={{ fontVariantNumeric: 'tabular-nums' }}>{client.sprint_count || 0}</Text>
          </HStack>
          {client.company && (
            <>
              <Text color="surface.800" display={{ base: 'none', sm: 'block' }}>·</Text>
              <Text noOfLines={1} display={{ base: 'none', sm: 'block' }}>{client.company}</Text>
            </>
          )}
        </HStack>
      </VStack>

      <Text display={{ base: 'none', lg: 'block' }} fontFamily="mono" fontSize={TYPE.micro}
        color="surface.700" minW="58px" textAlign="right" flexShrink={0}>
        {timeAgo(client.last_activity_at || client.created_at)}
      </Text>

      {/* Always visible. A control at opacity 0 does not exist on a phone. */}
      <Box as="span" role="button" tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onEdit(client); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onEdit(client); } }}
        p={1.5} borderRadius="8px" color="surface.700" flexShrink={0}
        transition={`all ${FAST} ${EASE}`}
        _hover={{ color: 'brand.500', bg: 'surface.850' }}
        aria-label={`Edit ${client.name}`}>
        <Icon as={TbEdit} boxSize="15px" />
      </Box>

      <Icon as={TbChevronRight} boxSize="14px" color="surface.800" flexShrink={0}
        display={{ base: 'block', md: 'none' }} />
    </HStack>
  );
};

const ClientGrid = ({ clients, loading, onEdit, onAdd, isEmpty }) => {
  if (loading) {
    return (
      <Center py={16}>
        <VStack spacing={3}>
          <Spinner size="md" color="brand.500" thickness="2px" />
          <Text color="surface.600" fontSize={TYPE.micro} fontFamily="mono">Loading clients</Text>
        </VStack>
      </Center>
    );
  }

  if (!clients.length) {
    return (
      <VStack py={{ base: 14, md: 20 }} spacing={4} align="center">
        <Icon as={TbUsers} boxSize={9} color="surface.800" />
        <VStack spacing={1}>
          <Text fontSize={TYPE.body} fontWeight="600" color="text.primary">
            {isEmpty ? 'No clients yet' : 'No matches'}
          </Text>
          <Text fontSize={TYPE.small} color="surface.500">
            {isEmpty ? 'Add the first one to the herd' : 'Try a different search or filter'}
          </Text>
        </VStack>
        {isEmpty && (
          <Button size="sm" variant="outline" borderColor="brand.500" color="brand.500"
            fontWeight="600" borderRadius="full" onClick={onAdd} mt={2}
            _hover={{ bg: 'divider.accent' }}>
            Add your first client
          </Button>
        )}
      </VStack>
    );
  }

  return (
    <Box borderTop="1px solid" borderColor="surface.900">
      {clients.map((c) => <ClientRow key={c.id} client={c} onEdit={onEdit} />)}
    </Box>
  );
};

export default ClientGrid;
