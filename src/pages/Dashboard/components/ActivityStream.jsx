// src/pages/Dashboard/components/ActivityStream.jsx
// Smart activity stream:
// - Last 24h by default, "last 7 days" toggle
// - Hides category='system' noise (login, password changes)
// - Groups consecutive same-client events into expandable rows
// - Every entity name links to /clients/:id/
// - All timestamps render in MST via formatSmart from src/lib/time

import { useState, useMemo } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Center, Spinner, Image, Tooltip, Collapse,
} from '@chakra-ui/react';
import {
  TbActivity, TbCreditCard, TbBuildingBank, TbWriting, TbArrowsTransferUp,
  TbChevronDown, TbChevronRight,
} from 'react-icons/tb';
import {
  FaCcVisa, FaCcMastercard, FaCcAmex, FaCcDiscover, FaApplePay, FaGooglePay,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../../components/common/Avatar';
import { usePresence } from '../../../hooks/usePresence';
import { formatSmart } from '../../../lib/time';

const VERB_MAP = {
  client_created:   'added client',
  client_updated:   'updated client',
  client_deleted:   'removed client',
  project_created:  'created project',
  project_updated:  'updated project',
  project_deleted:  'removed project',
  invoice_created:  'drafted invoice',
  invoice_sent:     'sent invoice',
  invoice_viewed:   'opened invoice',
  invoice_paid:     'received payment',
  invoice_cancelled:'cancelled invoice',
  invoice_deleted:  'deleted invoice',
  payment_received: 'received payment',
  form_submitted:   'received form',
  message_sent:     'replied to',
  message_received: 'message from',
  note_added:       'added note to',
  portal_activated: 'activated portal for',
  deploy_succeeded: 'deployed',
  deploy_failed:    'deploy failed for',
};

const ENTITY_COLORS = {
  client_created:   '#00E5E5',
  client_updated:   '#00E5E5',
  client_deleted:   '#FF3366',
  invoice_created:  '#FFE500',
  invoice_sent:     '#00E5E5',
  invoice_viewed:   '#FFE500',
  invoice_paid:     '#39FF14',
  invoice_cancelled:'#FF3366',
  invoice_deleted:  '#FF3366',
  payment_received: '#39FF14',
  form_submitted:   '#8B5CF6',
  message_sent:     '#06B6D4',
  message_received: '#06B6D4',
  note_added:       '#737373',
  portal_activated: '#00E5E5',
  deploy_succeeded: '#39FF14',
  deploy_failed:    '#FF3366',
};

const PaymentMethodIcon = ({ type, brand, wallet }) => {
  if (wallet === 'apple_pay') return <Icon as={FaApplePay} boxSize={4} color="surface.500" />;
  if (wallet === 'google_pay') return <Icon as={FaGooglePay} boxSize={4} color="surface.500" />;
  if (type === 'card') {
    if (brand === 'visa') return <Icon as={FaCcVisa} boxSize={3.5} color="surface.500" />;
    if (brand === 'mastercard') return <Icon as={FaCcMastercard} boxSize={3.5} color="surface.500" />;
    if (brand === 'amex') return <Icon as={FaCcAmex} boxSize={3.5} color="surface.500" />;
    if (brand === 'discover') return <Icon as={FaCcDiscover} boxSize={3.5} color="surface.500" />;
    return <Icon as={TbCreditCard} boxSize={3} color="surface.500" />;
  }
  if (type === 'us_bank_account' || type === 'ach') return <Icon as={TbBuildingBank} boxSize={3} color="surface.500" />;
  if (type === 'check') return <Icon as={TbWriting} boxSize={3} color="surface.500" />;
  if (type === 'wire') return <Icon as={TbArrowsTransferUp} boxSize={3} color="surface.500" />;
  return null;
};

const pmLabel = ({ type, brand, last4, wallet }) => {
  if (wallet === 'apple_pay') return 'Apple Pay';
  if (wallet === 'google_pay') return 'Google Pay';
  if (type === 'card' && brand && last4) {
    return `${brand.charAt(0).toUpperCase() + brand.slice(1)} ··${last4}`;
  }
  if (type === 'us_bank_account' || type === 'ach') return 'Bank transfer';
  if (type === 'check') return 'Check';
  if (type === 'wire') return 'Wire transfer';
  return null;
};

const ActivityItem = ({ activity, profileMap }) => {
  const navigate = useNavigate();
  const verb = VERB_MAP[activity.action] || activity.action?.replace(/_/g, ' ');
  const entityColor = ENTITY_COLORS[activity.action] || '#737373';

  const profile = activity.user_id ? profileMap[activity.user_id] : null;
  const { getStatus } = usePresence();
  const status = activity.user_id ? getStatus(activity.user_id) : null;

  const isSystem = !activity.user_id;
  const displayName = isSystem ? 'Neon Burro' : (profile?.display_name || 'Unknown');

  const entityName =
    activity.metadata?.client_name ||
    activity.metadata?.project_name ||
    activity.metadata?.invoice_number ||
    activity.metadata?.sender_name ||
    activity.metadata?.site_name ||
    activity.metadata?.form_type ||
    '';

  const amount =
    activity.metadata?.total ?? activity.metadata?.amount ?? activity.metadata?.due_now;
  const amountDisplay = amount
    ? `$${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : null;

  const pmType = activity.metadata?.payment_method_type;
  const pmBrand = activity.metadata?.payment_method_brand;
  const pmLast4 = activity.metadata?.payment_method_last4;
  const pmWallet = activity.metadata?.payment_method_wallet;
  const showPaymentMethod =
    (activity.action === 'invoice_paid' || activity.action === 'payment_received') && pmType;

  const handleEntityClick = (e) => {
    e.stopPropagation();
    if (activity.client_id) {
      navigate(`/clients/${activity.client_id}/`);
    }
  };

  return (
    <HStack
      spacing={3}
      py={2.5}
      pl={3}
      pr={3}
      align="center"
      role="group"
      borderBottom="1px solid"
      borderColor="surface.900"
      transition="all 0.15s"
      _hover={{ bg: 'rgba(255,255,255,0.012)' }}
    >
      {isSystem ? (
        <Box
          w="32px"
          h="32px"
          borderRadius="full"
          bg="surface.900"
          border="1px solid"
          borderColor="surface.800"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          overflow="hidden"
        >
          <Image
            src="/neon-burro-email-logo.png"
            alt="Neon Burro"
            w="22px"
            h="22px"
            borderRadius="full"
          />
        </Box>
      ) : (
        <Avatar
          name={displayName}
          url={profile?.avatar_url}
          size="sm"
          presence={status}
        />
      )}

      <Box flex={1} minW={0}>
        <HStack spacing={1.5} flexWrap="wrap" align="baseline">
          <Text color="white" fontSize="sm" fontWeight="700">
            {displayName}
          </Text>
          <Text color="surface.500" fontSize="sm">{verb}</Text>

          {entityName && (
            <Text
              color={entityColor}
              fontSize="sm"
              fontWeight="700"
              fontFamily="mono"
              cursor={activity.client_id ? 'pointer' : 'default'}
              onClick={handleEntityClick}
              _hover={activity.client_id ? { textDecoration: 'underline', textDecorationColor: entityColor } : {}}
            >
              {entityName}
            </Text>
          )}

          {amountDisplay && (
            <Text
              color={
                activity.action === 'invoice_paid' || activity.action === 'payment_received'
                  ? 'accent.neon'
                  : 'accent.banana'
              }
              fontSize="sm"
              fontWeight="800"
              fontFamily="mono"
            >
              {amountDisplay}
            </Text>
          )}

          {showPaymentMethod && (
            <Tooltip
              label={pmLabel({ type: pmType, brand: pmBrand, last4: pmLast4, wallet: pmWallet })}
              placement="top"
              hasArrow
              bg="surface.800"
              color="white"
              fontSize="xs"
            >
              <HStack spacing={1}>
                <PaymentMethodIcon type={pmType} brand={pmBrand} wallet={pmWallet} />
                {pmLast4 && (
                  <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                    ··{pmLast4}
                  </Text>
                )}
              </HStack>
            </Tooltip>
          )}
        </HStack>

        <Text color="surface.700" fontSize="2xs" fontFamily="mono" mt={0.5}>
          {formatSmart(activity.created_at)}
        </Text>
      </Box>
    </HStack>
  );
};

const ClientGroup = ({ clientId, clientName, events, profileMap }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  if (events.length === 1) {
    return <ActivityItem activity={events[0]} profileMap={profileMap} />;
  }

  const latestEvent = events[0];

  return (
    <Box borderBottom="1px solid" borderColor="surface.900">
      <HStack
        spacing={3}
        py={2.5}
        pl={3}
        pr={3}
        cursor="pointer"
        onClick={() => setExpanded(!expanded)}
        transition="all 0.15s"
        _hover={{ bg: 'rgba(255,255,255,0.012)' }}
      >
        <Icon
          as={expanded ? TbChevronDown : TbChevronRight}
          boxSize={3}
          color="surface.600"
          flexShrink={0}
        />
        <Box flex={1} minW={0}>
          <HStack spacing={1.5}>
            <Text
              color="brand.500"
              fontSize="sm"
              fontWeight="700"
              fontFamily="mono"
              _hover={{ textDecoration: 'underline' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clients/${clientId}/`);
              }}
            >
              {clientName}
            </Text>
            <Text color="surface.500" fontSize="sm">
              {events.length} events
            </Text>
          </HStack>
          <Text color="surface.700" fontSize="2xs" fontFamily="mono" mt={0.5}>
            latest {formatSmart(latestEvent.created_at)}
          </Text>
        </Box>
      </HStack>

      <Collapse in={expanded} animateOpacity>
        <Box pl={6} borderLeft="1px solid" borderColor="surface.900" ml={4}>
          {events.map((event) => (
            <ActivityItem key={event.id} activity={event} profileMap={profileMap} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

const ActivityStream = ({ activities, profileMap = {}, loading }) => {
  const [range, setRange] = useState('24h');
  const [showSystem, setShowSystem] = useState(false);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = range === '24h' ? now - 24 * 60 * 60 * 1000 : now - 7 * 24 * 60 * 60 * 1000;

    return (activities || []).filter((a) => {
      if (new Date(a.created_at).getTime() < cutoff) return false;
      if (!showSystem && a.category === 'system') return false;
      return true;
    });
  }, [activities, range, showSystem]);

  const grouped = useMemo(() => {
    const result = [];
    let currentGroup = null;

    filtered.forEach((activity) => {
      const clientId = activity.client_id;
      const clientName = activity.metadata?.client_name || activity.metadata?.sender_name || null;

      if (clientId && currentGroup && currentGroup.clientId === clientId) {
        currentGroup.events.push(activity);
      } else {
        if (currentGroup) result.push(currentGroup);
        currentGroup = {
          clientId,
          clientName: clientName || 'Unknown',
          events: [activity],
        };
      }
    });
    if (currentGroup) result.push(currentGroup);
    return result;
  }, [filtered]);

  return (
    <Box position="relative">
      <HStack spacing={2} mb={4} justify="space-between">
        <HStack spacing={2}>
          <Box
            w="6px"
            h="6px"
            borderRadius="full"
            bg="brand.500"
            boxShadow="0 0 8px rgba(0,229,229,0.6)"
          />
          <Text
            color="brand.500"
            fontSize="xs"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.12em"
            fontFamily="mono"
          >
            Activity Stream
          </Text>
        </HStack>

        <HStack spacing={4}>
          <Box
            as="button"
            onClick={() => setRange(range === '24h' ? '7d' : '24h')}
            color="surface.600"
            _hover={{ color: 'brand.500' }}
            fontSize="2xs"
            fontFamily="mono"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.05em"
            transition="color 0.15s"
          >
            {range === '24h' ? 'Last 24h' : 'Last 7 days'}
          </Box>
          <Box
            as="button"
            onClick={() => setShowSystem(!showSystem)}
            color={showSystem ? 'brand.500' : 'surface.700'}
            _hover={{ color: 'brand.500' }}
            fontSize="2xs"
            fontFamily="mono"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.05em"
            transition="color 0.15s"
          >
            {showSystem ? 'Hide system' : 'Show system'}
          </Box>
        </HStack>
      </HStack>

      {loading ? (
        <Center py={10}>
          <Spinner size="sm" color="brand.500" thickness="2px" />
        </Center>
      ) : filtered.length === 0 ? (
        <VStack py={10} spacing={2}>
          <Icon as={TbActivity} boxSize={6} color="surface.700" />
          <Text color="surface.500" fontSize="xs" fontFamily="mono">
            No signals in the {range === '24h' ? 'last 24 hours' : 'last 7 days'}
          </Text>
          {range === '24h' && (
            <Text
              as="button"
              color="brand.500"
              fontSize="2xs"
              fontFamily="mono"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.05em"
              onClick={() => setRange('7d')}
              _hover={{ opacity: 0.8 }}
            >
              Show last 7 days
            </Text>
          )}
        </VStack>
      ) : (
        <Box borderTop="1px solid" borderColor="surface.900">
          {grouped.map((group, idx) => (
            <ClientGroup
              key={`${group.clientId || 'none'}-${idx}`}
              clientId={group.clientId}
              clientName={group.clientName}
              events={group.events}
              profileMap={profileMap}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ActivityStream;
