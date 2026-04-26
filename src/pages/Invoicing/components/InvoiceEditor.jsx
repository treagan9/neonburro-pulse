// src/pages/Invoicing/components/InvoiceEditor.jsx
// Invoice compose + preview surface.
// Phase 6.4b additions: Mark Paid (off-platform), Duplicate invoice.
// Bonus fix: due_date now stripped to YYYY-MM-DD before setting state
// so <input type="date"> doesn't emit the format warning.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, VStack, HStack, Text, Icon, Spinner, Center, Button,
  Input, Textarea, Select, Container, Divider, Tooltip, useToast,
} from '@chakra-ui/react';
import {
  TbArrowLeft, TbPlus, TbTrash, TbEdit, TbEye, TbSend, TbBolt,
  TbAlertTriangle, TbRotateClockwise, TbBellRinging, TbCash, TbCopy,
} from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import {
  fetchNextInvoiceNumber,
  fetchNextSprintNumber,
  withInvoiceNumberRetry,
} from '../../../lib/numbering';
import {
  SENT_STATUSES,
  TOOLTIP_PROPS,
  FIELD_LABEL,
  NAKED_INPUT,
  formatCurrency,
} from '../../../lib/invoiceConstants';
import { validateSprintsForSend } from '../../../lib/invoiceValidation';

import SprintEditRow from './SprintEditRow';
import CancelInvoiceModal from './CancelInvoiceModal';
import MarkPaidModal from './MarkPaidModal';
import InvoicePreview from './InvoicePreview';
import InvoiceSnapshotModal from './InvoiceSnapshotModal';
import SendHistoryStrip from './SendHistoryStrip';
import ReminderModal from './ReminderModal';

// Strip timestamp to YYYY-MM-DD for <input type="date"> compatibility
const dateInputValue = (val) => {
  if (!val) return '';
  if (val.length === 10 && val.match(/^\d{4}-\d{2}-\d{2}$/)) return val;
  try {
    return new Date(val).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const InvoiceEditor = ({ invoiceId, clientId: initialClientId, clients, onClose, onSaved }) => {
  const toast = useToast();
  const navigate = useNavigate();

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

  const [resending, setResending] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Phase 6.4b state
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const isNew = !invoiceId;
  const client = clients.find((c) => c.id === clientId);
  const isPaid = invoice?.status === 'paid';
  const isSentish = SENT_STATUSES.includes(invoice?.status);
  const isDraft = invoice?.status === 'draft' || isNew;
  const wasSent = !isNew && invoice?.status && invoice.status !== 'draft';
  const canResendOrRemind = isSentish && !invoice?.cancelled_at;
  const canMarkPaid = isSentish && !invoice?.cancelled_at;
  const canDuplicate = !isNew && !invoice?.cancelled_at;

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
      setDueDate(dateInputValue(data.due_date));
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

  const handleResend = async () => {
    if (!invoiceId) return;
    setResending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch('/.netlify/functions/resend-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, action: 'resend', userId: user?.id }),
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

  const handleSendReminder = async ({ subject, body }) => {
    if (!invoiceId) return;
    setSendingReminder(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch('/.netlify/functions/resend-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId, action: 'reminder', subject, body, userId: user?.id,
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

  // ============================================================
  // PHASE 6.4b - MARK PAID OFF-PLATFORM
  // ============================================================
  const handleMarkPaid = async ({ method, reference, amount, notes: payNotes, paid_date }) => {
    if (!invoiceId) return;
    setMarkingPaid(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      const newTotalPaid = parseFloat(invoice.total_paid || 0) + amount;
      const fullyPaid = newTotalPaid >= parseFloat(invoice.total || 0);

      const { error } = await supabase
        .from('invoices')
        .update({
          status: fullyPaid ? 'paid' : 'partial',
          total_paid: newTotalPaid,
          paid_at: fullyPaid ? `${paid_date}T12:00:00Z` : null,
          payment_method: method,
          payment_reference: reference,
          pay_token: fullyPaid ? null : invoice.pay_token, // kill pay link if fully paid
          updated_at: now,
        })
        .eq('id', invoiceId);

      if (error) throw error;

      await supabase.from('activity_log').insert({
        user_id: user?.id,
        action: fullyPaid ? 'invoice_paid' : 'invoice_partial_payment',
        entity_type: 'invoice',
        entity_id: invoiceId,
        metadata: {
          invoice_number: invoice?.invoice_number,
          client_name: client?.name,
          method,
          reference,
          amount,
          notes: payNotes,
          paid_date,
          off_platform: true,
        },
        created_at: now,
      });

      // Snapshot to invoice_history for the timeline
      await supabase.from('invoice_history').insert({
        invoice_id: invoiceId,
        sent_at: now,
        sent_by: user?.id,
        send_type: 'initial', // payment events use 'initial' bucket since no email sent
        amount,
        method,
        notes: `Off-platform payment: ${method}${reference ? ` (${reference})` : ''}${payNotes ? ` — ${payNotes}` : ''}`,
      });

      toast({
        title: fullyPaid ? 'Invoice marked paid' : 'Partial payment recorded',
        description: fullyPaid
          ? `${formatCurrency(amount)} via ${method} — fully paid`
          : `${formatCurrency(amount)} via ${method} — ${formatCurrency(parseFloat(invoice.total) - newTotalPaid)} still due`,
        status: 'success',
        duration: 4000,
      });

      setShowMarkPaidModal(false);
      onSaved();
      loadData();
    } catch (err) {
      toast({
        title: 'Mark paid failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setMarkingPaid(false);
    }
  };

  // ============================================================
  // PHASE 6.4b - DUPLICATE INVOICE
  // ============================================================
  const handleDuplicate = async () => {
    if (!invoiceId || duplicating) return;
    setDuplicating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create the new draft with a fresh invoice number
      const newInvoice = await withInvoiceNumberRetry(async (newNumber) => {
        const { data, error } = await supabase
          .from('invoices')
          .insert({
            client_id: invoice.client_id,
            project_id: invoice.project_id || null,
            status: 'draft',
            invoice_number: newNumber,
            total: invoice.total,
            total_paid: 0,
            notes: invoice.notes || null,
            due_date: null, // user picks fresh due date
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      });

      // Copy sprints with fresh sprint_numbers
      const sprintsToClone = (invoice.invoice_items || sprints).filter((s) => !String(s.id).startsWith('new-'));

      for (let i = 0; i < sprintsToClone.length; i++) {
        const original = sprintsToClone[i];
        const childNumber = await fetchNextSprintNumber(newInvoice.id);

        await supabase.from('invoice_items').insert({
          invoice_id: newInvoice.id,
          sprint_number: childNumber,
          title: original.title || 'Untitled Sprint',
          description: original.description || null,
          amount: parseFloat(original.amount || 0),
          payment_mode: original.payment_mode || 'approve_only',
          is_billable: original.is_billable !== false,
          sort_order: original.sort_order || i,
          created_at: new Date().toISOString(),
        });
      }

      await supabase.from('activity_log').insert({
        user_id: user?.id,
        action: 'invoice_duplicated',
        entity_type: 'invoice',
        entity_id: newInvoice.id,
        metadata: {
          source_invoice_id: invoiceId,
          source_invoice_number: invoice.invoice_number,
          new_invoice_number: newInvoice.invoice_number,
          sprint_count: sprintsToClone.length,
          client_name: client?.name,
        },
        created_at: new Date().toISOString(),
      });

      toast({
        title: 'Invoice duplicated',
        description: `${newInvoice.invoice_number} created as draft from ${invoice.invoice_number}`,
        status: 'success',
        duration: 3000,
      });

      onSaved();
      // Navigate to the new draft
      navigate(`/invoicing/?invoice=${newInvoice.id}`);
    } catch (err) {
      toast({
        title: 'Duplicate failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setDuplicating(false);
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
                        invoice.status === 'overdue' ? 'red.400' :
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
                {billableCount} sprint{billableCount !== 1 ? 's' : ''} · {formatCurrency(billableTotal)}
              </Text>
            </VStack>

            <HStack spacing={2} flexWrap="wrap" rowGap={2}>
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

              {canMarkPaid && (
                <Tooltip label="Record an off-platform payment" {...TOOLTIP_PROPS}>
                  <Button
                    size="sm"
                    bg="accent.neon"
                    color="surface.950"
                    fontWeight="700"
                    borderRadius="lg"
                    leftIcon={<TbCash size={14} />}
                    onClick={() => setShowMarkPaidModal(true)}
                    _hover={{ bg: '#2DD30F', transform: 'translateY(-1px)' }}
                  >
                    Mark Paid
                  </Button>
                </Tooltip>
              )}

              {canDuplicate && (
                <Tooltip label="Create a fresh draft with the same sprints" {...TOOLTIP_PROPS}>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="surface.800"
                    color="surface.400"
                    fontWeight="700"
                    borderRadius="lg"
                    leftIcon={<TbCopy size={14} />}
                    onClick={handleDuplicate}
                    isLoading={duplicating}
                    loadingText="Duplicating"
                    _hover={{ borderColor: 'surface.700', color: 'white' }}
                  >
                    Duplicate
                  </Button>
                </Tooltip>
              )}
            </HStack>
          </HStack>

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
                  {...NAKED_INPUT}
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
                    {...NAKED_INPUT}
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
                      {formatCurrency(billableTotal)}
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
                  {...NAKED_INPUT}
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

      <MarkPaidModal
        isOpen={showMarkPaidModal}
        onClose={() => setShowMarkPaidModal(false)}
        invoice={invoice}
        onConfirm={handleMarkPaid}
        processing={markingPaid}
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
