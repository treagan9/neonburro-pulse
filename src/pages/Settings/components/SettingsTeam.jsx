// src/pages/Settings/components/SettingsTeam.jsx
// Team management for super_admin and admin, on Paper. super_admin is protected
// from edits, the role select offers admin/manager/team, the invite flow accepts
// the same. super_admin promotion stays SQL-only. Role tones carry meaning and
// are kept, deepened for cream. No oxford commas, no dashes.

import { useState, useEffect } from 'react';
import {
  VStack, HStack, Text, Box, Icon, Button, Input, useToast, Spinner, Center, Select,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  FormControl, FormLabel, useDisclosure,
} from '@chakra-ui/react';
import { TbUserPlus, TbCrown, TbShield, TbBriefcase, TbUser, TbBuilding, TbMail } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import Avatar from '../../../components/common/Avatar';
import { usePresence } from '../../../hooks/usePresence';
import colors from '../../../theme/colors';

const P = colors.paper;

const ROLE_CONFIG = {
  super_admin: { icon: TbCrown,     color: P.gold,     label: 'Super Admin' },
  admin:       { icon: TbShield,    color: P.limeDeep, label: 'Admin' },
  manager:     { icon: TbBriefcase, color: '#6C6F97',  label: 'Manager' },
  team:        { icon: TbUser,      color: '#7A5Fc9',  label: 'Team' },
  client:      { icon: TbBuilding,  color: P.inkFaint, label: 'Client' },
};

const STAFF_ROLES = ['super_admin', 'admin', 'manager', 'team'];
const EDITABLE_ROLES = ['admin', 'manager', 'team'];
const INVITABLE_ROLES = ['admin', 'manager', 'team'];

const inputProps = {
  bg: P.sheet, border: '1px solid', borderColor: P.hair, color: P.ink,
  fontSize: 'sm', h: '48px', borderRadius: 'xl',
  _hover: { borderColor: P.inkFaint },
  _focus: { borderColor: P.lime, boxShadow: `0 0 0 3px ${P.lime}33` },
  _placeholder: { color: P.inkFaint },
};

