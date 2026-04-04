// src/pages/Projects/index.jsx
import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Input, Button, IconButton,
  SimpleGrid, Icon, Badge, useToast, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, FormControl, FormLabel,
  Textarea, Select, Divider, Center, Spinner,
} from '@chakra-ui/react';
import {
  TbPlus, TbSearch, TbRocket, TbEdit, TbTrash,
  TbUser, TbAlertTriangle, TbHash,
} from 'react-icons/tb';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

const STATUS_CONFIG = {
  lead:     { label: 'Lead',     color: 'yellow', bg: 'rgba(255,229,0,0.08)',    border: 'rgba(255,229,0,0.25)' },
  proposal: { label: 'Proposal', color: 'purple', bg: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.25)' },
  active:   { label: 'Active',   color: 'green',  bg: 'rgba(57,255,20,0.08)',    border: 'rgba(57,255,20,0.25)' },
  complete: { label: 'Complete', color: 'cyan',   bg: 'rgba(0,229,229,0.08)',    border: 'rgba(0,229,229,0.25)' },
  archived: { label: 'Archived', color: 'gray',   bg: 'rgba(128,128,128,0.08)',  border: 'rgba(128,128,128,0.25)' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.lead;
  return (
    <Badge
      fontSize="2xs"
      fontWeight="700"
      textTransform="uppercase"
      letterSpacing="0.05em"
      px={2}
      py={0.5}
      borderRadius="full"
      bg={config.bg}
      color={`${config.color}.400`}
      border="1px solid"
      borderColor={config.border}
    >
      {config.label}
    </Badge>
  );
};

const generateProjectNumber = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `NB-${year}${month}`;

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
};

const ProjectCard = ({ project, onEdit }) => {
  const statusColor = STATUS_CONFIG[project.status]?.color || 'gray';
  const accentMap = { lead: 'accent.banana', proposal: 'accent.purple', active: 'accent.neon', complete: 'brand.500', archived: 'surface.700' };

  return (
    <Box
      bg="surface.900"
      border="1px solid"
      borderColor="surface.800"
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.15s"
      cursor="pointer"
      onClick={() => onEdit(project)}
      _hover={{
        borderColor: 'surface.600',
        transform: 'translateY(-1px)',
        shadow: '0 4px 20px rgba(139,92,246,0.06)',
      }}
    >
      <Box h="2px" bg={accentMap[project.status] || 'surface.700'} />
      <Box p={4}>
        <HStack justify="space-between" align="start" mb={2}>
          <VStack align="start" spacing={0.5} flex={1} minW={0}>
            {project.project_number && (
              <Text color="surface.500" fontSize="2xs" fontFamily="mono" fontWeight="600">
                {project.project_number}
              </Text>
            )}
            <Text color="white" fontSize="sm" fontWeight="700" noOfLines={1}>
              {project.name}
            </Text>
          </VStack>
          <StatusBadge status={project.status} />
        </HStack>

        {project.client_name && (
          <HStack spacing={1.5} mb={3}>
            <Icon as={TbUser} boxSize={3} color="surface.600" />
            <Text color="surface.400" fontSize="xs" noOfLines={1}>{project.client_name}</Text>
          </HStack>
        )}

        {project.notes && (
          <Text color="surface.500" fontSize="xs" noOfLines={2} mb={3} lineHeight="1.5">
            {project.notes}
          </Text>
        )}

        <Divider borderColor="surface.800" mb={3} />

        <Text color="surface.600" fontSize="2xs" fontFamily="mono">
          {format(new Date(project.created_at), 'MMM d, yyyy')}
        </Text>
      </Box>
    </Box>
  );
};

