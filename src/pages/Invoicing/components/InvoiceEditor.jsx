// src/pages/Invoicing/components/InvoiceEditor.jsx
// Invoice compose + preview surface.
// Phase 6.4a additions: SendHistoryStrip, Resend button, Reminder modal.
// Polish: readable tooltips with stronger contrast and clearer copy.

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Spinner, Center, Button,
  Input, Textarea, Select, Container, Divider, Tooltip,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, useToast,
} from '@chakra-ui/react';
import {
  TbArrowLeft, TbPlus, TbTrash, TbEdit, TbEye, TbSend, TbBolt,
  TbCheck, TbAlertTriangle, TbRotateClockwise, TbBellRinging,
} from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import {
  fetchNextInvoiceNumber,
  fetchNextSprintNumber,
  withInvoiceNumberRetry,
} from '../../../lib/numbering';
import InvoicePreview from './InvoicePreview';
import InvoiceSnapshotModal from './InvoiceSnapshotModal';
import SendHistoryStrip from './SendHistoryStrip';
import ReminderModal from './ReminderModal';

// ============================================================
// HELPERS
// ============================================================

const SENT_STATUSES = ['sent', 'viewed', 'partial', 'overdue'];

const FUNDING_MODES = [
  { value: 'approve_only', label: 'Confirm Scope', color: '#737373' },
  { value: 'deposit_50',   label: '50% to Start',  color: '#FFE500' },
  { value: 'pay_full',     label: 'Fund in Full',  color: '#39FF14' },
];

// Shared tooltip props: dark surface, white text, soft border, generous padding.
// Used for the Resend / Remind / Snapshot tooltips so they read clearly.
const TOOLTIP_PROPS = {
  placement: 'top',
  hasArrow: true,
  bg: 'surface.900',
  color: 'white',
  fontSize: 'xs',
  fontWeight: '600',
  px: 3,
  py: 2,
  borderRadius: 'md',
  border: '1px solid',
  borderColor: 'surface.700',
};

const currency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const FIELD_LABEL = {
  fontSize: '2xs',
  fontWeight: '700',
  color: 'surface.600',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontFamily: 'mono',
  mb: 2,
  display: 'block',
};

const nakedInput = {
  bg: 'transparent',
  border: 'none',
  borderBottom: '1px solid',
  borderColor: 'surface.800',
  borderRadius: 0,
  color: 'white',
  fontSize: 'sm',
  h: '40px',
  px: 0,
  _focus: { borderColor: 'brand.500', boxShadow: 'none' },
  _placeholder: { color: 'surface.700' },
};

const validateSprintsForSend = (sprints) => {
  const billable = sprints.filter((s) => s.is_billable !== false);
  if (billable.length === 0) {
    return { valid: false, reason: 'At least one billable sprint is required' };
  }
  const untitled = billable.find((s) => !s.title || !s.title.trim());
  if (untitled) {
    return { valid: false, reason: 'Every billable sprint needs a title' };
  }
  const zeroAmount = billable.find((s) => !parseFloat(s.amount) || parseFloat(s.amount) <= 0);
  if (zeroAmount) {
    return { valid: false, reason: 'Sprint amounts must be greater than zero' };
  }
  return { valid: true };
};

// ============================================================
// SPRINT EDIT ROW
// ============================================================
const SprintEditRow = ({ sprint, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const isLocked = sprint.locked || sprint.payment_status === 'paid';
  const isWip = sprint.is_billable === false;

  return (
    <Box py={3} borderBottom="1px solid" borderColor="surface.900" role="group">
      <HStack align="start" spacing={3}>
        <Box
          w="16px"
          h="16px"
          borderRadius="sm"
          border="1.5px solid"
          borderColor={isWip ? 'surface.700' : 'brand.500'}
          bg={isWip ? 'transparent' : 'brand.500'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => !isLocked && onUpdate({ ...sprint, is_billable: isWip })}
          mt={1}
          cursor={isLocked ? 'not-allowed' : 'pointer'}
          flexShrink={0}
          transition="all 0.15s"
        >
          {!isWip && <Icon as={TbCheck} boxSize={2.5} color="surface.950" strokeWidth={3} />}
        </Box>

        <Box flex={1}>
          <HStack spacing={3} align="center" mb={1}>
            <Input
              value={sprint.title || ''}
              onChange={(e) => onUpdate({ ...sprint, title: e.target.value })}
              placeholder="Sprint title..."
              bg="transparent"
              border="none"
              color="white"
              fontSize="sm"
              fontWeight="700"
              h="28px"
              px={0}
              flex={1}
              isReadOnly={isLocked}
              _focus={{ boxShadow: 'none' }}
              _placeholder={{ color: 'surface.600', fontWeight: '500' }}
            />
            <Input
              value={sprint.amount || ''}
              onChange={(e) => onUpdate({ ...sprint, amount: e.target.value })}
              placeholder="0"
              type="number"
              step="0.01"
              bg="transparent"
              border="none"
              color="white"
              fontSize="sm"
              fontFamily="mono"
              fontWeight="700"
              h="28px"
              px={0}
              textAlign="right"
              w="80px"
              isReadOnly={isLocked}
              _focus={{ boxShadow: 'none' }}
              _placeholder={{ color: 'surface.600' }}
            />
            <Text color="surface.600" fontSize="xs" fontFamily="mono">USD</Text>
          </HStack>

          <HStack spacing={3} mt={1}>
            <Text color="surface.600" fontSize="2xs" fontFamily="mono" fontWeight="700">
              {sprint.sprint_number || '— not assigned yet —'}
            </Text>

            <HStack spacing={1.5}>
              {FUNDING_MODES.map((mode) => {
                const active = (sprint.payment_mode || 'approve_only') === mode.value;
                return (
                  <Box
                    key={mode.value}
                    as="button"
                    onClick={() => !isLocked && onUpdate({ ...sprint, payment_mode: mode.value })}
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    border="1px solid"
                    borderColor={active ? mode.color : 'surface.800'}
                    bg={active ? `${mode.color}12` : 'transparent'}
                    transition="all 0.15s"
                    cursor={isLocked ? 'not-allowed' : 'pointer'}
                  >
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      color={active ? mode.color : 'surface.600'}
                      textTransform="uppercase"
                    >
                      {mode.label}
                    </Text>
                  </Box>
                );
              })}
            </HStack>

            {isLocked && (
              <Text color="accent.neon" fontSize="2xs" fontFamily="mono" fontWeight="700">
                🔒 PAID
              </Text>
            )}
            {isWip && (
              <Text color="surface.600" fontSize="2xs" fontFamily="mono" fontWeight="700">
                WIP
              </Text>
            )}

            <Box flex={1} />

            <Box
              as="button"
              onClick={() => setExpanded(!expanded)}
              color="surface.600"
              _hover={{ color: 'surface.400' }}
              fontSize="2xs"
              fontFamily="mono"
              fontWeight="700"
              textTransform="uppercase"
            >
              {expanded ? 'Less' : 'Details'}
            </Box>

            {!isLocked && (
              <Box as="button" onClick={onDelete} color="surface.700" _hover={{ color: 'red.400' }}>
                <Icon as={TbTrash} boxSize={3.5} />
              </Box>
            )}
          </HStack>

          {expanded && (
            <Textarea
              value={sprint.description || ''}
              onChange={(e) => onUpdate({ ...sprint, description: e.target.value })}
              placeholder="What's happening in this sprint..."
              mt={3}
              bg="transparent"
              border="1px solid"
              borderColor="surface.800"
              borderRadius="lg"
              color="surface.300"
              fontSize="xs"
              rows={2}
              isReadOnly={isLocked}
              _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              _placeholder={{ color: 'surface.700' }}
            />
          )}
        </Box>
      </HStack>
    </Box>
  );
};

// ============================================================
// CANCEL MODAL
// ============================================================
const CancelInvoiceModal = ({ isOpen, onClose, invoice, onConfirm, processing }) => {
  const [typedConfirm, setTypedConfirm] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setTypedConfirm('');
      setReason('');
    }
  }, [isOpen]);

  const canConfirm = typedConfirm === 'CANCEL';

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(8px)" />
      <ModalContent bg="surface.950" border="1px solid" borderColor="red.900" borderRadius="2xl" mx={4}>
        <ModalHeader pb={2} pt={6} px={6}>
          <HStack spacing={3}>
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bg="rgba(255,51,102,0.1)"
              border="1px solid rgba(255,51,102,0.3)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={TbAlertTriangle} boxSize={4} color="red.400" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color="white" fontSize="md" fontWeight="800">Cancel Invoice</Text>
              <Text color="surface.500" fontSize="2xs" fontFamily="mono">
                {invoice?.invoice_number}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.500" top={5} right={5} />

        <ModalBody px={6} py={5}>
          <VStack spacing={5} align="stretch">
            <Text color="surface.300" fontSize="sm" lineHeight="1.6">
              This will mark the invoice as cancelled and invalidate the payment link in the client's email. The sprint history and snapshot will be preserved.
            </Text>

            <Box bg="rgba(255,229,0,0.04)" border="1px solid rgba(255,229,0,0.15)" borderRadius="lg" p={3}>
              <Text color="accent.banana" fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" mb={1}>
                What happens
              </Text>
              <VStack align="start" spacing={1} fontSize="xs" color="surface.400">
                <Text>· Invoice hidden from all lists</Text>
                <Text>· Magic pay link in email is killed</Text>
                <Text>· Snapshot preserved for records</Text>
                <Text>· Activity log entry created</Text>
              </VStack>
            </Box>

            <Box>
              <Text {...FIELD_LABEL}>Reason (optional)</Text>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you cancelling?"
                {...nakedInput}
              />
            </Box>

            <Box>
              <Text {...FIELD_LABEL}>Type CANCEL to confirm</Text>
              <Input
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value.toUpperCase())}
                placeholder="CANCEL"
                {...nakedInput}
                fontFamily="mono"
                letterSpacing="0.1em"
              />
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="surface.900" pt={4} pb={6} px={6}>
          <HStack spacing={2} w="100%">
            <Button
              flex={1}
              size="md"
              variant="outline"
              borderColor="surface.800"
              color="surface.400"
              borderRadius="lg"
              onClick={onClose}
              _hover={{ borderColor: 'surface.700', color: 'white' }}
            >
              Keep Invoice
            </Button>
            <Button
              flex={1}
              size="md"
              bg={canConfirm ? 'red.500' : 'surface.850'}
              color={canConfirm ? 'white' : 'surface.700'}
              fontWeight="700"
              borderRadius="lg"
              onClick={() => onConfirm(reason)}
              isDisabled={!canConfirm}
              isLoading={processing}
              loadingText="Cancelling"
              _hover={canConfirm ? { bg: 'red.600' } : {}}
            >
              Cancel Invoice
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const InvoiceEditor = ({ invoiceId, clientId: initialClientId, clients, onClose, onSaved }) => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('compose');
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [clientId, setClientId] = useState(initialClientId || '');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [previewNumber, setPreviewNumber] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);

  // Phase 6.4a state
  const [resending, setResending] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const isNew = !invoiceId;
  const client = clients.find((c) => c.id === clientId);
  const isPaid = invoice?.status === 'paid';
  const isSentish = SENT_STATUSES.includes(invoice?.status);
  const isDraft = invoice?.status === 'draft' || isNew;
  const wasSent = !isNew && invoice?.status && invoice.status !== 'draft';
  const canResendOrRemind = isSentish && !invoice?.cancelled_at;

  useEffect(() => { loadData(); }, [invoiceId]);
  useEffect(() => {
    if (clientId) loadProjectsForClient(clientId);
  }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    if (isNew) {
      setInvoice({ status: 'draft' });
      setSprints([]);
      try {
        const nextNum = await fetchNextInvoiceNumber();
        setPreviewNumber(nextNum);
      } catch (err) {
        console.warn('Could not preview invoice number:', err);
      }
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoiceId)
      .maybeSingle();

    if (data) {
      setInvoice(data);
      setClientId(data.client_id || '');
      setProjectId(data.project_id || '');
      setNotes(data.notes || '');
      setDueDate(data.due_date || '');
      setSprints(
        (data.invoice_items || [])
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((item) => ({ ...item, _dirty: false }))
      );
    }
    setLoading(false);
  };

  const loadProjectsForClient = async (cId) => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', cId)
      .order('created_at', { ascending: false });
    setProjects(data || []);
  };

  const addSprint = () => {
    setSprints([
      ...sprints,
      {
        id: `new-${Date.now()}`,
        title: '',
        description: '',
        amount: 0,
        payment_mode: 'approve_only',
        payment_status: null,
        is_billable: true,
        sort_order: sprints.length,
        _isNew: true,
      },
    ]);
  };

  const updateSprint = (updated) => {
    setSprints(sprints.map((s) => (s.id === updated.id ? { ...updated, _dirty: true } : s)));
  };

  const deleteSprint = async (sprintId) => {
    if (String(sprintId).startsWith('new-')) {
      setSprints(sprints.filter((s) => s.id !== sprintId));
      return;
    }
    const { error } = await supabase.from('invoice_items').delete().eq('id', sprintId);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, status: 'error' });
      return;
    }
    setSprints(sprints.filter((s) => s.id !== sprintId));
    toast({ title: 'Sprint removed', status: 'success', duration: 1500 });
  };

  const handleSave = async (sendAfterSave = false) => {
    if (!clientId) {
      toast({ title: 'Select a client first', status: 'warning', duration: 2000 });
      return;
    }
    if (sprints.length === 0) {
      toast({ title: 'Add at least one sprint', status: 'warning', duration: 2000 });
      return;
    }

    if (sendAfterSave) {
      const check = validateSprintsForSend(sprints);
      if (!check.valid) {
        toast({
          title: 'Cannot send yet',
          description: check.reason,
          status: 'warning',
          duration: 3500,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const total = sprints
        .filter((s) => s.is_billable !== false)
        .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

      let savedInvoiceId = invoiceId;
      let savedInvoiceNumber = invoice?.invoice_number;

      if (isNew) {
        const inserted = await withInvoiceNumberRetry(async (newNumber) => {
          const { data, error } = await supabase
            .from('invoices')
            .insert({
              client_id: clientId,
              project_id: projectId || null,
              status: 'draft',
              invoice_number: newNumber,
              total,
              total_paid: 0,
              notes: notes || null,
              due_date: dueDate || null,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (error) throw error;
          return data;
        });
        savedInvoiceId = inserted.id;
        savedInvoiceNumber = inserted.invoice_number;
      } else {
        const { error } = await supabase
          .from('invoices')
          .update({
            client_id: clientId,
            project_id: projectId || null,
            total,
            notes: notes || null,
            due_date: dueDate || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);
        if (error) throw error;
      }

      for (const sprint of sprints) {
        const sprintPayload = {
          title: sprint.title || 'Untitled Sprint',
          description: sprint.description || null,
          amount: parseFloat(sprint.amount || 0),
          payment_mode: sprint.payment_mode || 'approve_only',
          is_billable: sprint.is_billable !== false,
          sort_order: sprint.sort_order || 0,
          invoice_id: savedInvoiceId,
        };

        if (sprint._isNew) {
          const childNumber = await fetchNextSprintNumber(savedInvoiceId);
          if (childNumber) sprintPayload.sprint_number = childNumber;
          sprintPayload.created_at = new Date().toISOString();
          await supabase.from('invoice_items').insert(sprintPayload);
        } else if (sprint._dirty) {
          await supabase
            .from('invoice_items')
            .update({ ...sprintPayload, updated_at: new Date().toISOString() })
            .eq('id', sprint.id);
        }
      }

      toast({
        title: isNew ? `Invoice ${savedInvoiceNumber} created` : 'Invoice saved',
        status: 'success',
        duration: 2000,
      });

      if (sendAfterSave) {
        await handleSend(savedInvoiceId);
      } else {
        onSaved();
        loadData();
      }
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id = invoiceId) => {
    if (!id) {
      toast({ title: 'Save first before sending', status: 'warning' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/.netlify/functions/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Send failed');
      }
      toast({
        title: 'Invoice sent',
        description: `${client?.name} will receive an email`,
        status: 'success',
        duration: 3000,
      });
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Send failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // RESEND - same email, fresh delivery
  // ============================================================
  const handleResend = async () => {
    if (!invoiceId) return;
    setResending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch('/.netlify/functions/resend-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          action: 'resend',
          userId: user?.id,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Resend failed');

      toast({
        title: 'Invoice resent',
        description: `Same email re-delivered to ${result.recipient}`,
        status: 'success',
        duration: 3000,
      });
      setHistoryRefreshKey((k) => k + 1);
      onSaved();
    } catch (err) {
      toast({ title: 'Resend failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setResending(false);
    }
  };

  // ============================================================
  // REMINDER - editorial nudge with custom subject + body
  // ============================================================
  const handleSendReminder = async ({ subject, body }) => {
    if (!invoiceId) return;
    setSendingReminder(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch('/.netlify/functions/resend-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          action: 'reminder',
          subject,
          body,
          userId: user?.id,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Reminder failed');

      toast({
        title: 'Reminder sent',
        description: `Friendly nudge delivered to ${result.recipient}`,
        status: 'success',
        duration: 3000,
      });
      setShowReminderModal(false);
      setHistoryRefreshKey((k) => k + 1);
      onSaved();
    } catch (err) {
      toast({ title: 'Reminder failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setSendingReminder(false);
    }
  };

  const handleHardDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    try {
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
      await supabase.from('invoices').delete().eq('id', invoiceId);

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('activity_log').insert({
        user_id: user?.id,
        action: 'invoice_deleted',
        entity_type: 'invoice',
        entity_id: invoiceId,
        metadata: { invoice_number: invoice?.invoice_number, hard_delete: true },
        created_at: new Date().toISOString(),
      });

      toast({ title: 'Invoice deleted', status: 'success', duration: 2000 });
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, status: 'error' });
      setDeleting(false);
    }
  };

  const handleSoftCancel = async (reason) => {
    setCancelling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('invoices')
        .update({
          cancelled_at: now,
          cancelled_by: user?.id,
          cancellation_reason: reason || null,
          pay_token: null,
          status: 'cancelled',
          updated_at: now,
        })
        .eq('id', invoiceId);

      if (error) throw error;

      await supabase.from('activity_log').insert({
        user_id: user?.id,
        action: 'invoice_cancelled',
        entity_type: 'invoice',
        entity_id: invoiceId,
        metadata: {
          invoice_number: invoice?.invoice_number,
          client_name: client?.name,
          reason: reason || null,
          original_status: invoice?.status,
        },
        created_at: now,
      });

      toast({
        title: 'Invoice cancelled',
        description: 'Pay link invalidated, snapshot preserved',
        status: 'success',
        duration: 3000,
      });
      setShowCancelModal(false);
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Cancel failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh">
        <Center minH="60vh">
          <Spinner size="lg" color="brand.500" />
        </Center>
      </Box>
    );
  }

  const billableTotal = sprints
    .filter((s) => s.is_billable !== false)
    .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
  const billableCount = sprints.filter((s) => s.is_billable !== false).length;

  const displayNumber = isNew
    ? (previewNumber || 'New Invoice')
    : (invoice?.invoice_number || 'Invoice');

  const previewInvoice = {
    ...invoice,
    invoice_number: isNew ? previewNumber : invoice?.invoice_number,
    client_id: clientId,
    notes,
    due_date: dueDate,
  };

  return (
    <Box position="relative" minH="100%">
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="400px"
        bg="radial-gradient(ellipse at top center, rgba(0,229,229,0.025), transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="900px" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }} position="relative">
        <HStack
          spacing={2}
          cursor="pointer"
          color="surface.500"
          _hover={{ color: 'brand.500' }}
          transition="color 0.15s"
          mb={6}
          onClick={onClose}
          userSelect="none"
        >
          <Icon as={TbArrowLeft} boxSize={3.5} />
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase">
            All Invoices
          </Text>
        </HStack>

        <VStack align="stretch" spacing={6} mb={6}>
          <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
            <VStack align="start" spacing={1}>
              <HStack spacing={3}>
                <Text
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="800"
                  color="white"
                  letterSpacing="-0.02em"
                  lineHeight="1"
                  fontFamily={isNew ? 'mono' : 'heading'}
                >
                  {displayNumber}
                </Text>
                {!isNew && invoice?.status && (
                  <HStack spacing={2}>
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      color={
                        invoice.status === 'paid' ? 'accent.neon' :
                        invoice.status === 'draft' ? 'surface.500' :
                        'brand.500'
                      }
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                      fontFamily="mono"
                    >
                      {invoice.status}
                    </Text>
                    {wasSent && (
                      <Tooltip label="View the email we sent" {...TOOLTIP_PROPS}>
                        <Box
                          as="button"
                          onClick={() => setShowSnapshot(true)}
                          color="surface.600"
                          _hover={{ color: 'brand.500' }}
                          transition="color 0.15s"
                          p={0.5}
                        >
                          <Icon as={TbEye} boxSize={3.5} />
                        </Box>
                      </Tooltip>
                    )}
                  </HStack>
                )}
                {isNew && previewNumber && (
                  <Text fontSize="2xs" color="surface.600" fontFamily="mono" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em">
                    Draft preview
                  </Text>
                )}
              </HStack>
              <Text color="surface.500" fontSize="sm">
                {billableCount} sprint{billableCount !== 1 ? 's' : ''} · {currency(billableTotal)}
              </Text>
            </VStack>

            <HStack spacing={2}>
              {!isPaid && (
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="surface.800"
                  color="surface.400"
                  borderRadius="lg"
                  onClick={() => handleSave(false)}
                  isLoading={saving && !sending}
                  loadingText="Saving"
                  _hover={{ borderColor: 'surface.700', color: 'white' }}
                >
                  Save Draft
                </Button>
              )}
              {isDraft && billableCount > 0 && clientId && (
                <Button
                  size="sm"
                  bg="brand.500"
                  color="surface.950"
                  fontWeight="700"
                  borderRadius="lg"
                  leftIcon={<TbSend size={14} />}
                  onClick={() => handleSave(true)}
                  isLoading={sending}
                  loadingText="Sending"
                  _hover={{ bg: 'brand.400', transform: 'translateY(-1px)' }}
                >
                  Save & Send
                </Button>
              )}

              {/* Resend + Reminder - only after invoice has been sent */}
              {canResendOrRemind && (
                <>
                  <Tooltip label="Send the same email again" {...TOOLTIP_PROPS}>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="brand.500"
                      color="brand.500"
                      fontWeight="700"
                      borderRadius="lg"
                      leftIcon={<TbRotateClockwise size={14} />}
                      onClick={handleResend}
                      isLoading={resending}
                      loadingText="Resending"
                      _hover={{ bg: 'rgba(0,229,229,0.08)' }}
                    >
                      Resend
                    </Button>
                  </Tooltip>
                  <Tooltip label="Send a friendly nudge" {...TOOLTIP_PROPS}>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="accent.banana"
                      color="accent.banana"
                      fontWeight="700"
                      borderRadius="lg"
                      leftIcon={<TbBellRinging size={14} />}
                      onClick={() => setShowReminderModal(true)}
                      _hover={{ bg: 'rgba(255,229,0,0.06)' }}
                    >
                      Remind
                    </Button>
                  </Tooltip>
                </>
              )}
            </HStack>
          </HStack>

          {/* SEND HISTORY STRIP */}
          {!isNew && (
            <SendHistoryStrip
              invoiceId={invoiceId}
              refreshKey={historyRefreshKey}
              onViewSnapshot={() => setShowSnapshot(true)}
            />
          )}
        </VStack>

        <HStack spacing={6} borderBottom="1px solid" borderColor="surface.900" mb={8}>
          {[
            { value: 'compose', label: 'Compose', icon: TbEdit },
            { value: 'preview', label: 'Preview', icon: TbEye },
          ].map((tab) => {
            const active = activeTab === tab.value;
            return (
              <Box
                key={tab.value}
                pb={3}
                cursor="pointer"
                position="relative"
                onClick={() => setActiveTab(tab.value)}
              >
                <HStack spacing={2}>
                  <Icon as={tab.icon} boxSize={3.5} color={active ? 'brand.500' : 'surface.600'} />
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    color={active ? 'white' : 'surface.600'}
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    {tab.label}
                  </Text>
                </HStack>
                {active && (
                  <Box
                    position="absolute"
                    bottom="-1px"
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

        {activeTab === 'compose' && (
          <VStack spacing={8} align="stretch">
            <HStack spacing={6} align="start">
              <Box flex={1}>
                <Text {...FIELD_LABEL}>Client</Text>
                <Select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Select client..."
                  {...nakedInput}
                  fontFamily="body"
                  cursor="pointer"
                  isDisabled={isPaid}
                  sx={{ '& option': { bg: 'surface.950', color: 'white' } }}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `· ${c.company}` : ''}
                    </option>
                  ))}
                </Select>
              </Box>
              {projects.length > 0 && (
                <Box flex={1}>
                  <Text {...FIELD_LABEL}>Project</Text>
                  <Select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="No project"
                    {...nakedInput}
                    fontFamily="body"
                    cursor="pointer"
                    isDisabled={isPaid}
                    sx={{ '& option': { bg: 'surface.950', color: 'white' } }}
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </Box>
              )}
            </HStack>

            <Box>
              <HStack justify="space-between" align="center" mb={4}>
                <Text {...FIELD_LABEL}>Sprints</Text>
                {!isPaid && (
                  <HStack
                    spacing={1.5}
                    cursor="pointer"
                    onClick={addSprint}
                    color="brand.500"
                    opacity={0.8}
                    _hover={{ opacity: 1 }}
                  >
                    <Icon as={TbPlus} boxSize={3} />
                    <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                      Add Sprint
                    </Text>
                  </HStack>
                )}
              </HStack>

              {sprints.length === 0 ? (
                <Box py={12} textAlign="center" border="1px dashed" borderColor="surface.800" borderRadius="xl">
                  <Icon as={TbBolt} boxSize={8} color="surface.700" mb={2} />
                  <Text color="surface.500" fontSize="sm" mb={3}>No sprints yet</Text>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="brand.500"
                    color="brand.500"
                    borderRadius="full"
                    leftIcon={<TbPlus size={12} />}
                    onClick={addSprint}
                  >
                    Add first sprint
                  </Button>
                </Box>
              ) : (
                <Box borderTop="1px solid" borderColor="surface.900">
                  {sprints.map((sprint) => (
                    <SprintEditRow
                      key={sprint.id}
                      sprint={sprint}
                      onUpdate={updateSprint}
                      onDelete={() => deleteSprint(sprint.id)}
                    />
                  ))}
                </Box>
              )}

              {sprints.length > 0 && (
                <HStack justify="flex-end" pt={5} spacing={6}>
                  <VStack align="end" spacing={1}>
                    <Text fontSize="2xs" color="surface.600" fontFamily="mono" fontWeight="700" textTransform="uppercase">
                      Billable Total
                    </Text>
                    <Text fontSize="2xl" color="white" fontFamily="mono" fontWeight="800">
                      {currency(billableTotal)}
                    </Text>
                  </VStack>
                </HStack>
              )}
            </Box>

            <Divider borderColor="surface.900" />

            <HStack spacing={6} align="start">
              <Box flex={2}>
                <Text {...FIELD_LABEL}>Internal Notes</Text>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes only visible to team"
                  bg="transparent"
                  border="1px solid"
                  borderColor="surface.800"
                  borderRadius="lg"
                  color="white"
                  fontSize="sm"
                  rows={3}
                  isReadOnly={isPaid}
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                  _placeholder={{ color: 'surface.700' }}
                />
              </Box>
              <Box flex={1}>
                <Text {...FIELD_LABEL}>Due Date</Text>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  isDisabled={isPaid}
                  {...nakedInput}
                />
              </Box>
            </HStack>

            {!isNew && (
              <Box pt={6}>
                {isDraft && (
                  <HStack
                    spacing={1.5}
                    cursor="pointer"
                    onClick={handleHardDelete}
                    color={confirmDelete ? 'red.400' : 'surface.700'}
                    opacity={confirmDelete ? 1 : 0.4}
                    _hover={{ opacity: 1, color: 'red.400' }}
                    transition="all 0.15s"
                    justify="center"
                    userSelect="none"
                  >
                    <Icon as={confirmDelete ? TbAlertTriangle : TbTrash} boxSize={3} />
                    <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                      {deleting ? 'Deleting...' : confirmDelete ? 'Click again to confirm' : 'Delete draft'}
                    </Text>
                  </HStack>
                )}

                {isSentish && (
                  <HStack
                    spacing={1.5}
                    cursor="pointer"
                    onClick={() => setShowCancelModal(true)}
                    color="surface.700"
                    opacity={0.4}
                    _hover={{ opacity: 1, color: 'red.400' }}
                    transition="all 0.15s"
                    justify="center"
                    userSelect="none"
                  >
                    <Icon as={TbAlertTriangle} boxSize={3} />
                    <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                      Cancel invoice
                    </Text>
                  </HStack>
                )}

                {isPaid && (
                  <Text
                    fontSize="2xs"
                    color="surface.700"
                    textAlign="center"
                    fontFamily="mono"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    Paid invoices cannot be deleted
                  </Text>
                )}
              </Box>
            )}
          </VStack>
        )}

        {activeTab === 'preview' && (
          <InvoicePreview
            invoice={previewInvoice}
            client={client}
            sprints={sprints.filter((s) => s.is_billable !== false)}
          />
        )}
      </Container>

      <CancelInvoiceModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        invoice={invoice}
        onConfirm={handleSoftCancel}
        processing={cancelling}
      />

      <ReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        invoice={invoice}
        client={client}
        onSend={handleSendReminder}
        sending={sendingReminder}
      />

      <InvoiceSnapshotModal
        isOpen={showSnapshot}
        onClose={() => setShowSnapshot(false)}
        invoiceId={invoiceId}
      />
    </Box>
  );
};

export default InvoiceEditor;
