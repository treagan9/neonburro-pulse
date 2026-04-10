// src/pages/Dashboard/components/ActivityStream.jsx
// Slim activity stream - naked section (no card frame)
// "System" actions render as "Neon Burro" with the logo image
// Payment activities show subtle method icons (card brand, ACH, check, wallet)

import {
  Box, VStack, HStack, Text, Icon, Center, Spinner, Image, Tooltip,
} from '@chakra-ui/react';
import {
  TbActivity, TbCreditCard, TbBuildingBank, TbWriting, TbArrowsTransferUp,
} from 'react-icons/tb';
import {
  FaCcVisa, FaCcMastercard, FaCcAmex, FaCcDiscover, FaApplePay, FaGooglePay,
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../../../components/common/Avatar';
import { usePresence } from '../../../hooks/usePresence';

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
  login:            'signed in',
  password_changed: 'changed password',
};

const ENTITY_COLORS = {
  client_created:   '#00E5E5',
  client_updated:   '#00E5E5',
  client_deleted:   '#FF3366',
  project_created:  '#8B5CF6',
  project_updated:  '#8B5CF6',
  project_deleted:  '#FF3366',
  invoice_created:  '#FFE500',
  invoice_sent:     '#00E5E5',
  invoice_viewed:   '#FFE500',
  invoice_paid:     '#39FF14',
  invoice_cancelled:'#FF3366',
  invoice_deleted:  '#FF3366',
  payment_received: '#39FF14',
  form_submitted:   '#8B5CF6',
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

const PaymentMethodLabel = ({ type, brand, last4, wallet }) => {
  if (wallet === 'apple_pay') return 'Apple Pay';
  if (wallet === 'google_pay') return 'Google Pay';
  if (type === 'card' && brand && last4) {
    const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
    return `${brandName} ··${last4}`;
  }
  if (type === 'us_bank_account' || type === 'ach') return 'Bank transfer';
  if (type === 'check') return 'Check';
  if (type === 'wire') return 'Wire transfer';
  return null;
};

const ActivityItem = ({ activity, profileMap }) => {
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

  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

  return (
    <HStack
      spacing={3}
      py={2.5}
      align="center"
      role="group"
      borderBottom="1px solid"
      borderColor="surface.900"
      transition="all 0.15s"
      _hover={{ bg: 'rgba(255,255,255,0.012)' }}
      pl={3}
      pr={3}
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
          <Text color="white" fontSize="sm" fontWeight="700" letterSpacing="-0.005em">
            {displayName}
          </Text>
          <Text color="surface.500" fontSize="sm">{verb}</Text>

          {entityName && (
            <Text
              color={entityColor}
              fontSize="sm"
              fontWeight="700"
              fontFamily="mono"
              opacity={0.95}
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
              label={PaymentMethodLabel({ type: pmType, brand: pmBrand, last4: pmLast4, wallet: pmWallet })}
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
          {timeAgo}
        </Text>
      </Box>
    </HStack>
  );
};

const ActivityStream = ({ activities, profileMap = {}, loading }) => {
  return (
    <Box position="relative">
      {/* Header label - matches the rest of the app */}
      <HStack spacing={2} mb={4}>
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

      {loading ? (
        <Center py={10}>
          <Spinner size="sm" color="brand.500" thickness="2px" />
        </Center>
      ) : activities.length === 0 ? (
        <VStack py={10} spacing={2}>
          <Icon as={TbActivity} boxSize={6} color="surface.700" />
          <Text color="surface.500" fontSize="xs" fontFamily="mono">
            No signals yet
          </Text>
          <Text color="surface.700" fontSize="2xs">
            Activity appears here as the system runs
          </Text>
        </VStack>
      ) : (
        <Box borderTop="1px solid" borderColor="surface.900">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              profileMap={profileMap}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ActivityStream;