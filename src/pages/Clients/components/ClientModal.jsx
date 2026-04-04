// src/pages/Clients/components/ClientModal.jsx
import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, VStack, HStack, Text,
  Input, Button, FormControl, FormLabel, Textarea, Select,
  Icon, useToast,
} from '@chakra-ui/react';
import { TbEdit, TbPlus, TbTrash, TbAlertTriangle } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';

const inputProps = {
  bg: 'transparent',
  border: '1px solid',
  borderColor: 'surface.700',
  color: 'white',
  fontSize: 'sm',
  h: '44px',
  borderRadius: 'xl',
  _hover: { borderColor: 'surface.500' },
  _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' },
  _placeholder: { color: 'surface.600' },
};

const ClientModal = ({ isOpen, onClose, client, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  const isEditing = !!client?.id;

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setCompany(client.company || '');
      setStatus(client.status || 'active');
      setNotes(client.notes || '');
    } else {
      setName(''); setEmail(''); setPhone(''); setCompany(''); setStatus('active'); setNotes('');
    }
    setConfirmDelete(false);
  }, [client, isOpen]);

  const logActivity = async (action, entityId, metadata) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action,
      entity_type: 'client',
      entity_id: entityId,
      metadata,
      created_at: new Date().toISOString(),
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', status: 'warning', duration: 2000 });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        status,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase.from('clients').update(payload).eq('id', client.id);
        if (error) throw error;
        await logActivity('client_updated', client.id, { client_name: name.trim() });
        toast({ title: 'Client updated', status: 'success', duration: 2000 });
      } else {
        const { data, error } = await supabase.from('clients').insert(payload).select().single();
        if (error) throw error;
        await logActivity('client_created', data.id, { client_name: name.trim() });
        toast({ title: 'Client added', status: 'success', duration: 2000 });
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
      const { error } = await supabase.from('clients').delete().eq('id', client.id);
      if (error) throw error;
      await logActivity('client_deleted', client.id, { client_name: client.name });
      toast({ title: 'Client removed', status: 'success', duration: 2000 });
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
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="surface.900" border="1px solid" borderColor="surface.800" mx={4}>
        <ModalHeader color="white" fontSize="md" pb={2}>
          <HStack spacing={2}>
            <Icon as={isEditing ? TbEdit : TbPlus} color="brand.500" boxSize={5} />
            <Text>{isEditing ? 'Edit Client' : 'Add Client'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.400" />

        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Name</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name or business name" {...inputProps} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Email</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" {...inputProps} />
            </FormControl>
            <HStack spacing={3} w="100%">
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Phone</FormLabel>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(970) 555-1234" {...inputProps} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Status</FormLabel>
                <Select value={status} onChange={(e) => setStatus(e.target.value)} {...inputProps}>
                  <option value="active" style={{ background: '#0a0a0a' }}>Active</option>
                  <option value="lead" style={{ background: '#0a0a0a' }}>Lead</option>
                  <option value="inactive" style={{ background: '#0a0a0a' }}>Inactive</option>
                </Select>
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Company</FormLabel>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company or business name" {...inputProps} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Notes</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this client"
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                borderRadius="xl"
                rows={3}
                _hover={{ borderColor: 'surface.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
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
                size="sm" bg="brand.500" color="surface.950" fontWeight="700"
                _hover={{ bg: 'brand.400' }}
                onClick={handleSave} isLoading={saving} loadingText="Saving..."
              >
                {isEditing ? 'Save Changes' : 'Add Client'}
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClientModal;