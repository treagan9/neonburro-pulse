// src/pages/Invoicing/components/InvoiceEditor.jsx
// Inline invoice editor with Compose and Preview tabs
// - Compose: admin view, edit sprints, set amounts, funding modes, billable toggle
// - Preview: exactly what the client sees in their portal/email

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Container, Icon, Spinner, Center,
  Button, Input, Textarea, Select, useToast, Divider, Badge,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  TbArrowLeft, TbPlus, TbTrash, TbSend, TbEye, TbEdit,
  TbCheck, TbBolt, TbAlertTriangle, TbMail, TbX,
} from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import { getInitials, getAvatarColor } from '../../../utils/phone';
import InvoicePreview from './InvoicePreview';

const currency = (val) => {
  const num = parseFloat(val || 0);
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const FUNDING_MODES = [
  { value: 'approve_only', label: 'Confirm Scope', color: '#737373' },
  { value: 'deposit_50', label: '50% to Start', color: '#FFE500' },
  { value: 'pay_full', label: 'Fund in Full', color: '#39FF14' },
];

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
  _hover: { borderColor: 'surface.700' },
  _focus: { borderColor: 'brand.500', boxShadow: 'none' },
  _placeholder: { color: 'surface.700' },
};

const FIELD_LABEL = {
  fontSize: '2xs',
  fontWeight: '700',
  color: 'surface.600',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: 'mono',
  mb: 1,
};

// ============================================================
// SPRINT ROW (editable)
// ============================================================
const SprintEditRow = ({ sprint, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(!sprint.title);
  const isLocked = sprint.locked || sprint.payment_status === 'paid';
  const isWip = sprint.is_billable === false;

  return (
    <Box
      borderBottom="1px solid"
      borderColor="surface.900"
      py={3}
      opacity={isWip ? 0.5 : 1}
      transition="opacity 0.15s"
    >
      <HStack spacing={3} align="start">
        {/* Billable toggle */}
        <Box
          as="button"
          onClick={() => !isLocked && onUpdate({ ...sprint, is_billable: !isWip })}
          w="18px"
          h="18px"
          borderRadius="sm"
          border="1.5px solid"
          borderColor={isWip ? 'surface.700' : 'brand.500'}
          bg={isWip ? 'transparent' : 'brand.500'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          mt={1}
          cursor={isLocked ? 'not-allowed' : 'pointer'}
          flexShrink={0}
          transition="all 0.15s"
          _hover={!isLocked ? { borderColor: 'brand.500' } : {}}
        >
          {!isWip && <Icon as={TbCheck} boxSize={2.5} color="surface.950" strokeWidth={3} />}
        </Box>

        <Box flex={1}>
          {/* Title + amount row */}
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

          {/* Sprint meta + controls */}
          <HStack spacing={3} mt={1}>
            <Text color="surface.600" fontSize="2xs" fontFamily="mono" fontWeight="700">
              {sprint.sprint_number || '— not assigned yet —'}
            </Text>

            {/* Funding mode selector */}
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
                    _hover={!isLocked && !active ? { borderColor: 'surface.600' } : {}}
                  >
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      color={active ? mode.color : 'surface.600'}
                      textTransform="uppercase"
                      letterSpacing="0.03em"
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
              letterSpacing="0.05em"
            >
              {expanded ? 'Less' : 'Details'}
            </Box>

            {!isLocked && (
              <Box
                as="button"
                onClick={onDelete}
                color="surface.700"
                _hover={{ color: 'red.400' }}
                transition="color 0.15s"
              >
                <Icon as={TbTrash} boxSize={3.5} />
              </Box>
            )}
          </HStack>

          {/* Expanded description */}
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
              _hover={{ borderColor: 'surface.700' }}
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
// MAIN COMPONENT
// ============================================================
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
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isNew = !invoiceId;
  const client = clients.find((c) => c.id === clientId);

  useEffect(() => { loadData(); }, [invoiceId]);
  useEffect(() => {
    if (clientId) loadProjectsForClient(clientId);
  }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    if (isNew) {
      setInvoice({ status: 'draft' });
      setSprints([]);
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
    const newSprint = {
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      amount: 0,
      payment_mode: 'approve_only',
      payment_status: null,
      is_billable: true,
      sort_order: sprints.length,
      _isNew: true,
    };
    setSprints([...sprints, newSprint]);
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

    setSaving(true);
    try {
      const total = sprints
        .filter((s) => s.is_billable !== false)
        .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

      let savedInvoiceId = invoiceId;

      if (isNew) {
        // Generate a sprint number for this new invoice
        const { data: sprintNumData } = await supabase.rpc('next_sprint_number');
        const newInvoiceNumber = sprintNumData || `NB${Date.now().toString().slice(-6)}`;

        const { data, error } = await supabase
          .from('invoices')
          .insert({
            client_id: clientId,
            project_id: projectId || null,
            status: 'draft',
            invoice_number: newInvoiceNumber,
            total,
            total_paid: 0,
            notes: notes || null,
            due_date: dueDate || null,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        savedInvoiceId = data.id;
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

      // Save sprints
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
          // Assign a new sprint number
          const { data: sprintNumData } = await supabase.rpc('next_sprint_number');
          sprintPayload.sprint_number = sprintNumData;
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
        title: isNew ? 'Invoice created' : 'Invoice saved',
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

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
      await supabase.from('invoices').delete().eq('id', invoiceId);
      toast({ title: 'Invoice deleted', status: 'success', duration: 2000 });
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, status: 'error' });
      setDeleting(false);
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
        {/* Back button */}
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

        {/* Header */}
        <VStack align="stretch" spacing={6} mb={8}>
          <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
            <VStack align="start" spacing={1}>
              <HStack spacing={3}>
                <Text
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="800"
                  color="white"
                  letterSpacing="-0.02em"
                  lineHeight="1"
                >
                  {isNew ? 'New Invoice' : invoice?.invoice_number || 'Invoice'}
                </Text>
                {!isNew && invoice?.status && (
                  <Text
                    fontSize="2xs"
                    fontWeight="700"
                    color={invoice.status === 'paid' ? 'accent.neon' : invoice.status === 'draft' ? 'surface.500' : 'brand.500'}
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    fontFamily="mono"
                  >
                    {invoice.status}
                  </Text>
                )}
              </HStack>
              <Text color="surface.500" fontSize="sm">
                {billableCount} sprint{billableCount !== 1 ? 's' : ''} · {currency(billableTotal)}
              </Text>
            </VStack>

            <HStack spacing={2}>
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
              {(invoice?.status === 'draft' || isNew) && billableCount > 0 && clientId && (
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
            </HStack>
          </HStack>
        </VStack>

        {/* Tabs */}
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

        {/* ========== COMPOSE TAB ========== */}
        {activeTab === 'compose' && (
          <VStack spacing={8} align="stretch">
            {/* Client + project selector */}
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
                  sx={{
                    '& option': {
                      bg: 'surface.950',
                      color: 'white',
                    },
                  }}
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
                    sx={{
                      '& option': { bg: 'surface.950', color: 'white' },
                    }}
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </Box>
              )}
            </HStack>

            {/* Sprints section */}
            <Box>
              <HStack justify="space-between" align="center" mb={4}>
                <Text {...FIELD_LABEL}>Sprints</Text>
                <HStack
                  spacing={1.5}
                  cursor="pointer"
                  onClick={addSprint}
                  color="brand.500"
                  opacity={0.8}
                  _hover={{ opacity: 1 }}
                  transition="opacity 0.15s"
                >
                  <Icon as={TbPlus} boxSize={3} />
                  <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                    Add Sprint
                  </Text>
                </HStack>
              </HStack>

              {sprints.length === 0 ? (
                <Box
                  py={12}
                  textAlign="center"
                  border="1px dashed"
                  borderColor="surface.800"
                  borderRadius="xl"
                >
                  <Icon as={TbBolt} boxSize={8} color="surface.700" mb={2} />
                  <Text color="surface.500" fontSize="sm" mb={3}>
                    No sprints yet
                  </Text>
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

              {/* Totals */}
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

            {/* Notes + due date */}
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
                  _hover={{ borderColor: 'surface.700' }}
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
                  {...nakedInput}
                />
              </Box>
            </HStack>

            {/* Delete button - subtle, at bottom */}
            {!isNew && invoice?.status === 'draft' && (
              <HStack
                spacing={1.5}
                cursor="pointer"
                onClick={handleDelete}
                color={confirmDelete ? 'red.400' : 'surface.700'}
                opacity={confirmDelete ? 1 : 0.4}
                _hover={{ opacity: 1, color: 'red.400' }}
                transition="all 0.15s"
                justify="center"
                pt={6}
                userSelect="none"
              >
                <Icon as={confirmDelete ? TbAlertTriangle : TbTrash} boxSize={3} />
                <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                  {deleting ? 'Deleting...' : confirmDelete ? 'Click again to confirm' : 'Delete invoice'}
                </Text>
              </HStack>
            )}
          </VStack>
        )}

        {/* ========== PREVIEW TAB ========== */}
        {activeTab === 'preview' && (
          <InvoicePreview
            invoice={{ ...invoice, client_id: clientId, notes, due_date: dueDate }}
            client={client}
            sprints={sprints.filter((s) => s.is_billable !== false)}
          />
        )}
      </Container>
    </Box>
  );
};

export default InvoiceEditor;