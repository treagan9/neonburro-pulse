// src/pages/Clients/components/ClientModal.jsx
// Tabbed, naked-input, login-DNA client modal
// - Details tab: all contact info + status + tags + notes
// - Portal tab: PIN + invite flow
// - Inline projects list with quick-add

import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, VStack, HStack, Text,
  Input, Button, Textarea, Box, Wrap, WrapItem, Icon, useToast,
  InputGroup, InputRightElement,
} from '@chakra-ui/react';
import {
  TbAlertTriangle, TbCheck, TbMail, TbRefresh, TbPlus,
  TbFolder, TbBolt, TbTrash, TbKey, TbX,
} from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import {
  formatPhoneDisplay, formatPhoneStorage, isValidEmail, isValidPhone,
  generatePortalPin, getInitials, getAvatarColor,
} from '../../../utils/phone';

// Naked input - bottom border only (login DNA)
const nakedInput = {
  bg: 'transparent',
  border: 'none',
  borderBottom: '1px solid',
  borderColor: 'surface.800',
  borderRadius: 0,
  color: 'white',
  fontSize: 'sm',
  h: '44px',
  px: 0,
  _hover: { borderColor: 'surface.700' },
  _focus: { borderColor: 'brand.500', boxShadow: 'none' },
  _placeholder: { color: 'surface.700' },
};

const FIELD_LABEL_PROPS = {
  fontSize: '2xs',
  fontWeight: '700',
  color: 'surface.600',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: 'mono',
  mb: 1,
};

const PRESET_TAGS = [
  { value: 'local', label: 'Local', color: '#00E5E5' },
  { value: 'recurring', label: 'Recurring', color: '#39FF14' },
  { value: 'vip', label: 'VIP', color: '#FFE500' },
  { value: 'lab', label: 'Lab', color: '#8B5CF6' },
  { value: 'hosting', label: 'Hosting', color: '#06B6D4' },
  { value: 'web3', label: 'Web3', color: '#EC4899' },
  { value: 'subscription', label: 'Subscription', color: '#FF6B35' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#39FF14' },
  { value: 'lead', label: 'Lead', color: '#FFE500' },
  { value: 'inactive', label: 'Inactive', color: '#737373' },
];

// ============================================
// PROJECTS SUBSECTION - inline list + quick add
// ============================================
const ProjectsSection = ({ clientId, toast }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (clientId) fetchProjects();
  }, [clientId]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('id, name, status, project_number')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    // Get sprint counts per project
    const projectsWithCounts = await Promise.all(
      (data || []).map(async (p) => {
        const { count } = await supabase
          .from('invoice_items')
          .select('*', { count: 'exact', head: true })
          .eq('invoice_id', p.id); // approximation
        return { ...p, sprint_count: 0 }; // skip for now, can enrich later
      })
    );

    setProjects(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          client_id: clientId,
          name: newName.trim(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setNewName('');
      setShowAdd(false);
      toast({ title: 'Project added', status: 'success', duration: 1500 });
    } catch (err) {
      toast({ title: 'Failed to add', description: err.message, status: 'error', duration: 3000 });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjects(projects.filter((p) => p.id !== id));
      toast({ title: 'Project removed', status: 'success', duration: 1500 });
    } catch (err) {
      toast({ title: 'Failed to remove', description: err.message, status: 'error', duration: 3000 });
    }
  };

  if (!clientId) {
    return (
      <Text fontSize="2xs" color="surface.600">
        Save this client first to add projects
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={2}>
      {loading ? (
        <Text fontSize="2xs" color="surface.600" fontFamily="mono">Loading projects</Text>
      ) : (
        <>
          {projects.length === 0 && !showAdd && (
            <Text fontSize="xs" color="surface.600">
              No projects yet
            </Text>
          )}

          {projects.map((project) => (
            <HStack
              key={project.id}
              py={2}
              spacing={3}
              borderBottom="1px solid"
              borderColor="surface.900"
              role="group"
              _hover={{ bg: 'rgba(255,255,255,0.01)' }}
            >
              <Icon as={TbFolder} boxSize={3.5} color="surface.600" />
              <Box flex={1}>
                <Text color="white" fontSize="sm" fontWeight="600">
                  {project.name}
                </Text>
                {project.project_number && (
                  <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                    {project.project_number}
                  </Text>
                )}
              </Box>
              <Text
                fontSize="2xs"
                color={project.status === 'active' ? 'accent.neon' : 'surface.600'}
                fontFamily="mono"
                fontWeight="700"
                textTransform="uppercase"
              >
                {project.status}
              </Text>
              <Box
                as="button"
                onClick={() => handleDelete(project.id)}
                opacity={0}
                transition="opacity 0.15s"
                _groupHover={{ opacity: 0.5 }}
                _hover={{ opacity: '1 !important', color: 'red.400' }}
                color="surface.600"
              >
                <Icon as={TbTrash} boxSize={3.5} />
              </Box>
            </HStack>
          ))}

          {/* Inline add */}
          {showAdd ? (
            <HStack spacing={2} pt={2}>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name"
                {...nakedInput}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  } else if (e.key === 'Escape') {
                    setShowAdd(false);
                    setNewName('');
                  }
                }}
              />
              <Button
                size="xs"
                bg="brand.500"
                color="surface.950"
                fontWeight="700"
                onClick={handleAdd}
                isLoading={adding}
                isDisabled={!newName.trim()}
              >
                Add
              </Button>
              <Box
                as="button"
                onClick={() => { setShowAdd(false); setNewName(''); }}
                color="surface.500"
                _hover={{ color: 'white' }}
              >
                <Icon as={TbX} boxSize={4} />
              </Box>
            </HStack>
          ) : (
            <HStack
              spacing={1.5}
              cursor="pointer"
              onClick={() => setShowAdd(true)}
              color="brand.500"
              opacity={0.6}
              transition="opacity 0.15s"
              _hover={{ opacity: 1 }}
              pt={2}
              userSelect="none"
            >
              <Icon as={TbPlus} boxSize={3} />
              <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                Add project
              </Text>
            </HStack>
          )}
        </>
      )}
    </VStack>
  );
};

