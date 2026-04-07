// src/pages/Clients/components/ClientModal.jsx
import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, VStack, HStack, Text,
  Input, Button, FormControl, FormLabel, Textarea, Select,
  Icon, useToast, Box, Wrap, WrapItem, InputGroup, InputRightElement,
} from '@chakra-ui/react';
import {
  TbEdit, TbPlus, TbTrash, TbAlertTriangle, TbCheck,
  TbUser, TbBuilding, TbMail, TbPhone, TbWorld, TbTag,
  TbKey, TbRefresh,
} from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import {
  formatPhoneDisplay, formatPhoneStorage, isValidEmail, isValidPhone,
  generatePortalPin, getInitials, getAvatarColor,
} from '../../../utils/phone';

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

const SECTION_LABEL_PROPS = {
  fontSize: '2xs',
  fontWeight: '700',
  color: 'accent.neon',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontFamily: 'mono',
};

const PRESET_TAGS = [
  { value: 'local', label: 'Local', color: '#00E5E5' },
  { value: 'recurring', label: 'Recurring', color: '#39FF14' },
  { value: 'vip', label: 'VIP', color: '#FFE500' },
  { value: 'lab', label: 'Lab Project', color: '#8B5CF6' },
  { value: 'hosting', label: 'Hosting', color: '#06B6D4' },
  { value: 'web3', label: 'Web3', color: '#EC4899' },
  { value: 'subscription', label: 'Subscription', color: '#FF6B35' },
];