const ProjectModal = ({ isOpen, onClose, project, clients, onSave }) => {
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

        await supabase.from('activity_log').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'project_updated',
          entity_type: 'project',
          entity_id: project.id,
          metadata: { project_name: name.trim() },
          created_at: new Date().toISOString(),
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

        await supabase.from('activity_log').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'project_created',
          entity_type: 'project',
          entity_id: data.id,
          metadata: { project_name: name.trim(), project_number: projectNumber },
          created_at: new Date().toISOString(),
        });

        toast({ title: `Project ${projectNumber} created`, status: 'success', duration: 3000 });
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

      await supabase.from('activity_log').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'project_deleted',
        entity_type: 'project',
        entity_id: project.id,
        metadata: { project_name: project.name },
        created_at: new Date().toISOString(),
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
              <Badge fontSize="2xs" fontFamily="mono" bg="surface.800" color="surface.400" px={2}>
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
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Website Redesign, Monthly Retainer, etc."
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                h="44px"
                borderRadius="xl"
                _hover={{ borderColor: 'surface.500' }}
                _focus={{ borderColor: 'accent.purple', boxShadow: '0 0 0 1px var(--chakra-colors-accent-purple)' }}
                _placeholder={{ color: 'surface.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Client</FormLabel>
              <Select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                h="44px"
                borderRadius="xl"
                _hover={{ borderColor: 'surface.500' }}
              >
                <option value="" style={{ background: '#0a0a0a' }}>No client linked</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#0a0a0a' }}>
                    {c.name}{c.company ? ` (${c.company})` : ''}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Status</FormLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                h="44px"
                borderRadius="xl"
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key} style={{ background: '#0a0a0a' }}>
                    {config.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Notes</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Scope, timeline, details"
                bg="transparent"
                border="1px solid"
                borderColor="surface.700"
                color="white"
                fontSize="sm"
                borderRadius="xl"
                rows={3}
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
                size="sm"
                variant="ghost"
                color={confirmDelete ? 'red.400' : 'surface.500'}
                leftIcon={confirmDelete ? <TbAlertTriangle /> : <TbTrash />}
                onClick={handleDelete}
                isLoading={deleting}
                loadingText="Removing..."
                _hover={{ color: 'red.400', bg: 'red.900' }}
              >
                {confirmDelete ? 'Confirm Remove' : 'Remove'}
              </Button>
            )}
            <HStack spacing={2}>
              <Button size="sm" variant="ghost" color="surface.400" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                bg="accent.purple"
                color="white"
                fontWeight="700"
                _hover={{ bg: '#7C3AED', transform: 'translateY(-1px)' }}
                onClick={handleSave}
                isLoading={saving}
                loadingText="Saving..."
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

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingProject, setEditingProject] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [projectsRes, clientsRes] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name, company').order('name'),
    ]);

    const enriched = (projectsRes.data || []).map((p) => ({
      ...p,
      client_name: p.clients?.name || null,
    }));

    setProjects(enriched);
    setClients(clientsRes.data || []);
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingProject(null);
    onOpen();
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    onOpen();
  };

  const filtered = projects.filter((p) => {
    const matchSearch = search
      ? p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.project_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: projects.length,
    ...Object.keys(STATUS_CONFIG).reduce((acc, key) => ({
      ...acc,
      [key]: projects.filter((p) => p.status === key).length,
    }), {}),
  };

  return (
    <Box p={{ base: 4, md: 6 }}>
      <VStack spacing={5} align="stretch">

        {/* Header */}
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <Box>
            <Text fontSize="2xl" fontWeight="700" color="white">Projects</Text>
            <Text color="surface.400" fontSize="sm" mt={0.5}>
              {counts.active} active, {counts.all} total
            </Text>
          </Box>
          <Button
            leftIcon={<TbPlus />}
            size="sm"
            bg="accent.purple"
            color="white"
            fontWeight="700"
            borderRadius="lg"
            _hover={{ bg: '#7C3AED', transform: 'translateY(-1px)' }}
            onClick={handleAdd}
          >
            New Project
          </Button>
        </HStack>

        {/* Search and filters */}
        <HStack spacing={3} flexWrap="wrap">
          <Box position="relative" flex={1} minW="200px">
            <Icon
              as={TbSearch}
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              color="surface.600"
              boxSize={4}
              zIndex={1}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search projects"
              pl={9}
              bg="transparent"
              border="1px solid"
              borderColor="surface.700"
              color="white"
              fontSize="sm"
              h="40px"
              borderRadius="lg"
              _hover={{ borderColor: 'surface.500' }}
              _focus={{ borderColor: 'accent.purple', boxShadow: '0 0 0 1px var(--chakra-colors-accent-purple)' }}
              _placeholder={{ color: 'surface.600' }}
            />
          </Box>
          <HStack spacing={1} flexWrap="wrap">
            <Button
              size="xs"
              variant="ghost"
              color={filterStatus === 'all' ? 'white' : 'surface.500'}
              bg={filterStatus === 'all' ? 'surface.800' : 'transparent'}
              fontWeight="600"
              borderRadius="md"
              onClick={() => setFilterStatus('all')}
              _hover={{ bg: 'surface.850', color: 'white' }}
            >
              All ({counts.all})
            </Button>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                size="xs"
                variant="ghost"
                color={filterStatus === key ? 'white' : 'surface.500'}
                bg={filterStatus === key ? 'surface.800' : 'transparent'}
                fontWeight="600"
                borderRadius="md"
                onClick={() => setFilterStatus(key)}
                _hover={{ bg: 'surface.850', color: 'white' }}
              >
                {config.label} ({counts[key] || 0})
              </Button>
            ))}
          </HStack>
        </HStack>

        {/* Grid */}
        {loading ? (
          <Center py={12}>
            <Spinner size="lg" color="accent.purple" thickness="3px" />
          </Center>
        ) : filtered.length === 0 ? (
          <Box
            bg="surface.900"
            border="1px dashed"
            borderColor="surface.700"
            borderRadius="xl"
            p={8}
            textAlign="center"
          >
            <VStack spacing={2}>
              <Icon as={TbRocket} boxSize={8} color="surface.600" />
              <Text color="surface.400" fontSize="sm">
                {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
              </Text>
              {projects.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="accent.purple"
                  color="accent.purple"
                  onClick={handleAdd}
                  mt={2}
                >
                  Create your first project
                </Button>
              )}
            </VStack>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={3}>
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>

      <ProjectModal
        isOpen={isOpen}
        onClose={onClose}
        project={editingProject}
        clients={clients}
        onSave={fetchData}
      />
    </Box>
  );
};

export default Projects;