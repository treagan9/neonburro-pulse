// src/pages/Settings/components/SettingsTeam.jsx
import { useState, useEffect } from 'react';
import {
  VStack, HStack, Text, Box, Icon, Button, Input, useToast,
  Spinner, Center, Select, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  FormControl, FormLabel, useDisclosure,
} from '@chakra-ui/react';
import { TbUserPlus, TbCrown, TbShield, TbUser, TbMail } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import Avatar from '../../../components/common/Avatar';
import { usePresence } from '../../../hooks/usePresence';

const ROLE_CONFIG = {
  owner: { icon: TbCrown,  color: '#FFE500', label: 'Owner' },
  admin: { icon: TbShield, color: '#00E5E5', label: 'Admin' },
  team:  { icon: TbUser,   color: '#8B5CF6', label: 'Team' },
};

const inputProps = {
  bg: 'transparent',
  border: '1px solid',
  borderColor: 'surface.700',
  color: 'white',
  fontSize: 'sm',
  h: '48px',
  borderRadius: 'xl',
  _hover: { borderColor: 'surface.500' },
  _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' },
  _placeholder: { color: 'surface.600' },
};

const TeamMemberRow = ({ member, currentUserId, onRoleChange }) => {
  const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.team;
  const { getStatus } = usePresence();
  const status = getStatus(member.id);
  const isMe = member.id === currentUserId;

  return (
    <HStack
      justify="space-between"
      py={3}
      px={3}
      borderRadius="lg"
      transition="all 0.15s"
      border="1px solid transparent"
      _hover={{ bg: 'rgba(255,255,255,0.02)', borderColor: 'surface.850' }}
    >
      <HStack spacing={3} flex={1} minW={0}>
        <Avatar
          name={member.display_name || member.username || member.email}
          url={member.avatar_url}
          size="md"
          presence={status}
        />
        <Box flex={1} minW={0}>
          <HStack spacing={2}>
            <Text color="white" fontSize="sm" fontWeight="700" noOfLines={1}>
              {member.display_name || 'Unnamed'}
            </Text>
            {isMe && (
              <Text fontSize="2xs" color="surface.600" fontFamily="mono">you</Text>
            )}
          </HStack>
          <HStack spacing={2} mt={0.5}>
            {member.username && (
              <Text color="surface.500" fontSize="2xs" fontFamily="mono">@{member.username}</Text>
            )}
            <Box
              px={1.5}
              py={0.5}
              borderRadius="md"
              bg={`${config.color}12`}
              border="1px solid"
              borderColor={`${config.color}25`}
            >
              <HStack spacing={1}>
                <Icon as={config.icon} boxSize={2.5} color={config.color} />
                <Text fontSize="2xs" color={config.color} fontWeight="700">
                  {config.label}
                </Text>
              </HStack>
            </Box>
          </HStack>
        </Box>
      </HStack>

      {!isMe && member.role !== 'owner' && (
        <Select
          size="xs"
          value={member.role}
          onChange={(e) => onRoleChange(member.id, e.target.value)}
          bg="transparent"
          border="1px solid"
          borderColor="surface.700"
          color="surface.300"
          fontSize="2xs"
          fontWeight="700"
          h="32px"
          borderRadius="md"
          w="90px"
          _hover={{ borderColor: 'surface.500' }}
          _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
          cursor="pointer"
        >
          <option value="admin" style={{ background: '#0a0a0a' }}>Admin</option>
          <option value="team" style={{ background: '#0a0a0a' }}>Team</option>
        </Select>
      )}
    </HStack>
  );
};

