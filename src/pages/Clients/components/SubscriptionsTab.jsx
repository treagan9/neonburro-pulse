// src/pages/Clients/components/SubscriptionsTab.jsx
// SENTINEL: NB_PULSE_SUBS_TAB_V1
//
// Every recurring arrangement this client is on, and what happens next on each.
//
// ── THE COLUMN THAT MATTERS IS NOT THE AMOUNT ───────────────────────────────
// It is "what happens on the renewal date", and it is different per rail. A card
// subscription charges itself and needs nobody. A stablecoin subscription raises
// an invoice and then sits there until a hueman chases it. Showing both in the
// same list without saying which is which is how you end up with four months of
// unpaid USDC that looked active the whole time.
//
// So every row carries its rail as a word, not a colour, and a push rail that
// has passed its date gets an explicit action rather than a red dot.
//
// ── SUBSCRIPTIONS ARE A GENERATOR ───────────────────────────────────────────
// The migration says it and this screen obeys it: a subscription emits ordinary
// rows into invoices. There is no separate money view here, no second definition
// of paid. Press through to the invoice and you are in the same list as
// everything else.
//
// No oxford commas, no em dashes.

import { useState, useEffect, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Center, Spinner, Button, useDisclosure, useToast,
} from '@chakra-ui/react';
import {
  TbRepeat, TbPlus, TbCreditCard, TbCoins, TbAlertTriangle, TbEdit, TbBolt,
} from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import {
  RAILS, railOf, renewalAction, cadenceLabel, renewalLabel,
  subscriptionHealth, HEALTH_TONE, daysToRenewal,
} from '../../../lib/billing';
import { formatCurrency } from '../../../lib/uiConstants';
import { TYPE, EASE, FAST } from '../../../theme/layout';
import SubscriptionModal from './SubscriptionModal';

const STATUS_LABEL = {
  draft: 'Draft', pending: 'Awaiting first payment', active: 'Active',
  past_due: 'Past due', paused: 'Paused', cancelled: 'Cancelled',
};

const Row = ({ sub, onEdit, onRaise, raising }) => {
  const rail = railOf(sub);
  const action = renewalAction(sub);
  const health = subscriptionHealth(sub);
  const days = daysToRenewal(sub);
  const needsRaising = !rail.canAutoCharge && days !== null && days <= 0
    && ['active', 'past_due'].includes(sub.status);

  return (
    <VStack align="stretch" spacing={0} borderBottom="1px solid" borderColor="surface.900">
      <HStack align="flex-start" spacing={{ base: 3, md: 4 }} py={{ base: 4, md: 5 }} px={{ base: 1, md: 2 }}>
        <Box w="34px" h="34px" borderRadius="10px" bg="surface.900" flexShrink={0}
          display="flex" alignItems="center" justifyContent="center">
          <Icon as={rail.id === 'card' ? TbCreditCard : TbCoins} boxSize="16px" color={rail.tone} />
        </Box>

        <VStack align="start" spacing={1.5} flex={1} minW={0}>
          <HStack spacing={2.5} flexWrap="wrap" rowGap={1}>
            <Text fontSize={TYPE.body} fontWeight="600" color="text.primary" letterSpacing="-0.01em">
              {sub.name}
            </Text>
            <Box w="5px" h="5px" borderRadius="full" bg={HEALTH_TONE[health]} />
            <Text fontFamily="mono" fontSize={TYPE.micro} letterSpacing="0.14em"
              textTransform="uppercase" color="surface.600">
              {STATUS_LABEL[sub.status] || sub.status}
            </Text>
          </HStack>

          <HStack spacing={2} fontFamily="mono" fontSize={TYPE.small} color="surface.500"
            flexWrap="wrap" rowGap={1}>
            <Text color="text.primary" fontWeight="600" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(sub.amount)}
            </Text>
            <Text color="surface.800">·</Text>
            <Text>{cadenceLabel(sub)}</Text>
            <Text color="surface.800">·</Text>
            <Text color={health === 'late' ? 'accent.coral' : 'surface.500'}>
              {renewalLabel(sub)}
            </Text>
            <Text color="surface.800">·</Text>
            <Text color={rail.tone}>{rail.label}</Text>
          </HStack>

          {/* The sentence that is different per rail. This is the whole tab. */}
          <Text fontSize={TYPE.small} color="surface.600" lineHeight="1.6">
            On the renewal date it {action.verb} {action.happens}.{' '}
            <Box as="span" color={rail.canAutoCharge ? 'surface.600' : 'surface.400'}>
              {action.ifNothing}
            </Box>
          </Text>

          {sub.subscription_number && (
            <Text fontFamily="mono" fontSize={TYPE.micro} color="surface.800">
              {sub.subscription_number}
            </Text>
          )}
        </VStack>

        <Box as="button" onClick={() => onEdit(sub)} p={1.5} borderRadius="8px"
          color="surface.700" flexShrink={0} transition={`all ${FAST} ${EASE}`}
          _hover={{ color: 'brand.500', bg: 'surface.850' }} aria-label="Edit subscription">
          <Icon as={TbEdit} boxSize="15px" />
        </Box>
      </HStack>

      {needsRaising && (
        <HStack spacing={3} px={{ base: 1, md: 2 }} pb={4} align="center" flexWrap="wrap" rowGap={2}>
          <Icon as={TbAlertTriangle} boxSize="14px" color="accent.coral" />
          <Text fontSize={TYPE.small} color="surface.400" flex={1} minW="200px">
            This one bills on a push rail and its period has closed. Nothing has been sent.
          </Text>
          <Button size="xs" h="30px" px={4} borderRadius="full" bg="brand.500"
            color="surface.950" fontWeight="700" isLoading={raising === sub.id}
            leftIcon={<Icon as={TbBolt} boxSize="12px" />}
            onClick={() => onRaise(sub)} _hover={{ bg: 'brand.400' }}>
            Raise the invoice
          </Button>
        </HStack>
      )}
    </VStack>
  );
};

