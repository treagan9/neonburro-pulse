// src/pages/Calendar/components/AppointmentModal.jsx
// SENTINEL: NB_APPT_MODAL_V1
//
// Create, edit, remind and cancel one appointment, on Paper. This is where the
// operator "clicks and sets" a meeting. It owns the write AND the notify call so
// the calendar page stays a view:
//   - writes the appointments row (client-side, RLS)
//   - then hits /.netlify/functions/send-appointment for everything that leaves
//     the building (client invite + .ics, team heads-up, portal note)
//
// SIGNING, matched to Messages: the client-facing invite and the portal note go
// out signed as that client's stable burro (personaForClient), so their email
// and their thread show the same face. The internal team email names the real
// operator via bookedBy. Internal appointments (no client) skip the persona and
// the portal note.
//
// TIME: the operator's date + time are read as THEIR local wall time
// (combineLocal), stored as an absolute instant, and stamped with the operator's
// resolved zone. The invite and the .ics convert automatically for the client,
// so there is nothing to reconcile and no off-by-one. No oxford commas, no dashes.

import { useState, useEffect, useMemo } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, VStack, HStack, Text, Input, Select, Button, Textarea,
  Box, SimpleGrid, Icon, useToast,
} from '@chakra-ui/react';
import {
  TbPhone, TbVideo, TbMapPin, TbRefresh, TbBell, TbTrash, TbCalendarPlus, TbCopy, TbCheck,
} from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import colors from '../../../theme/colors';
import { personaForClient } from '../../../lib/personas';
import {
  MEETING_TYPES, typeOf, DURATIONS, ymd, combineLocal, buildVideoRoom, endFrom, fmtTime,
} from '../calendarConstants';

const P = colors.paper;
const BROWSER_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return 'America/Denver'; } })();
const TZ_SHORT = (() => {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value || BROWSER_TZ;
  } catch (e) { return BROWSER_TZ; }
})();

const TYPE_ICON = { call: TbPhone, video: TbVideo, in_person: TbMapPin };

const FIELD = {
  bg: P.sheet, border: '1px solid', borderColor: P.hair, borderRadius: 'lg',
  color: P.ink, fontSize: 'sm', h: '46px', px: 3.5,
  _hover: { borderColor: P.inkFaint },
  _focus: { borderColor: P.lime, boxShadow: `0 0 0 3px ${P.lime}33`, outline: 'none' },
  _placeholder: { color: P.inkFaint },
};
const LABEL = {
  fontSize: '2xs', fontWeight: '600', color: P.inkMuted,
  textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'mono', mb: 1.5,
};

const Field = ({ label, children }) => (
  <Box>
    <Text {...LABEL}>{label}</Text>
    {children}
  </Box>
);

const NotifyToggle = ({ on, disabled, onClick, icon, children }) => (
  <Box
    as="button" type="button" onClick={disabled ? undefined : onClick}
    px={3} py={2} borderRadius="lg" border="1px solid" flex={1}
    borderColor={on && !disabled ? 'transparent' : P.hair}
    bg={on && !disabled ? P.lime : 'transparent'}
    opacity={disabled ? 0.4 : 1} cursor={disabled ? 'not-allowed' : 'pointer'}
    transition="all 0.15s" _hover={{ borderColor: disabled ? P.hair : (on ? 'transparent' : P.inkFaint) }}
  >
    <HStack spacing={1.5} justify="center">
      <Icon as={icon} boxSize={3.5} color={on && !disabled ? P.limeInk : P.inkMuted} />
      <Text fontSize="2xs" fontWeight="700" fontFamily="mono" letterSpacing="0.04em" textTransform="uppercase" color={on && !disabled ? P.limeInk : P.inkMuted}>
        {children}
      </Text>
    </HStack>
  </Box>
);