const InviteModal = ({ isOpen, onClose, onInvited }) => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('team');
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast({ title: 'Valid email required', status: 'warning', duration: 2000 });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/.netlify/functions/send-team-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          display_name: displayName.trim(),
          role,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invite failed');
      }

      toast({
        title: 'Invite sent',
        description: `${email} will receive an email`,
        status: 'success',
        duration: 3000,
      });

      setEmail('');
      setDisplayName('');
      setRole('team');
      onInvited();
      onClose();
    } catch (err) {
      toast({
        title: 'Invite failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="surface.950" border="1px solid" borderColor="surface.800" mx={4}>
        <ModalHeader color="white" fontSize="md">
          <HStack spacing={2}>
            <Icon as={TbUserPlus} color="brand.500" boxSize={5} />
            <Text>Invite to the Herd</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.400" />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="2xs" fontWeight="700" color="surface.500" textTransform="uppercase" letterSpacing="0.05em">
                Email
              </FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@neonburro.com"
                {...inputProps}
                autoFocus
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="2xs" fontWeight="700" color="surface.500" textTransform="uppercase" letterSpacing="0.05em">
                Display name
              </FormLabel>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Their full name"
                {...inputProps}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="2xs" fontWeight="700" color="surface.500" textTransform="uppercase" letterSpacing="0.05em">
                Role
              </FormLabel>
              <HStack spacing={2}>
                {['admin', 'team'].map((r) => (
                  <Box
                    key={r}
                    flex={1}
                    py={3}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={role === r ? ROLE_CONFIG[r].color : 'surface.700'}
                    bg={role === r ? `${ROLE_CONFIG[r].color}12` : 'transparent'}
                    cursor="pointer"
                    onClick={() => setRole(r)}
                    transition="all 0.15s"
                    textAlign="center"
                  >
                    <Text fontSize="xs" fontWeight="700" color={role === r ? ROLE_CONFIG[r].color : 'surface.500'}>
                      {ROLE_CONFIG[r].label}
                    </Text>
                  </Box>
                ))}
              </HStack>
              <Text fontSize="2xs" color="surface.600" mt={2}>
                Admin has full Pulse access. Team has limited access.
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor="surface.800">
          <Button variant="ghost" color="surface.400" onClick={onClose} mr={2}>Cancel</Button>
          <Button
            bg="brand.500"
            color="surface.950"
            fontWeight="700"
            isLoading={sending}
            loadingText="Sending..."
            onClick={handleInvite}
            leftIcon={<TbMail size={14} />}
          >
            Send Invite
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const SettingsTeam = ({ currentUserId }) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    // Only team-side roles - exclude clients
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['owner', 'admin', 'team'])
      .order('role', { ascending: true });
    setMembers(data || []);
    setLoading(false);
  };

  const handleRoleChange = async (memberId, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) {
      toast({ title: 'Update failed', description: error.message, status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Role updated', status: 'success', duration: 2000 });
    fetchMembers();
  };

  return (
    <VStack spacing={5} align="stretch">
      <HStack justify="space-between" px={1}>
        <HStack spacing={2.5}>
          <Box w="6px" h="6px" borderRadius="full" bg="accent.banana" boxShadow="0 0 8px rgba(255,229,0,0.6)" />
          <Text
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.14em"
            textTransform="uppercase"
            color="accent.banana"
            fontFamily="mono"
          >
            Team
          </Text>
          <Text fontSize="2xs" color="surface.600" fontFamily="mono">
            · {members.length} member{members.length !== 1 ? 's' : ''}
          </Text>
        </HStack>
        <Button
          size="xs"
          leftIcon={<TbUserPlus size={12} />}
          bg="brand.500"
          color="surface.950"
          fontWeight="700"
          borderRadius="md"
          h="28px"
          onClick={onOpen}
          _hover={{ bg: 'brand.400' }}
        >
          Invite
        </Button>
      </HStack>

      {loading ? (
        <Center py={6}>
          <Spinner size="sm" color="brand.500" thickness="2px" />
        </Center>
      ) : (
        <VStack spacing={1} align="stretch">
          {members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              onRoleChange={handleRoleChange}
            />
          ))}
        </VStack>
      )}

      <InviteModal isOpen={isOpen} onClose={onClose} onInvited={fetchMembers} />
    </VStack>
  );
};

export default SettingsTeam;