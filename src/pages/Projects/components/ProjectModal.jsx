// src/pages/Projects/components/ProjectModal.jsx
import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, VStack, HStack, Text,
  Input, Button, FormControl, FormLabel, Textarea, Select,
  Icon, Badge, useToast, Box,
} from '@chakra-ui/react';
import { TbEdit, TbPlus, TbTrash, TbAlertTriangle } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';

const STATUS_OPTIONS = [
  { value: 'lead',     label: 'Lead',     color: '#FFE500' },
  { value: 'proposal', label: 'Proposal', color: '#8B5CF6' },
  { value: 'active',   label: 'Active',   color: '#39FF14' },
  { value: 'complete', label: 'Complete', color: '#00E5E5' },
  { value: 'archived', label: 'Archived', color: '#737373' },
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
  _focus: { borderColor: 'accent.purple', boxShadow: '0 0 0 1px var(--chakra-colors-accent-purple)' },
  _placeholder: { color: 'surface.600' },
};

const generateProjectNumber = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `NB-${year}${month}`;

  try {
    const { data } = await supabase
      .from('projects')
      .select('project_number')
      .like('project_number', `${prefix}%`)
      .order('project_number', { ascending: false })
      .limit(1);

    let seq = 1;
    if (data && data.length > 0 && data[0].project_number) {
      const last = parseInt(data[0].project_number.slice(-2)) || 0;
      seq = last + 1;
    }
    return `${prefix}${seq.toString().padStart(2, '0')}`;
  } catch {
    return `${prefix}01`;
  }
};

const logActivity = async (action, entityId, metadata) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action,
      entity_type: 'project',
      entity_id: entityId,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};

const ProjectModal = ({ isOpen, onClose, project, clients = [], onSave }) => {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('lead');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  const isEditing = !!project?.id;

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setClientId(project.client_id || '');
      setStatus(project.status || 'lead');
      setNotes(project.notes || '');
    } else {
      setName('');
      setClientId('');
      setStatus('lead');
      setNotes('');
    }
    setConfirmDelete(false);
  }, [project, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Project name is required', status: 'warning', duration: 2000 });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        client_id: clientId || null,
        status,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase.from('projects').update(payload).eq('id', project.id);
        if (error) throw error;
        await logActivity('project_updated', project.id, {
          project_name: name.trim(),
          project_number: project.project_number,
        });
        toast({ title: 'Project updated', status: 'success', duration: 2000 });
      } else {
        const projectNumber = await generateProjectNumber();
        const { data, error } = await supabase
          .from('projects')
          .insert({ ...payload, project_number: projectNumber })
          .select()
          .single();
        if (error) throw error;
        await logActivity('project_created', data.id, {
          project_name: name.trim(),
          project_number: projectNumber,
        });
        toast({ title: 'Project created', description: projectNumber, status: 'success', duration: 3000 });
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
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      await logActivity('project_deleted', project.id, {
        project_name: project.name,
        project_number: project.project_number,
      });
      toast({ title: 'Project removed', status: 'success', duration: 2000 });
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
            <Icon as={isEditing ? TbEdit : TbPlus} color="accent.purple" boxSize={5} />
            <Text>{isEditing ? 'Edit Project' : 'New Project'}</Text>
            {isEditing && project?.project_number && (
              <Badge fontSize="2xs" fontFamily="mono" bg="surface.800" color="surface.400" px={2} borderRadius="md">
                {project.project_number}
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.400" />

        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Project Name</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Website Redesign, Monthly Retainer, etc." {...inputProps} />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Client</FormLabel>
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)} {...inputProps}>
                <option value="" style={{ background: '#0a0a0a' }}>No client linked</option>
                {(clients || []).map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#0a0a0a' }}>
                    {c.name}{c.company ? ` (${c.company})` : ''}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Status</FormLabel>
              <HStack spacing={0} border="1px solid" borderColor="surface.700" borderRadius="xl" overflow="hidden">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = status === opt.value;
                  return (
                    <Box
                      key={opt.value}
                      flex={1}
                      py={2.5}
                      textAlign="center"
                      cursor="pointer"
                      onClick={() => setStatus(opt.value)}
                      bg={isActive ? `${opt.color}12` : 'transparent'}
                      borderRight="1px solid"
                      borderColor="surface.800"
                      transition="all 0.15s"
                      _last={{ borderRight: 'none' }}
                      _hover={{ bg: isActive ? undefined : 'surface.850' }}
                    >
                      <Text
                        fontSize="2xs"
                        fontWeight="700"
                        color={isActive ? opt.color : 'surface.500'}
                        textTransform="uppercase"
                        letterSpacing="0.03em"
                      >
                        {opt.label}
                      </Text>
                    </Box>
                  );
                })}
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Notes</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Scope, timeline, key details"
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                borderRadius="xl"
                rows={4}
                _hover={{ borderColor: 'surface.500' }}
                _focus={{ borderColor: 'accent.purple', boxShadow: '0 0 0 1px var(--chakra-colors-accent-purple)' }}
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
                size="sm" bg="accent.purple" color="white" fontWeight="700"
                _hover={{ bg: '#7C3AED', transform: 'translateY(-1px)' }}
                onClick={handleSave} isLoading={saving} loadingText="Saving..."
              >
                {isEditing ? 'Save Changes' : 'Create Project'}
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProjectModal;