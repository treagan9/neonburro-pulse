// src/pages/Clients/components/SubscriptionModal.jsx
// SENTINEL: NB_PULSE_SUB_MODAL_V1
//
// Create or edit one recurring arrangement.
//
// ── THE RAIL IS THE FIRST QUESTION, NOT A SETTING ───────────────────────────
// It is at the top, it is two large choices rather than a select, and choosing
// one rewrites the sentence underneath it. That is deliberate. Every other field
// on this form means the same thing on both rails. This one changes what the
// product IS, and burying it in a dropdown next to currency would be the single
// most expensive piece of UI in the app.
//
// ── EVERY CLIENT RENEWS ON THEIR OWN ANCHOR ─────────────────────────────────
// There is no shared billing day. You pick the date the first period closes and
// every period after it counts forward from there, so a client who signs on the
// nineteenth renews on the nineteenth forever. interval and interval_count come
// straight off the table, so quarterly is month times three and there is no
// fourth enum to keep in sync with anything.
//
// ── WHAT THIS DOES NOT DO ───────────────────────────────────────────────────
// It does not talk to Stripe. Creating the Stripe subscription is a server side
// job with a secret key on it, and a modal that half creates a billing
// relationship is worse than one that clearly does not. This writes the record
// and leaves status at draft. Sending it is a separate, deliberate act.
//
// No oxford commas, no em dashes.

import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Box, VStack, HStack, Text, Input, Textarea, Select,
  Button, FormControl, FormLabel, Icon, useToast, SimpleGrid,
} from '@chakra-ui/react';
import { TbCreditCard, TbCoins, TbCheck } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import { RAILS, cadenceLabel, renewalAction } from '../../../lib/billing';
import { TYPE, EASE, FAST } from '../../../theme/layout';

const field = {
  bg: 'surface.900',
  border: '1px solid',
  borderColor: 'surface.800',
  borderRadius: '10px',
  color: 'text.primary',
  fontSize: '14px',
  _placeholder: { color: 'surface.600' },
  _hover: { borderColor: 'surface.700' },
  _focus: { borderColor: 'brand.500', boxShadow: 'none' },
};

const Label = ({ children, hint }) => (
  <FormLabel mb={2} fontFamily="mono" fontSize="9px" fontWeight="500"
    letterSpacing="0.18em" textTransform="uppercase" color="surface.500">
    {children}
    {hint && <Text as="span" ml={2} textTransform="none" letterSpacing="0.03em" color="surface.700">{hint}</Text>}
  </FormLabel>
);

const RailCard = ({ rail, selected, onSelect }) => (
  <VStack
    as="button" type="button" onClick={onSelect} align="start" spacing={2}
    p={4} borderRadius="14px" textAlign="left" w="100%"
    border="1px solid"
    borderColor={selected ? 'brand.500' : 'surface.800'}
    bg={selected ? 'surface.900' : 'transparent'}
    transition={`all ${FAST} ${EASE}`}
    _hover={{ borderColor: selected ? 'brand.500' : 'surface.700' }}
  >
    <HStack spacing={2.5} w="100%">
      <Icon as={rail.id === 'card' ? TbCreditCard : TbCoins} boxSize="16px" color={rail.tone} />
      <Text fontSize={TYPE.body} fontWeight="600" color="text.primary" flex={1}>{rail.label}</Text>
      {selected && <Icon as={TbCheck} boxSize="14px" color="brand.500" />}
    </HStack>
    <Text fontSize={TYPE.micro} fontFamily="mono" color="surface.500" letterSpacing="0.08em">
      {rail.processor} · {rail.model === 'pull' ? 'we charge' : 'they send'}
    </Text>
    <Text fontSize={TYPE.small} color="surface.500" lineHeight="1.55">{rail.settles}</Text>
  </VStack>
);

const blank = {
  name: '', description: '', amount: '', setup_fee: '',
  interval: 'month', interval_count: 1,
  rail: 'card', payer_address: '',
  current_period_end: '', notes: '',
};

const toDateInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const SubscriptionModal = ({ isOpen, onClose, clientId, clientName, subscription, onSaved }) => {
  const toast = useToast();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(subscription?.id);

  useEffect(() => {
    if (!isOpen) return;
    if (subscription) {
      setForm({
        name: subscription.name || '',
        description: subscription.description || '',
        amount: subscription.amount ?? '',
        setup_fee: subscription.setup_fee ?? '',
        interval: subscription.interval || 'month',
        interval_count: subscription.interval_count || 1,
        rail: subscription.rail || 'card',
        payer_address: subscription.payer_address || '',
        current_period_end: toDateInput(subscription.current_period_end),
        notes: subscription.notes || '',
      });
    } else {
      // Default the first renewal to a month out, which is what somebody almost
      // always wants and can always change.
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      setForm({ ...blank, current_period_end: d.toISOString().slice(0, 10) });
    }
  }, [isOpen, subscription]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const rail = RAILS[form.rail] || RAILS.card;
  const action = renewalAction({ rail: form.rail });
  const valid = form.name.trim() && parseFloat(form.amount) > 0;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const end = form.current_period_end ? new Date(`${form.current_period_end}T12:00:00`) : null;

      const payload = {
        client_id: clientId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        amount: parseFloat(form.amount),
        setup_fee: form.setup_fee ? parseFloat(form.setup_fee) : 0,
        interval: form.interval,
        interval_count: Math.max(1, parseInt(form.interval_count, 10) || 1),
        rail: form.rail,
        payer_address: form.rail === 'stablecoin' ? (form.payer_address.trim() || null) : null,
        current_period_end: end ? end.toISOString() : null,
        // A push rail has to be raised by somebody. Stamping the date here is
        // what lets the tab and any future cron know when.
        next_invoice_at: form.rail === 'stablecoin' && end ? end.toISOString() : null,
        notes: form.notes.trim() || null,
      };

      if (editing) {
        const { error } = await supabase.from('subscriptions').update(payload).eq('id', subscription.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subscriptions').insert({ ...payload, status: 'draft' });
        if (error) throw error;
      }

      toast({
        title: editing ? 'Subscription updated' : 'Subscription drafted',
        description: editing ? null : 'It is a draft until you send it. Nothing has been charged.',
        status: 'success', duration: 4500,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      toast({ title: 'Could not save', description: err.message, status: 'error', duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(6px)" />
      <ModalContent bg="surface.950" border="1px solid" borderColor="surface.800"
        borderRadius="18px" mx={4}>
        <ModalHeader pb={2}>
          <Text fontFamily="mono" fontSize="9px" fontWeight="500" letterSpacing="0.2em"
            textTransform="uppercase" color="brand.500" mb={1.5}>
            {editing ? 'Edit subscription' : 'New subscription'}
          </Text>
          <Text fontSize={TYPE.title} fontWeight="600" letterSpacing="-0.03em" color="text.primary">
            {clientName}
          </Text>
        </ModalHeader>
        <ModalCloseButton color="surface.500" borderRadius="full" top={4} right={4}
          _hover={{ color: 'text.primary', bg: 'surface.900' }} />

        <ModalBody pb={2}>
          <VStack align="stretch" spacing={7}>

            {/* ── the rail, first ───────────────────────────────────────── */}
            <Box>
              <Label>How it gets paid</Label>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                {Object.values(RAILS).map((r) => (
                  <RailCard key={r.id} rail={r} selected={form.rail === r.id}
                    onSelect={() => setForm((p) => ({ ...p, rail: r.id }))} />
                ))}
              </SimpleGrid>
              <Text fontSize={TYPE.small} color="surface.500" mt={3} lineHeight="1.65">
                On the renewal date it <Box as="span" color="text.primary">{action.verb} {action.happens}</Box>.{' '}
                {action.ifNothing}
                {action.staffAction && (
                  <Box as="span" color="accent.banana"> {action.staffAction} lands in this tab.</Box>
                )}
              </Text>
            </Box>

            {/* ── what it is ────────────────────────────────────────────── */}
            <VStack align="stretch" spacing={5}>
              <FormControl isRequired>
                <Label>What are they buying</Label>
                <Input {...field} value={form.name} onChange={set('name')}
                  placeholder="Hosting and care" />
              </FormControl>

              <FormControl>
                <Label hint="optional">In their words</Label>
                <Textarea {...field} rows={2} resize="vertical" value={form.description}
                  onChange={set('description')} p={3}
                  placeholder="What they actually get for it" />
              </FormControl>
            </VStack>

            {/* ── money and cadence ─────────────────────────────────────── */}
            <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={4}>
              <FormControl isRequired>
                <Label>Amount</Label>
                <Input {...field} type="number" min="0" step="0.01" value={form.amount}
                  onChange={set('amount')} placeholder="250" />
              </FormControl>
              <FormControl>
                <Label hint="once">Setup</Label>
                <Input {...field} type="number" min="0" step="0.01" value={form.setup_fee}
                  onChange={set('setup_fee')} placeholder="0" />
              </FormControl>
              <FormControl>
                <Label>Every</Label>
                <Input {...field} type="number" min="1" value={form.interval_count}
                  onChange={set('interval_count')} />
              </FormControl>
              <FormControl>
                <Label>Unit</Label>
                <Select {...field} value={form.interval} onChange={set('interval')}
                  sx={{ option: { background: '#141312' } }}>
                  <option value="month">Months</option>
                  <option value="year">Years</option>
                </Select>
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <Label hint="their anchor, not a shared billing day">First period closes</Label>
              <Input {...field} type="date" value={form.current_period_end}
                onChange={set('current_period_end')} />
              <Text fontSize={TYPE.small} color="surface.600" mt={2}>
                {cadenceLabel({ interval: form.interval, interval_count: form.interval_count })}
                , counting forward from that date.
              </Text>
            </FormControl>

            {form.rail === 'stablecoin' && (
              <FormControl>
                <Label hint="optional">Wallet they will send from</Label>
                <Input {...field} value={form.payer_address} onChange={set('payer_address')}
                  placeholder="Address, so an incoming transfer matches itself"
                  fontFamily="mono" fontSize="13px" />
              </FormControl>
            )}

            <FormControl>
              <Label hint="internal">Notes</Label>
              <Textarea {...field} rows={2} resize="vertical" value={form.notes}
                onChange={set('notes')} p={3} placeholder="Nobody outside sees this" />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter gap={3} pt={6}>
          <Button variant="ghost" color="surface.500" fontSize={TYPE.small} onClick={onClose}
            _hover={{ color: 'text.primary', bg: 'surface.900' }}>
            Cancel
          </Button>
          <Button bg="brand.500" color="surface.950" fontWeight="700" fontSize={TYPE.small}
            borderRadius="full" px={6} isLoading={saving} isDisabled={!valid}
            onClick={save} _hover={{ bg: 'brand.400' }}
            _disabled={{ opacity: 0.3, cursor: 'not-allowed' }}>
            {editing ? 'Save' : 'Create as draft'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SubscriptionModal;
