// src/pages/Invoicing/components/InvoiceModal.jsx
import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, VStack, HStack, Text,
  Input, Button, FormControl, FormLabel, Textarea, Select,
  Icon, Badge, useToast, Box, IconButton, Divider,
} from '@chakra-ui/react';
import {
  TbEdit, TbPlus, TbTrash, TbAlertTriangle,
  TbFileInvoice, TbGripVertical,
} from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';

const PAYMENT_MODES = [
  { value: 'approve_only', label: 'Scope Confirmed', color: '#737373' },
  { value: 'deposit_50',   label: 'Fund to Start',   color: '#FFE500' },
  { value: 'pay_full',     label: 'Fund in Full',    color: '#39FF14' },
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

const LineItemRow = ({ item, index, onChange, onRemove }) => {
  const mode = PAYMENT_MODES.find((m) => m.value === item.payment_mode) || PAYMENT_MODES[0];

  return (
    <Box
      bg="surface.850"
      border="1px solid"
      borderColor="surface.800"
      borderRadius="lg"
      p={3}
      transition="all 0.15s"
      _hover={{ borderColor: 'surface.700' }}
    >
      <HStack justify="space-between" mb={2}>
        <Text color="surface.500" fontSize="2xs" fontFamily="mono" fontWeight="700">
          {String(index + 1).padStart(2, '0')}
        </Text>
        <IconButton
          icon={<TbTrash />}
          size="xs"
          variant="ghost"
          color="surface.600"
          _hover={{ color: 'red.400', bg: 'red.900' }}
          onClick={() => onRemove(index)}
          aria-label="Remove line item"
        />
      </HStack>

      <VStack spacing={3} align="stretch">
        <Input
          value={item.title}
          onChange={(e) => onChange(index, 'title', e.target.value)}
          placeholder="Service name"
          bg="surface.900"
          border="1px solid"
          borderColor="surface.700"
          color="white"
          fontSize="sm"
          h="40px"
          borderRadius="lg"
          fontWeight="600"
          _hover={{ borderColor: 'surface.600' }}
          _focus={{ borderColor: 'accent.neon', boxShadow: '0 0 0 1px #39FF14' }}
          _placeholder={{ color: 'surface.600', fontWeight: '400' }}
        />

        <Textarea
          value={item.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder="Scope, deliverables, timeline details"
          bg="surface.900"
          border="1px solid"
          borderColor="surface.700"
          color="white"
          fontSize="xs"
          borderRadius="lg"
          rows={2}
          _hover={{ borderColor: 'surface.600' }}
          _focus={{ borderColor: 'accent.neon', boxShadow: '0 0 0 1px #39FF14' }}
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
                value={item.amount || ''}
                onChange={(e) => onChange(index, 'amount', e.target.value)}
                placeholder="0"
                bg="surface.900"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                h="36px"
                borderLeftRadius="none"
                borderRightRadius="lg"
                fontFamily="mono"
                fontWeight="700"
                _hover={{ borderColor: 'surface.600' }}
                _focus={{ borderColor: 'accent.neon', boxShadow: '0 0 0 1px #39FF14' }}
                _placeholder={{ color: 'surface.700' }}
              />
            </HStack>
          </Box>

          <Box flex={1}>
            <Text color="surface.500" fontSize="2xs" fontWeight="600" mb={1}>Funding</Text>
            <HStack spacing={0} border="1px solid" borderColor="surface.700" borderRadius="lg" overflow="hidden">
              {PAYMENT_MODES.map((m) => {
                const isActive = item.payment_mode === m.value;
                return (
                  <Box
                    key={m.value}
                    flex={1}
                    py={2}
                    textAlign="center"
                    cursor="pointer"
                    onClick={() => onChange(index, 'payment_mode', m.value)}
                    bg={isActive ? `${m.color}12` : 'surface.900'}
                    borderRight="1px solid"
                    borderColor="surface.800"
                    transition="all 0.15s"
                    _last={{ borderRight: 'none' }}
                    _hover={{ bg: isActive ? undefined : 'surface.850' }}
                  >
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      color={isActive ? m.color : 'surface.600'}
                      letterSpacing="0.02em"
                    >
                      {m.value === 'approve_only' ? 'Confirm' : m.value === 'deposit_50' ? '50%' : 'Full'}
                    </Text>
                  </Box>
                );
              })}
            </HStack>
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
};

const InvoiceModal = ({ isOpen, onClose, invoice, projects, clients, onSave }) => {
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  const isEditing = !!invoice?.id;

  useEffect(() => {
    if (invoice) {
      setProjectId(invoice.project_id || '');
      setClientId(invoice.client_id || '');
      setNotes(invoice.notes || '');
      setLineItems(
        (invoice.line_items || []).map((item) => ({
          id: item.id,
          title: item.title || '',
          description: item.description || '',
          amount: item.amount || '',
          payment_mode: item.payment_mode || 'approve_only',
        }))
      );
    } else {
      setProjectId('');
      setClientId('');
      setNotes('');
      setLineItems([{
        title: '',
        description: '',
        amount: '',
        payment_mode: 'deposit_50',
      }]);
    }
    setConfirmDelete(false);
  }, [invoice, isOpen]);

  // Auto-set client when project is selected
  useEffect(() => {
    if (projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project?.client_id) setClientId(project.client_id);
    }
  }, [projectId, projects]);

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, {
      title: '',
      description: '',
      amount: '',
      payment_mode: 'deposit_50',
    }]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const total = lineItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const dueNow = lineItems.reduce((sum, item) => {
    const amt = parseFloat(item.amount || 0);
    if (item.payment_mode === 'pay_full') return sum + amt;
    if (item.payment_mode === 'deposit_50') return sum + (amt * 0.5);
    return sum;
  }, 0);

  const handleSave = async () => {
    const validItems = lineItems.filter((item) => item.title.trim());
    if (validItems.length === 0) {
      toast({ title: 'Add at least one line item with a title', status: 'warning', duration: 2000 });
      return;
    }

    setSaving(true);
    try {
      const selectedProject = projects.find((p) => p.id === projectId);

      if (isEditing) {
        // Update invoice
        const { error } = await supabase.from('invoices').update({
          project_id: projectId || null,
          client_id: clientId || null,
          total,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        }).eq('id', invoice.id);
        if (error) throw error;

        // Delete old line items and insert new
        await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
        const { error: itemsError } = await supabase.from('invoice_items').insert(
          validItems.map((item, idx) => ({
            invoice_id: invoice.id,
            title: item.title.trim(),
            description: item.description?.trim() || null,
            amount: parseFloat(item.amount || 0),
            payment_mode: item.payment_mode,
            sort_order: idx,
          }))
        );
        if (itemsError) throw itemsError;

        toast({ title: 'Invoice updated', status: 'success', duration: 2000 });
      } else {
        // Create invoice
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

        // Insert line items
        const { error: itemsError } = await supabase.from('invoice_items').insert(
          validItems.map((item, idx) => ({
            invoice_id: newInvoice.id,
            title: item.title.trim(),
            description: item.description?.trim() || null,
            amount: parseFloat(item.amount || 0),
            payment_mode: item.payment_mode,
            sort_order: idx,
          }))
        );
        if (itemsError) throw itemsError;

        // Log activity
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('activity_log').insert({
          user_id: user?.id,
          action: 'invoice_created',
          entity_type: 'invoice',
          entity_id: newInvoice.id,
          metadata: {
            invoice_number: invoiceNumber,
            total,
            client_name: clients.find((c) => c.id === clientId)?.name,
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
            <Icon as={isEditing ? TbEdit : TbFileInvoice} color="accent.neon" boxSize={5} />
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
            <HStack spacing={3} w="100%">
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
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Client</FormLabel>
                <Select value={clientId} onChange={(e) => setClientId(e.target.value)} {...inputProps}>
                  <option value="" style={{ background: '#0a0a0a' }}>No client</option>
                  {(clients || []).map((c) => (
                    <option key={c.id} value={c.id} style={{ background: '#0a0a0a' }}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>

            {/* Line items header */}
            <HStack w="100%" justify="space-between">
              <HStack spacing={2}>
                <Box w="6px" h="6px" borderRadius="full" bg="accent.neon" boxShadow="0 0 6px rgba(57,255,20,0.4)" />
                <Text color="accent.neon" fontSize="xs" fontFamily="mono" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em">
                  Line Items
                </Text>
              </HStack>
              <Button
                size="xs"
                leftIcon={<TbPlus />}
                variant="ghost"
                color="accent.neon"
                _hover={{ bg: 'rgba(57,255,20,0.08)' }}
                onClick={handleAddLineItem}
              >
                Add Item
              </Button>
            </HStack>

            {/* Line items */}
            <VStack spacing={2} w="100%" align="stretch">
              {lineItems.map((item, index) => (
                <LineItemRow
                  key={index}
                  item={item}
                  index={index}
                  onChange={handleLineItemChange}
                  onRemove={handleRemoveLineItem}
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
                    <Text color="surface.400" fontSize="xs">Total</Text>
                    <Text color="white" fontSize="md" fontWeight="700" fontFamily="mono">
                      ${total.toLocaleString()}
                    </Text>
                  </HStack>
                  {dueNow > 0 && dueNow < total && (
                    <HStack justify="space-between">
                      <Text color="surface.500" fontSize="xs">Due to activate</Text>
                      <Text color="accent.banana" fontSize="sm" fontWeight="700" fontFamily="mono">
                        ${dueNow.toLocaleString()}
                      </Text>
                    </HStack>
                  )}
                  {dueNow === 0 && (
                    <HStack justify="space-between">
                      <Text color="surface.500" fontSize="xs">Due now</Text>
                      <Badge bg="surface.800" color="surface.500" fontSize="2xs" px={2}>
                        Scope confirmed only
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
                placeholder="Payment terms, special instructions"
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