const SubscriptionsTab = ({ clientId, clientName }) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [raising, setRaising] = useState(null);
  const [missing, setMissing] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    // The table may not exist in this project yet. Say so plainly rather than
    // rendering an empty state that implies the client has none.
    if (error) { setMissing(true); setSubs([]); }
    else { setMissing(false); setSubs(data || []); }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const openNew = () => { setEditing(null); onOpen(); };
  const openEdit = (sub) => { setEditing(sub); onOpen(); };

  // Emits an ordinary invoice row, which is the entire contract of a
  // subscription. Nothing here knows how to be paid, the invoice does that.
  const raise = async (sub) => {
    setRaising(sub.id);
    try {
      const start = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
      const end = new Date(start);
      if (sub.interval === 'year') end.setFullYear(end.getFullYear() + (sub.interval_count || 1));
      else end.setMonth(end.getMonth() + (sub.interval_count || 1));

      const { error } = await supabase.from('invoices').insert({
        client_id: clientId,
        subscription_id: sub.id,
        source: 'subscription',
        status: 'draft',
        total: sub.amount,
        total_paid: 0,
        period_start: start.toISOString(),
        period_end: end.toISOString(),
        rail_offered: [sub.rail],
      });
      if (error) throw error;

      await supabase.from('subscriptions').update({
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
      }).eq('id', sub.id);

      toast({ title: 'Invoice drafted', description: 'It is in Invoicing, unsent.', status: 'success', duration: 4000 });
      fetch();
    } catch (err) {
      toast({ title: 'Could not raise it', description: err.message, status: 'error', duration: 6000 });
    } finally {
      setRaising(null);
    }
  };

  if (loading) {
    return (
      <Center py={14}>
        <VStack spacing={3}>
          <Spinner size="md" color="brand.500" thickness="2px" />
          <Text fontFamily="mono" fontSize={TYPE.micro} color="surface.600">Loading subscriptions</Text>
        </VStack>
      </Center>
    );
  }

  if (missing) {
    return (
      <VStack py={12} spacing={3} align="start">
        <Text fontSize={TYPE.body} fontWeight="600" color="text.primary">
          The subscriptions table is not in this project yet.
        </Text>
        <Text fontSize={TYPE.small} color="surface.500" maxW="52ch" lineHeight="1.7">
          Run supabase/migrations/2026080601_subscriptions.sql and then
          2026081001_billing_rails.sql in the SQL editor. Both are additive and
          safe to run twice.
        </Text>
      </VStack>
    );
  }

  return (
    <>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <HStack spacing={2.5}>
            <Icon as={TbRepeat} boxSize="15px" color="surface.600" />
            <Text fontFamily="mono" fontSize={TYPE.micro} fontWeight="500"
              letterSpacing="0.2em" textTransform="uppercase" color="surface.500">
              {subs.length} {subs.length === 1 ? 'subscription' : 'subscriptions'}
            </Text>
          </HStack>
          <Button size="sm" h="34px" px={4} borderRadius="full" bg="brand.500"
            color="surface.950" fontWeight="700" fontSize={TYPE.small}
            leftIcon={<Icon as={TbPlus} boxSize="13px" />}
            onClick={openNew} _hover={{ bg: 'brand.400' }}>
            Subscription
          </Button>
        </HStack>

        {!subs.length ? (
          <VStack py={10} spacing={2} align="start">
            <Text fontSize={TYPE.body} fontWeight="600" color="text.primary">
              {clientName} is not on a subscription.
            </Text>
            <Text fontSize={TYPE.small} color="surface.500" maxW="52ch" lineHeight="1.7">
              Everything they have bought so far was a one off. A subscription
              raises its own invoices on a schedule you set, on either rail.
            </Text>
          </VStack>
        ) : (
          <Box borderTop="1px solid" borderColor="surface.900">
            {subs.map((s) => (
              <Row key={s.id} sub={s} onEdit={openEdit} onRaise={raise} raising={raising} />
            ))}
          </Box>
        )}

        {/* The rails, explained once, at the bottom, where somebody setting the
            first one up will read it and nobody else has to. */}
        <HStack spacing={{ base: 4, md: 8 }} pt={2} flexWrap="wrap" rowGap={3}>
          {Object.values(RAILS).map((r) => (
            <HStack key={r.id} spacing={2.5} align="flex-start" maxW="34ch">
              <Icon as={r.id === 'card' ? TbCreditCard : TbCoins} boxSize="13px"
                color={r.tone} mt="3px" />
              <Box>
                <Text fontSize={TYPE.small} color="surface.400" fontWeight="500">
                  {r.label} · {r.settles}
                </Text>
                <Text fontSize={TYPE.micro} color="surface.600" lineHeight="1.6">{r.note}</Text>
              </Box>
            </HStack>
          ))}
        </HStack>
      </VStack>

      <SubscriptionModal
        isOpen={isOpen}
        onClose={onClose}
        clientId={clientId}
        clientName={clientName}
        subscription={editing}
        onSaved={fetch}
      />
    </>
  );
};

export default SubscriptionsTab;