// ============================================
// MAIN MODAL
// ============================================
const ClientModal = ({ isOpen, onClose, client, onSave }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [tags, setTags] = useState([]);
  const [portalPin, setPortalPin] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  const isEditing = !!client?.id;
  const emailValid = email ? isValidEmail(email) : null;
  const phoneValid = phone ? isValidPhone(phone) : null;

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setCompany(client.company || '');
      setWebsite(client.website || '');
      setEmail(client.email || '');
      setPhone(formatPhoneDisplay(client.phone || ''));
      setStatus(client.status || 'active');
      setTags(client.tags || []);
      setPortalPin(client.portal_pin || client.lookup_pin || '');
      setNotes(client.notes || '');
    } else {
      setName('');
      setCompany('');
      setWebsite('');
      setEmail('');
      setPhone('');
      setStatus('active');
      setTags([]);
      setPortalPin(generatePortalPin());
      setNotes('');
    }
    setConfirmDelete(false);
    setActiveTab('details');
  }, [client, isOpen]);

  const toggleTag = (tagValue) => {
    if (tags.includes(tagValue)) {
      setTags(tags.filter((t) => t !== tagValue));
    } else {
      setTags([...tags, tagValue]);
    }
  };

  const regeneratePin = () => {
    setPortalPin(generatePortalPin());
    toast({ title: 'New PIN generated', status: 'info', duration: 1500 });
  };

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
    if (email && !isValidEmail(email)) {
      toast({ title: 'Email looks invalid', status: 'warning', duration: 2000 });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        company: company.trim() || null,
        website: website.trim() || null,
        email: email.trim().toLowerCase() || null,
        phone: formatPhoneStorage(phone) || null,
        status,
        tags: tags.length > 0 ? tags : null,
        portal_pin: portalPin || null,
        lookup_pin: portalPin || null,
        notes: notes.trim() || null,
        last_activity_at: new Date().toISOString(),
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

  const handleSendPortalInvite = async () => {
    if (!client?.id) return;
    setSendingInvite(true);
    try {
      const res = await fetch('/.netlify/functions/send-client-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invite failed');
      }
      toast({
        title: 'Portal invite sent',
        description: `${client.email} will receive an email`,
        status: 'success',
        duration: 3000,
      });
      onSave();
    } catch (err) {
      toast({
        title: 'Invite failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const initials = getInitials(name);
  const avatarColor = getAvatarColor(name);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(8px)" />
      <ModalContent
        bg="surface.950"
        border={{ base: 'none', md: '1px solid' }}
        borderColor="surface.800"
        mx={{ base: 0, md: 4 }}
        borderRadius={{ base: 0, md: '2xl' }}
        maxW={{ md: '480px' }}
      >
        <ModalHeader pb={3} pt={6} px={6}>
          <HStack spacing={3}>
            {/* Avatar */}
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bg={name ? avatarColor : 'surface.850'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="all 0.2s"
              boxShadow={name ? `0 0 20px ${avatarColor}30` : 'none'}
            >
              <Text
                color={name ? 'surface.950' : 'surface.500'}
                fontSize="xs"
                fontWeight="800"
                letterSpacing="-0.02em"
              >
                {initials || '··'}
              </Text>
            </Box>
            <VStack align="start" spacing={0}>
              <Text color="white" fontSize="md" fontWeight="800" lineHeight="1.2">
                {isEditing ? 'Edit Client' : 'New Client'}
              </Text>
              {name && (
                <Text fontSize="2xs" color="surface.500" fontFamily="mono">
                  {company || 'No company'}
                </Text>
              )}
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.500" top={5} right={5} />

        {/* Tab strip */}
        <HStack spacing={6} px={6} mb={2} borderBottom="1px solid" borderColor="surface.900">
          {[
            { value: 'details', label: 'Details' },
            { value: 'portal', label: 'Portal' },
            ...(isEditing ? [{ value: 'projects', label: 'Projects' }] : []),
          ].map((tab) => {
            const active = activeTab === tab.value;
            return (
              <Box
                key={tab.value}
                pb={2.5}
                cursor="pointer"
                position="relative"
                onClick={() => setActiveTab(tab.value)}
              >
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color={active ? 'white' : 'surface.600'}
                  letterSpacing="0.05em"
                  textTransform="uppercase"
                  _hover={!active ? { color: 'surface.400' } : {}}
                  transition="color 0.15s"
                >
                  {tab.label}
                </Text>
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

        <ModalBody px={6} py={5}>
          {/* ================= DETAILS TAB ================= */}
          {activeTab === 'details' && (
            <VStack spacing={5} align="stretch">
              <Box>
                <Text {...FIELD_LABEL_PROPS}>Name</Text>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name or business"
                  {...nakedInput}
                  autoFocus={!isEditing}
                />
              </Box>

              <HStack spacing={4} align="start">
                <Box flex={1}>
                  <Text {...FIELD_LABEL_PROPS}>Company</Text>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company"
                    {...nakedInput}
                  />
                </Box>
                <Box flex={1}>
                  <Text {...FIELD_LABEL_PROPS}>Website</Text>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="example.com"
                    {...nakedInput}
                  />
                </Box>
              </HStack>

              <Box>
                <Text {...FIELD_LABEL_PROPS}>Email</Text>
                <InputGroup>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@company.com"
                    {...nakedInput}
                  />
                  {emailValid !== null && (
                    <InputRightElement h="44px">
                      <Icon
                        as={emailValid ? TbCheck : TbAlertTriangle}
                        color={emailValid ? 'accent.neon' : 'accent.banana'}
                        boxSize={3.5}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
              </Box>

              <Box>
                <Text {...FIELD_LABEL_PROPS}>Phone</Text>
                <InputGroup>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                    placeholder="(970) 555-1234"
                    {...nakedInput}
                  />
                  {phoneValid !== null && (
                    <InputRightElement h="44px">
                      <Icon
                        as={phoneValid ? TbCheck : TbAlertTriangle}
                        color={phoneValid ? 'accent.neon' : 'accent.banana'}
                        boxSize={3.5}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
              </Box>

              {/* Status - text buttons, no boxes */}
              <Box>
                <Text {...FIELD_LABEL_PROPS}>Status</Text>
                <HStack spacing={5} pt={1}>
                  {STATUS_OPTIONS.map((s) => {
                    const active = status === s.value;
                    return (
                      <Box
                        key={s.value}
                        cursor="pointer"
                        onClick={() => setStatus(s.value)}
                        position="relative"
                        pb={1}
                      >
                        <HStack spacing={1.5}>
                          <Box
                            w="6px"
                            h="6px"
                            borderRadius="full"
                            bg={s.color}
                            boxShadow={active ? `0 0 8px ${s.color}` : 'none'}
                            opacity={active ? 1 : 0.4}
                          />
                          <Text
                            fontSize="xs"
                            fontWeight="700"
                            color={active ? 'white' : 'surface.600'}
                            transition="color 0.15s"
                            _hover={!active ? { color: 'surface.400' } : {}}
                          >
                            {s.label}
                          </Text>
                        </HStack>
                      </Box>
                    );
                  })}
                </HStack>
              </Box>

              {/* Tags */}
              <Box>
                <Text {...FIELD_LABEL_PROPS}>Tags</Text>
                <Wrap spacing={1.5} pt={1}>
                  {PRESET_TAGS.map((t) => {
                    const active = tags.includes(t.value);
                    return (
                      <WrapItem key={t.value}>
                        <Box
                          px={2.5}
                          py={1}
                          borderRadius="full"
                          border="1px solid"
                          borderColor={active ? t.color : 'surface.800'}
                          bg={active ? `${t.color}12` : 'transparent'}
                          cursor="pointer"
                          onClick={() => toggleTag(t.value)}
                          transition="all 0.15s"
                          _hover={!active ? { borderColor: 'surface.600' } : {}}
                        >
                          <Text
                            fontSize="2xs"
                            fontWeight="700"
                            color={active ? t.color : 'surface.600'}
                            textTransform="uppercase"
                            letterSpacing="0.03em"
                          >
                            {t.label}
                          </Text>
                        </Box>
                      </WrapItem>
                    );
                  })}
                </Wrap>
              </Box>

              <Box>
                <Text {...FIELD_LABEL_PROPS}>Notes</Text>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes"
                  bg="transparent"
                  border="none"
                  borderBottom="1px solid"
                  borderColor="surface.800"
                  borderRadius={0}
                  color="white"
                  fontSize="sm"
                  rows={2}
                  px={0}
                  resize="none"
                  _hover={{ borderColor: 'surface.700' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                  _placeholder={{ color: 'surface.700' }}
                />
              </Box>
            </VStack>
          )}

          {/* ================= PORTAL TAB ================= */}
          {activeTab === 'portal' && (
            <VStack spacing={6} align="stretch">
              {/* PIN */}
              <Box>
                <Text {...FIELD_LABEL_PROPS}>Lookup PIN</Text>
                <HStack spacing={3} pt={1}>
                  <Text
                    flex={1}
                    fontFamily="mono"
                    fontSize="2xl"
                    fontWeight="800"
                    color="white"
                    letterSpacing="0.15em"
                  >
                    {portalPin || '——————'}
                  </Text>
                  <Box
                    as="button"
                    onClick={regeneratePin}
                    color="surface.500"
                    _hover={{ color: 'brand.500', transform: 'rotate(180deg)' }}
                    transition="all 0.3s"
                    p={2}
                  >
                    <Icon as={TbRefresh} boxSize={4} />
                  </Box>
                </HStack>
                <Text fontSize="2xs" color="surface.600" mt={2}>
                  Client uses this PIN + their email to look up invoices
                </Text>
              </Box>

              {/* Portal invite */}
              {isEditing && client?.email && (
                <Box pt={4} borderTop="1px solid" borderColor="surface.900">
                  <HStack justify="space-between" align="start" mb={3}>
                    <Box flex={1}>
                      <Text {...FIELD_LABEL_PROPS}>Portal Account</Text>
                      <Text color="white" fontSize="sm" fontWeight="600" mt={1}>
                        {client.portal_account_created_at
                          ? 'Active'
                          : client.portal_invite_sent_at
                          ? 'Invite sent'
                          : 'Not activated'}
                      </Text>
                      <Text color="surface.600" fontSize="2xs" fontFamily="mono" mt={0.5}>
                        {client.portal_account_created_at
                          ? `Joined ${new Date(client.portal_account_created_at).toLocaleDateString()}`
                          : client.portal_invite_sent_at
                          ? `Sent ${new Date(client.portal_invite_sent_at).toLocaleDateString()}`
                          : 'No invite sent'}
                      </Text>
                    </Box>
                    {!client.portal_account_created_at && (
                      <Button
                        size="xs"
                        variant="outline"
                        borderColor="#8B5CF6"
                        color="#8B5CF6"
                        fontWeight="700"
                        leftIcon={<TbMail size={12} />}
                        onClick={handleSendPortalInvite}
                        isLoading={sendingInvite}
                        loadingText="Sending"
                        _hover={{ bg: 'rgba(139,92,246,0.08)' }}
                      >
                        {client.portal_invite_sent_at ? 'Resend' : 'Send Invite'}
                      </Button>
                    )}
                  </HStack>
                </Box>
              )}

              {!isEditing && (
                <Text fontSize="xs" color="surface.600" textAlign="center" py={4}>
                  Save this client first to send a portal invite
                </Text>
              )}
            </VStack>
          )}

          {/* ================= PROJECTS TAB ================= */}
          {activeTab === 'projects' && (
            <VStack spacing={4} align="stretch">
              <Box>
                <Text {...FIELD_LABEL_PROPS}>Projects</Text>
                <Text color="surface.500" fontSize="2xs" mt={0.5}>
                  Websites, apps, and other work for this client
                </Text>
              </Box>
              <ProjectsSection clientId={client?.id} toast={toast} />
            </VStack>
          )}
        </ModalBody>

        <ModalFooter
          borderTop="1px solid"
          borderColor="surface.900"
          pt={4}
          pb={6}
          px={6}
        >
          <VStack w="100%" spacing={3}>
            {/* Primary save button - single cyan, login DNA */}
            <Button
              w="100%"
              h="48px"
              borderRadius="xl"
              bg="brand.500"
              color="surface.950"
              fontWeight="700"
              fontSize="sm"
              onClick={handleSave}
              isLoading={saving}
              loadingText="Saving..."
              _hover={{ bg: 'brand.400', transform: 'translateY(-1px)' }}
              _active={{ transform: 'translateY(0)' }}
            >
              {isEditing ? 'Save Changes' : 'Add Client'}
            </Button>

            {/* Delete - subtle text link */}
            {isEditing && (
              <HStack
                spacing={1.5}
                cursor="pointer"
                onClick={handleDelete}
                color={confirmDelete ? 'red.400' : 'surface.700'}
                opacity={confirmDelete ? 1 : 0.4}
                transition="all 0.15s"
                _hover={{ opacity: 1, color: 'red.400' }}
                userSelect="none"
              >
                <Icon as={confirmDelete ? TbAlertTriangle : TbTrash} boxSize={3} />
                <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                  {deleting ? 'Removing...' : confirmDelete ? 'Click again to confirm' : 'Remove client'}
                </Text>
              </HStack>
            )}
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClientModal;