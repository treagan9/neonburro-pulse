// src/pages/Invoicing/components/InvoiceModal.jsx
import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, VStack, HStack, Text,
  Input, Button, FormControl, FormLabel, Textarea, Select,
  Icon, Badge, useToast, Box, IconButton, Divider, Tooltip,
} from '@chakra-ui/react';
import {
  TbEdit, TbPlus, TbTrash, TbAlertTriangle,
  TbFileInvoice, TbBolt, TbLock, TbUserPlus, TbBookmark,
} from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';

const PAYMENT_MODES = [
  { value: 'approve_only', label: 'Confirm', color: '#737373' },
  { value: 'deposit_50',   label: '50%',     color: '#FFE500' },
  { value: 'pay_full',     label: 'Full',    color: '#39FF14' },
];

const inputProps = {
  bg: 'transparent',
  border: '1px solid',
  borderColor: 'surface.700',
  color: 'white',
  fontSize: 'sm',
  h: '44px',
  borderRadius: 'xl',
  _hover: { borderColor: 'surface.500' },
  _focus: { borderColor: 'accent.neon', boxShadow: '0 0 0 1px #39FF14' },
  _placeholder: { color: 'surface.600' },
};

const generateInvoiceNumber = async (projectNumber) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const prefix = projectNumber || `NB-${year}${month}${day}`;

  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `INV-${prefix}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  let seq = 1;
  if (data && data.length > 0 && data[0].invoice_number) {
    const last = parseInt(data[0].invoice_number.split('-').pop()) || 0;
    seq = last + 1;
  }

  return `INV-${prefix}-${seq.toString().padStart(3, '0')}`;
};

// ============================================================
// Sprint Row - individual sprint editor
// ============================================================
const SprintRow = ({ sprint, index, onChange, onRemove }) => {
  const isLocked = sprint.locked || sprint.payment_status === 'paid';

  return (
    <Box
      bg={isLocked ? 'rgba(57,255,20,0.04)' : 'surface.850'}
      border="1px solid"
      borderColor={isLocked ? 'rgba(57,255,20,0.3)' : 'surface.800'}
      borderRadius="lg"
      p={3}
      transition="all 0.15s"
      _hover={!isLocked && { borderColor: 'surface.700' }}
      position="relative"
    >
      {isLocked && (
        <Box
          position="absolute"
          top={2}
          right={2}
          bg="rgba(57,255,20,0.15)"
          border="1px solid rgba(57,255,20,0.4)"
          borderRadius="md"
          px={2}
          py={0.5}
        >
          <HStack spacing={1}>
            <Icon as={TbLock} boxSize={2.5} color="accent.neon" />
            <Text fontSize="2xs" color="accent.neon" fontWeight="700" letterSpacing="0.05em">
              LOCKED · PAID
            </Text>
          </HStack>
        </Box>
      )}

      <HStack justify="space-between" mb={2}>
        <HStack spacing={2}>
          <Text color="accent.neon" fontSize="2xs" fontFamily="mono" fontWeight="700">
            SPRINT {String(index + 1).padStart(2, '0')}
          </Text>
        </HStack>
        {!isLocked && (
          <IconButton
            icon={<TbTrash />}
            size="xs"
            variant="ghost"
            color="surface.600"
            _hover={{ color: 'red.400', bg: 'red.900' }}
            onClick={() => onRemove(index)}
            aria-label="Remove sprint"
          />
        )}
      </HStack>

      <VStack spacing={3} align="stretch">
        <Input
          value={sprint.title}
          onChange={(e) => onChange(index, 'title', e.target.value)}
          placeholder="Sprint name"
          isReadOnly={isLocked}
          bg={isLocked ? 'transparent' : 'surface.900'}
          border="1px solid"
          borderColor="surface.700"
          color="white"
          fontSize="sm"
          h="40px"
          borderRadius="lg"
          fontWeight="600"
          _hover={!isLocked && { borderColor: 'surface.600' }}
          _focus={!isLocked && { borderColor: 'accent.neon', boxShadow: '0 0 0 1px #39FF14' }}
          _placeholder={{ color: 'surface.600', fontWeight: '400' }}
        />

        <Textarea
          value={sprint.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder="Scope, deliverables, timeline"
          isReadOnly={isLocked}
          bg={isLocked ? 'transparent' : 'surface.900'}
          border="1px solid"
          borderColor="surface.700"
          color="white"
          fontSize="xs"
          borderRadius="lg"
          rows={2}
          _hover={!isLocked && { borderColor: 'surface.600' }}
          _focus={!isLocked && { borderColor: 'accent.neon', boxShadow: '0 0 0 1px #39FF14' }}
          _placeholder={{ color: 'surface.600' }}
        />

        <HStack spacing={3}>
          <Box flex={1}>
            <Text color="surface.500" fontSize="2xs" fontWeight="600" mb={1}>Amount</Text>
            <HStack spacing={0}>
              <Box
                px={3}
                h="36px"
                display="flex"
                alignItems="center"
                bg="surface.800"
                borderLeftRadius="lg"
                border="1px solid"
                borderColor="surface.700"
                borderRight="none"
              >
                <Text color="surface.500" fontSize="sm">$</Text>
              </Box>
              <Input
                type="number"
                value={sprint.amount || ''}
                onChange={(e) => onChange(index, 'amount', e.target.value)}
                placeholder="0"
                isReadOnly={isLocked}
                bg={isLocked ? 'transparent' : 'surface.900'}
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                h="36px"
                borderLeftRadius="none"
                borderRightRadius="lg"
                fontFamily="mono"
                fontWeight="700"
                _hover={!isLocked && { borderColor: 'surface.600' }}
                _focus={!isLocked && { borderColor: 'accent.neon', boxShadow: '0 0 0 1px #39FF14' }}
                _placeholder={{ color: 'surface.700' }}
              />
            </HStack>
          </Box>

          <Box flex={1}>
            <Text color="surface.500" fontSize="2xs" fontWeight="600" mb={1}>Funding</Text>
            <HStack spacing={0} border="1px solid" borderColor="surface.700" borderRadius="lg" overflow="hidden">
              {PAYMENT_MODES.map((m) => {
                const isActive = sprint.payment_mode === m.value;
                return (
                  <Box
                    key={m.value}
                    flex={1}
                    py={2}
                    textAlign="center"
                    cursor={isLocked ? 'not-allowed' : 'pointer'}
                    onClick={() => !isLocked && onChange(index, 'payment_mode', m.value)}
                    bg={isActive ? `${m.color}12` : 'surface.900'}
                    borderRight="1px solid"
                    borderColor="surface.800"
                    transition="all 0.15s"
                    opacity={isLocked ? 0.5 : 1}
                    _last={{ borderRight: 'none' }}
                    _hover={!isLocked && { bg: isActive ? undefined : 'surface.850' }}
                  >
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      color={isActive ? m.color : 'surface.600'}
                      letterSpacing="0.02em"
                    >
                      {m.label}
                    </Text>
                  </Box>
                );
              })}
            </HStack>
          </Box>
        </HStack>

        {sprint.payment_method && (
          <HStack spacing={2} bg="surface.900" border="1px solid" borderColor="surface.800" borderRadius="md" px={3} py={1.5}>
            <Icon as={TbLock} boxSize={3} color="accent.neon" />
            <Text fontSize="2xs" color="surface.400">
              Paid via <Text as="span" color="white" fontWeight="700">{sprint.payment_method}</Text>
              {sprint.payment_reference && <Text as="span" color="surface.500"> · {sprint.payment_reference}</Text>}
            </Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

// ============================================================
// Quick Add Client - inline new client creator
// ============================================================
const QuickAddClient = ({ onCreated, onCancel }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Name required', status: 'warning', duration: 2000 });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast({ title: 'Valid email required', status: 'warning', duration: 2000 });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Client added', status: 'success', duration: 2000 });
      onCreated(data);
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      bg="surface.850"
      border="1px solid rgba(0,229,229,0.3)"
      borderRadius="lg"
      p={3}
    >
      <HStack mb={3} spacing={2}>
        <Icon as={TbUserPlus} color="brand.500" boxSize={4} />
        <Text fontSize="xs" color="brand.500" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em">
          New Client
        </Text>
      </HStack>
      <VStack spacing={2}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Client name or company"
          {...inputProps}
          h="38px"
          autoFocus
        />
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          type="email"
          {...inputProps}
          h="38px"
        />
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional)"
          type="tel"
          {...inputProps}
          h="38px"
        />
        <HStack w="100%" justify="flex-end" pt={1}>
          <Button size="xs" variant="ghost" color="surface.500" onClick={onCancel}>Cancel</Button>
          <Button
            size="xs"
            bg="brand.500"
            color="surface.950"
            fontWeight="700"
            isLoading={saving}
            onClick={handleSave}
          >
            Save Client
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

// ============================================================
// Catalog Picker - browse saved sprint types
// ============================================================
const CatalogPicker = ({ catalog, onSelect, onClose }) => (
  <Box
    bg="surface.850"
    border="1px solid"
    borderColor="surface.800"
    borderRadius="lg"
    p={3}
    maxH="320px"
    overflowY="auto"
  >
    <HStack mb={3} justify="space-between">
      <HStack spacing={2}>
        <Icon as={TbBookmark} color="accent.banana" boxSize={4} />
        <Text fontSize="xs" color="accent.banana" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em">
          Sprint Catalog
        </Text>
      </HStack>
      <Button size="xs" variant="ghost" color="surface.500" onClick={onClose}>Close</Button>
    </HStack>
    <VStack spacing={2} align="stretch">
      {catalog.length === 0 ? (
        <Text color="surface.500" fontSize="xs" textAlign="center" py={6}>
          No saved sprints yet. Create one and save it.
        </Text>
      ) : (
        catalog.map((item) => (
          <Box
            key={item.id}
            bg="surface.900"
            border="1px solid"
            borderColor="surface.800"
            borderRadius="md"
            p={3}
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ borderColor: 'accent.banana', bg: 'surface.850' }}
            onClick={() => onSelect(item)}
          >
            <HStack justify="space-between" mb={1}>
              <Text color="white" fontSize="sm" fontWeight="700" noOfLines={1}>{item.title}</Text>
              <Text color="accent.banana" fontSize="sm" fontWeight="700" fontFamily="mono">${parseFloat(item.default_amount || 0).toLocaleString()}</Text>
            </HStack>
            {item.description && (
              <Text color="surface.500" fontSize="2xs" noOfLines={2}>{item.description}</Text>
            )}
            {item.times_used > 0 && (
              <Text color="surface.600" fontSize="2xs" mt={1}>Used {item.times_used} time{item.times_used !== 1 ? 's' : ''}</Text>
            )}
          </Box>
        ))
      )}
    </VStack>
  </Box>
);

// ============================================================
// Main Modal
// ============================================================
const InvoiceModal = ({ isOpen, onClose, invoice, projects, clients, onSave }) => {
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [sprints, setSprints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [localClients, setLocalClients] = useState([]);
  const toast = useToast();

  const isEditing = !!invoice?.id;

  useEffect(() => {
    setLocalClients(clients || []);
  }, [clients]);

  useEffect(() => {
    if (isOpen) loadCatalog();
  }, [isOpen]);

  const loadCatalog = async () => {
    const { data } = await supabase
      .from('sprints_catalog')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    setCatalog(data || []);
  };

  useEffect(() => {
    if (invoice) {
      setProjectId(invoice.project_id || '');
      setClientId(invoice.client_id || '');
      setNotes(invoice.notes || '');
      setSprints(
        (invoice.line_items || []).map((item) => ({
          id: item.id,
          title: item.title || '',
          description: item.description || '',
          amount: item.amount || '',
          payment_mode: item.payment_mode || 'approve_only',
          payment_status: item.payment_status || 'unpaid',
          payment_method: item.payment_method,
          payment_reference: item.payment_reference,
          locked: item.locked || false,
        }))
      );
    } else {
      setProjectId('');
      setClientId('');
      setNotes('');
      setSprints([{
        title: '',
        description: '',
        amount: '',
        payment_mode: 'deposit_50',
      }]);
    }
    setConfirmDelete(false);
    setShowQuickAdd(false);
    setShowCatalog(false);
  }, [invoice, isOpen]);

  useEffect(() => {
    if (projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project?.client_id) setClientId(project.client_id);
    }
  }, [projectId, projects]);

  const handleSprintChange = (index, field, value) => {
    const updated = [...sprints];
    updated[index] = { ...updated[index], [field]: value };
    setSprints(updated);
  };

  const handleAddSprint = () => {
    setSprints([...sprints, {
      title: '',
      description: '',
      amount: '',
      payment_mode: 'deposit_50',
    }]);
  };

  const handleRemoveSprint = (index) => {
    if (sprints.length <= 1) return;
    setSprints(sprints.filter((_, i) => i !== index));
  };

  const handleAddFromCatalog = async (catalogItem) => {
    setSprints([...sprints, {
      title: catalogItem.title,
      description: catalogItem.description || '',
      amount: catalogItem.default_amount || '',
      payment_mode: 'deposit_50',
      catalog_id: catalogItem.id,
    }]);
    // Track usage
    await supabase.rpc('increment_sprint_usage', { sprint_id: catalogItem.id });
    setShowCatalog(false);
    toast({ title: `${catalogItem.title} added`, status: 'success', duration: 1500 });
  };

  const handleClientCreated = (newClient) => {
    setLocalClients([newClient, ...localClients]);
    setClientId(newClient.id);
    setShowQuickAdd(false);
  };

  const total = sprints.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const dueNow = sprints.reduce((sum, item) => {
    const amt = parseFloat(item.amount || 0);
    if (item.payment_mode === 'pay_full') return sum + amt;
    if (item.payment_mode === 'deposit_50') return sum + (amt * 0.5);
    return sum;
  }, 0);

  const handleSave = async () => {
    const validSprints = sprints.filter((item) => item.title.trim());
    if (validSprints.length === 0) {
      toast({ title: 'Add at least one sprint with a title', status: 'warning', duration: 2000 });
      return;
    }

    setSaving(true);
    try {
      const selectedProject = projects.find((p) => p.id === projectId);

      if (isEditing) {
        const { error } = await supabase.from('invoices').update({
          project_id: projectId || null,
          client_id: clientId || null,
          total,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        }).eq('id', invoice.id);
        if (error) throw error;

        // Only delete unlocked items
        await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id).eq('locked', false);

        // Insert non-locked items
        const itemsToInsert = validSprints.filter(s => !s.locked).map((item, idx) => ({
          invoice_id: invoice.id,
          title: item.title.trim(),
          description: item.description?.trim() || null,
          amount: parseFloat(item.amount || 0),
          payment_mode: item.payment_mode,
          sort_order: idx,
        }));

        if (itemsToInsert.length > 0) {
          const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
          if (itemsError) throw itemsError;
        }

        toast({ title: 'Invoice updated', status: 'success', duration: 2000 });
      } else {
        const invoiceNumber = await generateInvoiceNumber(selectedProject?.project_number);

        const { data: newInvoice, error } = await supabase.from('invoices').insert({
          project_id: projectId || null,
          client_id: clientId || null,
          invoice_number: invoiceNumber,
          status: 'draft',
          total,
          notes: notes.trim() || null,
        }).select().single();
        if (error) throw error;

        const { error: itemsError } = await supabase.from('invoice_items').insert(
          validSprints.map((item, idx) => ({
            invoice_id: newInvoice.id,
            title: item.title.trim(),
            description: item.description?.trim() || null,
            amount: parseFloat(item.amount || 0),
            payment_mode: item.payment_mode,
            sort_order: idx,
          }))
        );
        if (itemsError) throw itemsError;

        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('activity_log').insert({
          user_id: user?.id,
          action: 'invoice_created',
          entity_type: 'invoice',
          entity_id: newInvoice.id,
          metadata: {
            invoice_number: invoiceNumber,
            total,
            sprints_count: validSprints.length,
            client_name: localClients.find((c) => c.id === clientId)?.name,
          },
          created_at: new Date().toISOString(),
        });

        toast({ title: 'Invoice created', description: invoiceNumber, status: 'success', duration: 3000 });
      }

      onSave();
      onClose();
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
      const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
      if (error) throw error;
      toast({ title: 'Invoice removed', status: 'success', duration: 2000 });
      onSave();
      onClose();
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, status: 'error', duration: 3000 });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="surface.900" border="1px solid" borderColor="surface.800" mx={4}>
        <ModalHeader color="white" fontSize="md" pb={2}>
          <HStack spacing={2}>
            <Icon as={isEditing ? TbEdit : TbBolt} color="accent.neon" boxSize={5} />
            <Text>{isEditing ? 'Edit Invoice' : 'New Invoice'}</Text>
            {isEditing && invoice?.invoice_number && (
              <Badge fontSize="2xs" fontFamily="mono" bg="surface.800" color="accent.neon" px={2} borderRadius="md">
                {invoice.invoice_number}
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.400" />

        <ModalBody>
          <VStack spacing={5}>
            {/* Project + Client */}
            <HStack spacing={3} w="100%" align="flex-end">
              <FormControl flex={1}>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Project</FormLabel>
                <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} {...inputProps}>
                  <option value="" style={{ background: '#0a0a0a' }}>No project linked</option>
                  {(projects || []).map((p) => (
                    <option key={p.id} value={p.id} style={{ background: '#0a0a0a' }}>
                      {p.project_number ? `${p.project_number} - ` : ''}{p.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl flex={1}>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="xs" fontWeight="600" color="surface.500">Client</Text>
                  <Button
                    size="2xs"
                    variant="ghost"
                    color="brand.500"
                    leftIcon={<TbUserPlus size={11} />}
                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                    fontSize="2xs"
                    fontWeight="700"
                    h="18px"
                    px={1.5}
                    _hover={{ bg: 'rgba(0,229,229,0.08)' }}
                  >
                    NEW
                  </Button>
                </HStack>
                <Select value={clientId} onChange={(e) => setClientId(e.target.value)} {...inputProps}>
                  <option value="" style={{ background: '#0a0a0a' }}>No client</option>
                  {localClients.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: '#0a0a0a' }}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>

            {/* Quick Add Client */}
            {showQuickAdd && (
              <Box w="100%">
                <QuickAddClient
                  onCreated={handleClientCreated}
                  onCancel={() => setShowQuickAdd(false)}
                />
              </Box>
            )}

            {/* Sprints header */}
            <HStack w="100%" justify="space-between">
              <HStack spacing={2}>
                <Box w="6px" h="6px" borderRadius="full" bg="accent.neon" boxShadow="0 0 6px rgba(57,255,20,0.4)" />
                <Text color="accent.neon" fontSize="xs" fontFamily="mono" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em">
                  Sprints
                </Text>
              </HStack>
              <HStack spacing={1}>
                <Button
                  size="xs"
                  leftIcon={<TbBookmark size={12} />}
                  variant="ghost"
                  color="accent.banana"
                  _hover={{ bg: 'rgba(255,229,0,0.08)' }}
                  onClick={() => setShowCatalog(!showCatalog)}
                  fontWeight="700"
                >
                  Catalog
                </Button>
                <Button
                  size="xs"
                  leftIcon={<TbPlus />}
                  variant="ghost"
                  color="accent.neon"
                  _hover={{ bg: 'rgba(57,255,20,0.08)' }}
                  onClick={handleAddSprint}
                  fontWeight="700"
                >
                  Add
                </Button>
              </HStack>
            </HStack>

            {/* Catalog Picker */}
            {showCatalog && (
              <Box w="100%">
                <CatalogPicker
                  catalog={catalog}
                  onSelect={handleAddFromCatalog}
                  onClose={() => setShowCatalog(false)}
                />
              </Box>
            )}

            {/* Sprints */}
            <VStack spacing={2} w="100%" align="stretch">
              {sprints.map((sprint, index) => (
                <SprintRow
                  key={index}
                  sprint={sprint}
                  index={index}
                  onChange={handleSprintChange}
                  onRemove={handleRemoveSprint}
                />
              ))}
            </VStack>

            {/* Totals */}
            {total > 0 && (
              <Box
                w="100%"
                bg="surface.850"
                border="1px solid"
                borderColor="surface.800"
                borderRadius="lg"
                p={3}
              >
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text color="surface.400" fontSize="xs">Total Project Value</Text>
                    <Text color="white" fontSize="md" fontWeight="700" fontFamily="mono">
                      ${total.toLocaleString()}
                    </Text>
                  </HStack>
                  {dueNow > 0 && dueNow < total && (
                    <HStack justify="space-between">
                      <Text color="surface.500" fontSize="xs">Due to Push Forward</Text>
                      <Text color="accent.banana" fontSize="sm" fontWeight="700" fontFamily="mono">
                        ${dueNow.toLocaleString()}
                      </Text>
                    </HStack>
                  )}
                  {dueNow === 0 && (
                    <HStack justify="space-between">
                      <Text color="surface.500" fontSize="xs">Status</Text>
                      <Badge bg="surface.800" color="surface.500" fontSize="2xs" px={2}>
                        Awaiting approval only
                      </Badge>
                    </HStack>
                  )}
                  {dueNow === total && total > 0 && (
                    <HStack justify="space-between">
                      <Text color="surface.500" fontSize="xs">Status</Text>
                      <Badge bg="rgba(57,255,20,0.1)" color="accent.neon" fontSize="2xs" px={2}>
                        Full funding requested
                      </Badge>
                    </HStack>
                  )}
                </VStack>
              </Box>
            )}

            {/* Notes */}
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Notes</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, special instructions, anything to remember"
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                borderRadius="xl"
                rows={2}
                _hover={{ borderColor: 'surface.500' }}
                _focus={{ borderColor: 'accent.neon', boxShadow: '0 0 0 1px #39FF14' }}
                _placeholder={{ color: 'surface.600' }}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="surface.800" pt={4}>
          <HStack spacing={2} w="100%" justify={isEditing ? 'space-between' : 'flex-end'}>
            {isEditing && (
              <Button
                size="sm" variant="ghost"
                color={confirmDelete ? 'red.400' : 'surface.500'}
                leftIcon={confirmDelete ? <TbAlertTriangle /> : <TbTrash />}
                onClick={handleDelete} isLoading={deleting} loadingText="Removing..."
                _hover={{ color: 'red.400', bg: 'red.900' }}
              >
                {confirmDelete ? 'Confirm Remove' : 'Remove'}
              </Button>
            )}
            <HStack spacing={2}>
              <Button size="sm" variant="ghost" color="surface.400" onClick={onClose}>Cancel</Button>
              <Button
                size="sm" bg="accent.neon" color="surface.950" fontWeight="700"
                _hover={{ bg: '#2EE60D', transform: 'translateY(-1px)' }}
                onClick={handleSave} isLoading={saving} loadingText="Saving..."
              >
                {isEditing ? 'Save Invoice' : 'Create Invoice'}
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InvoiceModal;