const TeamMemberRow = ({ member, currentUserId, onRoleChange }) => {
  const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.team;
  const { getStatus } = usePresence();
  const status = getStatus(member.id);
  const isMe = member.id === currentUserId;
  const isSuperAdmin = member.role === 'super_admin';

  return (
    <HStack justify="space-between" py={3} px={3} borderRadius="lg" transition="all 0.15s" border="1px solid transparent" _hover={{ bg: P.sheet, borderColor: P.hairSoft }}>
      <HStack spacing={3} flex={1} minW={0}>
        <Avatar name={member.display_name || member.username || member.email} url={member.avatar_url} size="md" presence={status} />
        <Box flex={1} minW={0}>
          <HStack spacing={2}>
            <Text color={P.ink} fontSize="sm" fontWeight="700" noOfLines={1}>{member.display_name || 'Unnamed'}</Text>
            {isMe && <Text fontSize="2xs" color={P.inkFaint} fontFamily="mono">you</Text>}
          </HStack>
          <HStack spacing={2} mt={0.5}>
            {member.username && <Text color={P.inkMuted} fontSize="2xs" fontFamily="mono">@{member.username}</Text>}
            <Box px={1.5} py={0.5} borderRadius="md" bg={`${config.color}1A`} border="1px solid" borderColor={`${config.color}40`}>
              <HStack spacing={1}>
                <Icon as={config.icon} boxSize={2.5} color={config.color} />
                <Text fontSize="2xs" color={config.color} fontWeight="700">{config.label}</Text>
              </HStack>
            </Box>
          </HStack>
        </Box>
      </HStack>

      {!isMe && !isSuperAdmin && (
        <Select size="xs" value={EDITABLE_ROLES.includes(member.role) ? member.role : 'team'} onChange={(e) => onRoleChange(member.id, e.target.value)}
          bg={P.sheet} border="1px solid" borderColor={P.hair} color={P.inkSec} fontSize="2xs" fontWeight="700" h="32px" borderRadius="md" w="110px"
          _hover={{ borderColor: P.inkFaint }} _focus={{ borderColor: P.lime, boxShadow: 'none' }} cursor="pointer" sx={{ '& option': { background: P.sheet } }}>
          {EDITABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
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
    if (!email.trim() || !email.includes('@')) { toast({ title: 'Valid email required', status: 'warning', duration: 2000 }); return; }
    setSending(true);
    try {
      const res = await fetch('/.netlify/functions/send-team-invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), display_name: displayName.trim(), role }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Invite failed'); }
      toast({ title: 'Invite sent', description: `${email} will receive an email`, status: 'success', duration: 3000 });
      setEmail(''); setDisplayName(''); setRole('team');
      onInvited();
      onClose();
    } catch (err) {
      toast({ title: 'Invite failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay bg="rgba(23,17,12,0.6)" backdropFilter="blur(4px)" />
      <ModalContent bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="18px" mx={4}>
        <ModalHeader color={P.ink} fontSize="md">
          <HStack spacing={2}><Icon as={TbUserPlus} color={P.limeDeep} boxSize={5} /><Text>Invite to the herd</Text></HStack>
        </ModalHeader>
        <ModalCloseButton color={P.inkMuted} _hover={{ color: P.ink, bg: P.sunken }} />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="2xs" fontWeight="700" color={P.inkMuted} textTransform="uppercase" letterSpacing="0.05em" fontFamily="mono">Email</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@neonburro.com" {...inputProps} autoFocus />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="2xs" fontWeight="700" color={P.inkMuted} textTransform="uppercase" letterSpacing="0.05em" fontFamily="mono">Display name</FormLabel>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Their full name" {...inputProps} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="2xs" fontWeight="700" color={P.inkMuted} textTransform="uppercase" letterSpacing="0.05em" fontFamily="mono">Role</FormLabel>
              <HStack spacing={2}>
                {INVITABLE_ROLES.map((r) => (
                  <Box key={r} flex={1} py={3} borderRadius="lg" border="1px solid" borderColor={role === r ? ROLE_CONFIG[r].color : P.hair} bg={role === r ? `${ROLE_CONFIG[r].color}1A` : 'transparent'} cursor="pointer" onClick={() => setRole(r)} transition="all 0.15s" textAlign="center">
                    <Text fontSize="xs" fontWeight="700" color={role === r ? ROLE_CONFIG[r].color : P.inkMuted}>{ROLE_CONFIG[r].label}</Text>
                  </Box>
                ))}
              </HStack>
              <Text fontSize="2xs" color={P.inkFaint} mt={2}>Admin: full access. Manager: project access. Team: limited access.</Text>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor={P.hair}>
          <Button variant="ghost" color={P.inkMuted} onClick={onClose} mr={2} _hover={{ color: P.ink, bg: P.sunken }}>Cancel</Button>
          <Button bg={P.lime} color={P.limeInk} fontWeight="700" borderRadius="full" isLoading={sending} loadingText="Sending..." onClick={handleInvite} leftIcon={<TbMail size={14} />} _hover={{ bg: '#D2E26B' }}>Send invite</Button>
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

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').in('role', STAFF_ROLES).order('role', { ascending: true });
    setMembers(data || []);
    setLoading(false);
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!EDITABLE_ROLES.includes(newRole)) { toast({ title: 'Cannot set that role', description: 'Super admin promotion is SQL-only', status: 'warning', duration: 3000 }); return; }
    const { error } = await supabase.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', memberId);
    if (error) { toast({ title: 'Update failed', description: error.message, status: 'error', duration: 3000 }); return; }
    toast({ title: 'Role updated', status: 'success', duration: 2000 });
    fetchMembers();
  };

  return (
    <VStack spacing={5} align="stretch">
      <HStack justify="space-between" px={1}>
        <HStack spacing={2.5}>
          <Box w="6px" h="6px" borderRadius="full" bg={P.gold} />
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.14em" textTransform="uppercase" color={P.gold} fontFamily="mono">Team</Text>
          <Text fontSize="2xs" color={P.inkFaint} fontFamily="mono">· {members.length} member{members.length !== 1 ? 's' : ''}</Text>
        </HStack>
        <Button size="xs" leftIcon={<TbUserPlus size={12} />} bg={P.lime} color={P.limeInk} fontWeight="700" borderRadius="full" h="30px" onClick={onOpen} _hover={{ bg: '#D2E26B' }}>Invite</Button>
      </HStack>

      {loading ? (
        <Center py={6}><Spinner size="sm" color={P.limeDeep} thickness="2px" /></Center>
      ) : (
        <VStack spacing={1} align="stretch">
          {members.map((member) => <TeamMemberRow key={member.id} member={member} currentUserId={currentUserId} onRoleChange={handleRoleChange} />)}
        </VStack>
      )}

      <InviteModal isOpen={isOpen} onClose={onClose} onInvited={fetchMembers} />
    </VStack>
  );
};

export default SettingsTeam;