const ClientModal = ({ isOpen, onClose, client, onSave }) => {
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
  }, [client, isOpen]);

  const handlePhoneChange = (e) => {
    setPhone(formatPhoneDisplay(e.target.value));
  };

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
        lookup_pin: portalPin || null, // keep both in sync
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

  const initials = getInitials(name);
  const avatarColor = getAvatarColor(name);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="surface.900" border="1px solid" borderColor="surface.800" mx={4}>
        <ModalHeader color="white" fontSize="md" pb={2}>
          <HStack spacing={3}>
            {/* Avatar preview */}
            <Box
              w="36px"
              h="36px"
              borderRadius="full"
              bg={name ? avatarColor : 'surface.800'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="2px solid"
              borderColor={name ? avatarColor : 'surface.700'}
              transition="all 0.2s"
            >
              <Text color={name ? 'surface.950' : 'surface.500'} fontSize="xs" fontWeight="800">
                {initials}
              </Text>
            </Box>
            <VStack align="start" spacing={0}>
              <Text>{isEditing ? 'Edit Client' : 'Add Client'}</Text>
              {name && <Text fontSize="2xs" color="surface.500" fontWeight="500">{company || 'No company'}</Text>}
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.400" />

        <ModalBody>
          <VStack spacing={6} align="stretch">

            {/* IDENTITY SECTION */}
            <VStack align="stretch" spacing={3}>
              <HStack spacing={2}>
                <Box w="6px" h="6px" borderRadius="full" bg="accent.neon" />
                <Text {...SECTION_LABEL_PROPS}>Identity</Text>
              </HStack>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Name</FormLabel>
                <InputGroup>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name or business"
                    {...inputProps}
                  />
                </InputGroup>
              </FormControl>

              <HStack spacing={3} align="flex-start">
                <FormControl flex={1}>
                  <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Company</FormLabel>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                    {...inputProps}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Website</FormLabel>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="example.com"
                    {...inputProps}
                  />
                </FormControl>
              </HStack>
            </VStack>

            {/* CONTACT SECTION */}
            <VStack align="stretch" spacing={3}>
              <HStack spacing={2}>
                <Box w="6px" h="6px" borderRadius="full" bg="brand.500" />
                <Text {...SECTION_LABEL_PROPS} color="brand.500">Contact</Text>
              </HStack>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Email</FormLabel>
                <InputGroup>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@company.com"
                    {...inputProps}
                  />
                  {emailValid !== null && (
                    <InputRightElement h="44px">
                      <Icon
                        as={emailValid ? TbCheck : TbAlertTriangle}
                        color={emailValid ? 'accent.neon' : 'accent.banana'}
                        boxSize={4}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Phone</FormLabel>
                <InputGroup>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(970) 555-1234"
                    {...inputProps}
                  />
                  {phoneValid !== null && (
                    <InputRightElement h="44px">
                      <Icon
                        as={phoneValid ? TbCheck : TbAlertTriangle}
                        color={phoneValid ? 'accent.neon' : 'accent.banana'}
                        boxSize={4}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
              </FormControl>
            </VStack>

            {/* META SECTION - Status & Tags */}
            <VStack align="stretch" spacing={3}>
              <HStack spacing={2}>
                <Box w="6px" h="6px" borderRadius="full" bg="accent.banana" />
                <Text {...SECTION_LABEL_PROPS} color="accent.banana">Classify</Text>
              </HStack>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Status</FormLabel>
                <HStack spacing={2}>
                  {[
                    { value: 'active', label: 'Active', color: '#39FF14' },
                    { value: 'lead', label: 'Lead', color: '#FFE500' },
                    { value: 'inactive', label: 'Inactive', color: '#737373' },
                  ].map((s) => (
                    <Box
                      key={s.value}
                      flex={1}
                      py={2.5}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={status === s.value ? s.color : 'surface.700'}
                      bg={status === s.value ? `${s.color}12` : 'transparent'}
                      cursor="pointer"
                      onClick={() => setStatus(s.value)}
                      transition="all 0.15s"
                      textAlign="center"
                      _hover={status !== s.value ? { borderColor: 'surface.500' } : {}}
                    >
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        color={status === s.value ? s.color : 'surface.500'}
                        letterSpacing="0.02em"
                      >
                        {s.label}
                      </Text>
                    </Box>
                  ))}
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Tags</FormLabel>
                <Wrap spacing={1.5}>
                  {PRESET_TAGS.map((t) => {
                    const active = tags.includes(t.value);
                    return (
                      <WrapItem key={t.value}>
                        <Box
                          px={2.5}
                          py={1}
                          borderRadius="full"
                          border="1px solid"
                          borderColor={active ? t.color : 'surface.700'}
                          bg={active ? `${t.color}15` : 'transparent'}
                          cursor="pointer"
                          onClick={() => toggleTag(t.value)}
                          transition="all 0.15s"
                          _hover={!active ? { borderColor: 'surface.500' } : {}}
                        >
                          <Text
                            fontSize="2xs"
                            fontWeight="700"
                            color={active ? t.color : 'surface.500'}
                            letterSpacing="0.02em"
                          >
                            {t.label}
                          </Text>
                        </Box>
                      </WrapItem>
                    );
                  })}
                </Wrap>
              </FormControl>
            </VStack>

            {/* PORTAL ACCESS SECTION */}
            <VStack align="stretch" spacing={3}>
              <HStack spacing={2}>
                <Box w="6px" h="6px" borderRadius="full" bg="#8B5CF6" />
                <Text {...SECTION_LABEL_PROPS} color="#8B5CF6">Portal Access</Text>
              </HStack>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Lookup PIN</FormLabel>
                <HStack spacing={2}>
                  <Box
                    flex={1}
                    bg="surface.850"
                    border="1px solid"
                    borderColor="surface.700"
                    borderRadius="xl"
                    h="44px"
                    px={4}
                    display="flex"
                    alignItems="center"
                    fontFamily="mono"
                    fontSize="md"
                    fontWeight="700"
                    color="white"
                    letterSpacing="0.15em"
                  >
                    {portalPin || '——————'}
                  </Box>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="surface.500"
                    h="44px"
                    leftIcon={<TbRefresh size={14} />}
                    onClick={regeneratePin}
                    _hover={{ color: 'brand.500', bg: 'surface.850' }}
                  >
                    New
                  </Button>
                </HStack>
                <Text fontSize="2xs" color="surface.600" mt={1.5}>
                  Client uses this PIN to look up their projects on the portal
                </Text>
              </FormControl>
            </VStack>

            {/* NOTES SECTION */}
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="600" color="surface.500">Notes</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes, context, anything to remember"
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
                _hover={{ bg: 'brand.400', transform: 'translateY(-1px)' }}
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