const AppointmentModal = ({ isOpen, onClose, clients = [], appointment = null, initialDate = null, user, onSaved }) => {
  const toast = useToast();
  const isEdit = Boolean(appointment?.id);

  const [type, setType] = useState('call');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [description, setDescription] = useState('');
  const [notifyClient, setNotifyClient] = useState(true);
  const [notifyTeam, setNotifyTeam] = useState(true);
  const [postPortal, setPostPortal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const client = useMemo(() => clients.find((c) => c.id === clientId) || null, [clients, clientId]);
  const clientHasEmail = Boolean(client?.email);

  // Seed state whenever the modal opens or its subject changes.
  useEffect(() => {
    if (!isOpen) return;
    if (appointment?.id) {
      const s = new Date(appointment.starts_at);
      const e = new Date(appointment.ends_at);
      setType(appointment.meeting_type || 'call');
      setTitle(appointment.title || '');
      setClientId(appointment.client_id || '');
      setDate(ymd(s));
      setTime(`${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`);
      setDuration(Math.max(15, Math.round((e - s) / 60000)) || 30);
      setLocation(appointment.location || '');
      setMeetingUrl(appointment.meeting_url || '');
      setDescription(appointment.description || '');
      setNotifyClient(false); setNotifyTeam(false); setPostPortal(false);
    } else {
      setType('call');
      setTitle('');
      setClientId('');
      setDate(initialDate || ymd(new Date()));
      setTime('09:00');
      setDuration(30);
      setLocation('');
      setMeetingUrl('');
      setDescription('');
      setNotifyClient(true); setNotifyTeam(true); setPostPortal(true);
    }
  }, [isOpen, appointment, initialDate]);

  // A video appointment always has a room. Generate one lazily.
  useEffect(() => {
    if (type === 'video' && !meetingUrl) setMeetingUrl(buildVideoRoom(client?.name));
  }, [type, meetingUrl, client]);

  const tCfg = typeOf(type);
  const startPreview = date && time ? combineLocal(date, time).toISOString() : null;
  const endPreview = startPreview ? endFrom(startPreview, duration) : null;

  const copyRoom = async () => {
    try { await navigator.clipboard.writeText(meetingUrl); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch (e) { /* noop */ }
  };

  const persist = async () => {
    const starts = combineLocal(date, time).toISOString();
    const ends = endFrom(starts, duration);
    const row = {
      client_id: clientId || null,
      title: title.trim(),
      description: description.trim() || null,
      meeting_type: type,
      starts_at: starts,
      ends_at: ends,
      location: type === 'in_person' ? (location.trim() || null) : null,
      meeting_url: type === 'video' ? meetingUrl : null,
      timezone: BROWSER_TZ,
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    };
    if (isEdit) {
      const { data, error } = await supabase.from('appointments').update(row).eq('id', appointment.id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.from('appointments').insert({ ...row, created_by: user?.id || null }).select().single();
    if (error) throw error;
    return data;
  };

  const notify = async (appointmentId, mode) => {
    const persona = clientId ? personaForClient(clientId) : null;
    let bookedBy = 'the team';
    try {
      const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', user?.id).single();
      if (prof?.display_name) bookedBy = prof.display_name;
    } catch (e) { /* noop */ }
    const res = await fetch('/.netlify/functions/send-appointment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId, mode,
        sendClient: mode === 'reminder' ? true : (notifyClient && clientHasEmail),
        notifyTeam: mode === 'reminder' ? false : notifyTeam,
        postPortal: mode === 'reminder' ? Boolean(clientId) : (postPortal && Boolean(clientId)),
        senderId: user?.id || null,
        senderName: persona ? persona.name : 'Neon Burro',
        bookedBy,
        personaId: persona ? persona.id : null,
      }),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Notify failed'); }
  };

  const handleSave = async () => {
    if (!title.trim()) { toast({ title: 'Give it a title', status: 'warning', duration: 2000 }); return; }
    if (!date || !time) { toast({ title: 'Pick a date and time', status: 'warning', duration: 2000 }); return; }
    setSaving(true);
    try {
      const saved = await persist();
      const willNotify = !isEdit && (notifyClient || notifyTeam || postPortal);
      if (willNotify) {
        try { await notify(saved.id, 'invite'); }
        catch (e) { toast({ title: 'Saved, but the invite did not send', description: e.message, status: 'warning', duration: 5000 }); }
      }
      toast({
        title: isEdit ? 'Appointment updated' : (willNotify ? 'Scheduled and sent' : 'Scheduled'),
        status: 'success', duration: 2500,
      });
      onSaved?.(saved);
      onClose();
    } catch (e) {
      toast({ title: 'Could not save', description: e.message, status: 'error', duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const handleReminder = async () => {
    setSaving(true);
    try {
      await notify(appointment.id, 'reminder');
      toast({ title: 'Reminder sent', status: 'success', duration: 2500 });
      onSaved?.(appointment);
      onClose();
    } catch (e) {
      toast({ title: 'Could not send reminder', description: e.message, status: 'error', duration: 5000 });
    } finally { setSaving(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this appointment? It stays on record but drops off the calendar.')) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('appointments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', appointment.id);
      if (error) throw error;
      toast({ title: 'Appointment cancelled', status: 'info', duration: 2500 });
      onSaved?.({ ...appointment, status: 'cancelled' });
      onClose();
    } catch (e) {
      toast({ title: 'Could not cancel', description: e.message, status: 'error', duration: 4000 });
    } finally { setSaving(false); }
  };

  const primaryLabel = isEdit
    ? 'Save changes'
    : (notifyClient || notifyTeam || postPortal) ? 'Schedule and send' : 'Schedule';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'xl' }} isCentered scrollBehavior="inside">
      <ModalOverlay bg="rgba(36,26,22,0.55)" backdropFilter="blur(3px)" />
      <ModalContent bg={P.mat} borderRadius={{ base: 0, md: '2xl' }} border="1px solid" borderColor={P.hair} overflow="hidden" mx={{ base: 0, md: 4 }} my={{ base: 0, md: 'auto' }}>
        <ModalHeader pb={2}>
          <Text fontFamily="mono" fontSize="2xs" fontWeight="600" letterSpacing="0.22em" textTransform="uppercase" color={tCfg.accent}>
            {isEdit ? 'Edit appointment' : 'New appointment'}
          </Text>
          <Text fontSize="xl" fontWeight="700" color={P.ink} letterSpacing="-0.01em" mt={1}>
            {isEdit ? (title || 'Appointment') : 'Set a meeting'}
          </Text>
        </ModalHeader>
        <ModalCloseButton color={P.inkMuted} top={4} />

        <ModalBody>
          <VStack spacing={4} align="stretch" pb={2}>

            {/* Type segmented control */}
            <HStack spacing={2}>
              {MEETING_TYPES.map((t) => {
                const on = type === t.id;
                return (
                  <Box
                    key={t.id} as="button" type="button" onClick={() => setType(t.id)}
                    flex={1} py={3} borderRadius="xl" border="1px solid"
                    borderColor={on ? t.accent : P.hair} bg={on ? t.tint : 'transparent'}
                    transition="all 0.15s" _hover={{ borderColor: on ? t.accent : P.inkFaint }}
                  >
                    <VStack spacing={1}>
                      <Icon as={TYPE_ICON[t.id]} boxSize={5} color={on ? t.accent : P.inkMuted} />
                      <Text fontSize="xs" fontWeight="700" color={on ? t.accent : P.inkMuted}>{t.label}</Text>
                    </VStack>
                  </Box>
                );
              })}
            </HStack>
            <Text fontSize="xs" color={P.inkFaint} mt={-2}>{tCfg.hint}</Text>

            <Field label="What is it">
              <Input {...FIELD} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kickoff call, design review, site walkthrough" autoFocus />
            </Field>

            <Field label="Client">
              <Select {...FIELD} value={clientId} onChange={(e) => setClientId(e.target.value)} sx={{ '> option': { background: P.sheet, color: P.ink } }}>
                <option value="">Internal, no client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                ))}
              </Select>
            </Field>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              <Field label="Date">
                <Input {...FIELD} type="date" value={date} onChange={(e) => setDate(e.target.value)} sx={{ '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.3)' } }} />
              </Field>
              <Field label="Start">
                <Input {...FIELD} type="time" value={time} onChange={(e) => setTime(e.target.value)} sx={{ '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.3)' } }} />
              </Field>
              <Field label="Length">
                <Select {...FIELD} value={duration} onChange={(e) => setDuration(Number(e.target.value))} sx={{ '> option': { background: P.sheet, color: P.ink } }}>
                  {DURATIONS.map((d) => <option key={d.min} value={d.min}>{d.label}</option>)}
                </Select>
              </Field>
            </SimpleGrid>

            {startPreview && (
              <Text fontSize="xs" color={P.inkMuted} mt={-2}>
                {fmtTime(startPreview)} to {fmtTime(endPreview)} · read in your time, {TZ_SHORT}. The invite and calendar file convert for the client.
              </Text>
            )}

            {/* Type-specific detail */}
            {type === 'in_person' && (
              <Field label="Where">
                <Textarea {...FIELD} h="auto" minH="72px" py={3} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address or place. The Ridgway shop, a coffee spot, their office" />
              </Field>
            )}
            {type === 'video' && (
              <Box bg={tCfg.tint} border="1px solid" borderColor={`${tCfg.accent}55`} borderRadius="xl" p={3.5}>
                <HStack justify="space-between" mb={2}>
                  <Text {...LABEL} mb={0} color={tCfg.accent}>Video room</Text>
                  <HStack spacing={1}>
                    <Box as="button" type="button" onClick={copyRoom} px={2} py={1} borderRadius="md" _hover={{ bg: `${tCfg.accent}22` }}>
                      <HStack spacing={1}><Icon as={copied ? TbCheck : TbCopy} boxSize={3} color={tCfg.accent} /><Text fontSize="2xs" fontFamily="mono" color={tCfg.accent}>{copied ? 'Copied' : 'Copy'}</Text></HStack>
                    </Box>
                    <Box as="button" type="button" onClick={() => setMeetingUrl(buildVideoRoom(client?.name))} px={2} py={1} borderRadius="md" _hover={{ bg: `${tCfg.accent}22` }}>
                      <HStack spacing={1}><Icon as={TbRefresh} boxSize={3} color={tCfg.accent} /><Text fontSize="2xs" fontFamily="mono" color={tCfg.accent}>New link</Text></HStack>
                    </Box>
                  </HStack>
                </HStack>
                <Text fontSize="xs" fontFamily="mono" color={P.inkSec} wordBreak="break-all">{meetingUrl}</Text>
                <Text fontSize="2xs" color={P.inkFaint} mt={1.5}>Jitsi Meet. No account, opens in any browser, nothing to install. Sent with the invite.</Text>
              </Box>
            )}
            {type === 'call' && (
              <Text fontSize="xs" color={P.inkMuted}>
                {client?.phone ? `We ring ${client.name?.split(' ')[0] || 'them'} at ${client.phone}.` : 'We call the number on the client file. Add a phone on the client to include it in the invite.'}
              </Text>
            )}

            <Field label="What it is about">
              <Textarea {...FIELD} h="auto" minH="80px" py={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A line or two the client sees in the invite. Agenda, what to bring, what we will cover." />
            </Field>

            {/* Notify controls, only meaningful when not editing */}
            {!isEdit && (
              <Box>
                <Text {...LABEL}>When I schedule this</Text>
                <HStack spacing={2} align="stretch">
                  <NotifyToggle on={notifyClient} disabled={!clientHasEmail} onClick={() => setNotifyClient((v) => !v)} icon={TbCalendarPlus}>Email client</NotifyToggle>
                  <NotifyToggle on={notifyTeam} onClick={() => setNotifyTeam((v) => !v)} icon={TbBell}>Notify me</NotifyToggle>
                  <NotifyToggle on={postPortal} disabled={!clientId} onClick={() => setPostPortal((v) => !v)} icon={TbCheck}>Post to portal</NotifyToggle>
                </HStack>
                {!clientHasEmail && clientId && (
                  <Text fontSize="2xs" color={P.gold} mt={1.5}>This client has no email on file, so no invite goes out.</Text>
                )}
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={P.hair} flexWrap="wrap" gap={2}>
          {isEdit && (
            <HStack spacing={2} mr="auto">
              <Button variant="ghost" size="sm" color={P.inkMuted} leftIcon={<TbBell size={15} />} onClick={handleReminder} isDisabled={saving || !clientHasEmail} _hover={{ bg: P.sunken, color: P.ink }}>
                Send reminder
              </Button>
              <Button variant="ghost" size="sm" color={P.coral} leftIcon={<TbTrash size={15} />} onClick={handleCancel} isDisabled={saving} _hover={{ bg: `${P.coral}14` }}>
                Cancel it
              </Button>
            </HStack>
          )}
          <Button variant="ghost" color={P.inkMuted} onClick={onClose} isDisabled={saving} _hover={{ bg: P.sunken, color: P.ink }}>
            Close
          </Button>
          <Button
            bg={P.lime} color={P.limeInk} fontWeight="700"
            _hover={{ bg: '#B8CC4A' }} _active={{ bg: '#A9BD3E' }}
            onClick={handleSave} isLoading={saving} loadingText={isEdit ? 'Saving' : 'Scheduling'}
          >
            {primaryLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AppointmentModal;
