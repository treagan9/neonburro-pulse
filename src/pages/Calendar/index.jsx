// src/pages/Calendar/index.jsx
// SENTINEL: NB_CALENDAR_PAGE_V1
//
// The schedule, on Paper. Two faces of one dataset:
//   desktop  a real month grid (MonthGrid) beside an Upcoming rail
//   phone    the grid is too dense to cram, so it becomes a clean stacked agenda
//            grouped by day. No containers fighting each other, one column.
// Click a day to open a new appointment already dated to that day, click an
// appointment anywhere to edit it. The write and every notification live in
// AppointmentModal + send-appointment, this file only reads and arranges.
//
// Lime is spent once: the today disc in the grid and the New button. Meeting
// types carry their own three hues (calendarConstants), never lime. Fraunces
// numbers the month title and the day cells. No oxford commas, no dashes.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Text, HStack, VStack, Icon, Button, Spinner, Center, Divider } from '@chakra-ui/react';
import {
  TbChevronLeft, TbChevronRight, TbPlus, TbCalendarPlus, TbClock, TbUser, TbCalendarOff,
} from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import colors from '../../theme/colors';
import AppointmentModal from './components/AppointmentModal';
import MonthGrid from './components/MonthGrid';
import {
  MONTH_NAMES, buildMonthMatrix, ymd, typeOf, fmtTime, fmtTimeRange, fmtDayLong,
} from './calendarConstants';

const P = colors.paper;

// One appointment as a card, shared by the rail and the mobile agenda.
const AppointmentCard = ({ appt, client, onClick }) => {
  const t = typeOf(appt.meeting_type);
  return (
    <Box
      as="button" type="button" w="100%" textAlign="left" onClick={() => onClick(appt)}
      bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="14px" p={3.5}
      position="relative" overflow="hidden" transition="all 0.15s"
      _hover={{ borderColor: `${t.accent}77`, transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(36,26,22,0.06)' }}
    >
      <Box position="absolute" left={0} top={0} bottom={0} w="3px" bg={t.accent} />
      <HStack justify="space-between" align="start" spacing={3}>
        <Box flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="700" color={P.ink} noOfLines={1}>{appt.title}</Text>
          <HStack spacing={2} mt={1} color={P.inkMuted}>
            <HStack spacing={1}><Icon as={TbClock} boxSize={3} /><Text fontSize="xs" fontFamily="mono" color={P.inkMuted}>{fmtTimeRange(appt.starts_at, appt.ends_at)}</Text></HStack>
            {client && (<><Text fontSize="xs" color={P.inkFaint}>·</Text><HStack spacing={1}><Icon as={TbUser} boxSize={3} /><Text fontSize="xs" noOfLines={1} color={P.inkMuted}>{client.name}</Text></HStack></>)}
          </HStack>
        </Box>
        <Text fontSize="2xs" fontFamily="mono" fontWeight="700" letterSpacing="0.06em" textTransform="uppercase" color={t.accent} bg={t.tint} px={2} py={1} borderRadius="full" flexShrink={0}>
          {t.label}
        </Text>
      </HStack>
    </Box>
  );
};

const NavBtn = ({ icon, onClick, label }) => (
  <Box as="button" type="button" aria-label={label} onClick={onClick} w="34px" h="34px" borderRadius="lg" border="1px solid" borderColor={P.hair} bg={P.sheet} display="flex" alignItems="center" justifyContent="center" transition="all 0.15s" _hover={{ borderColor: P.inkFaint, bg: P.sunken }}>
    <Icon as={icon} boxSize={4} color={P.inkSec} />
  </Box>
);

const Calendar = () => {
  const { user } = useAuth();
  const now = new Date();
  const todayIso = ymd(now);

  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [initialDate, setInitialDate] = useState(todayIso);

  const clientsById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);

  const fetchAll = useCallback(async () => {
    const [{ data: appts }, { data: cls }] = await Promise.all([
      supabase.from('appointments').select('*').neq('status', 'cancelled').order('starts_at', { ascending: true }),
      supabase.from('clients').select('id, name, company, email, phone, timezone').order('name'),
    ]);
    setAppointments(appts || []);
    setClients(cls || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel('appointments_cal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  const weeks = useMemo(() => buildMonthMatrix(view.y, view.m), [view]);

  const apptsByDay = useMemo(() => {
    const map = {};
    for (const a of appointments) {
      const key = ymd(new Date(a.starts_at));
      (map[key] = map[key] || []).push(a);
    }
    return map;
  }, [appointments]);

  const upcoming = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return appointments.filter((a) => new Date(a.starts_at) >= start);
  }, [appointments]);

  // Mobile agenda: upcoming grouped by day.
  const agendaGroups = useMemo(() => {
    const groups = [];
    let cur = null;
    for (const a of upcoming) {
      const key = ymd(new Date(a.starts_at));
      if (!cur || cur.key !== key) { cur = { key, items: [] }; groups.push(cur); }
      cur.items.push(a);
    }
    return groups;
  }, [upcoming]);

  const goPrev = () => setView((v) => { const d = new Date(v.y, v.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const goNext = () => setView((v) => { const d = new Date(v.y, v.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const goToday = () => setView({ y: now.getFullYear(), m: now.getMonth() });

  const openNew = (iso) => { setEditAppt(null); setInitialDate(iso || todayIso); setModalOpen(true); };
  const openEdit = (appt) => { setEditAppt(appt); setModalOpen(true); };

  const monthCount = useMemo(
    () => appointments.filter((a) => { const d = new Date(a.starts_at); return d.getFullYear() === view.y && d.getMonth() === view.m; }).length,
    [appointments, view],
  );

  return (
    <Box bg={P.mat} minH="100vh" px={{ base: 4, md: 6, xl: 8 }} py={{ base: 5, md: 7 }}>
      <Box maxW="1500px">

        {/* Header */}
        <Text fontFamily="mono" fontSize="2xs" fontWeight="600" letterSpacing="0.22em" textTransform="uppercase" color={P.limeDeep} mb={2}>
          Schedule
        </Text>
        <HStack justify="space-between" align={{ base: 'start', md: 'end' }} flexWrap="wrap" gap={3} mb={6}>
          <HStack spacing={3} align="baseline">
            <Text fontFamily="display" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="600" color={P.ink} letterSpacing="-0.02em" lineHeight="1">
              {MONTH_NAMES[view.m]}
            </Text>
            <Text fontFamily="mono" fontSize={{ base: 'lg', md: 'xl' }} fontWeight="500" color={P.inkFaint}>{view.y}</Text>
            {monthCount > 0 && (
              <Text fontSize="xs" color={P.inkMuted} display={{ base: 'none', sm: 'block' }}>
                {monthCount} {monthCount === 1 ? 'appointment' : 'appointments'}
              </Text>
            )}
          </HStack>
          <HStack spacing={2}>
            <NavBtn icon={TbChevronLeft} onClick={goPrev} label="Previous month" />
            <Button size="sm" variant="ghost" onClick={goToday} color={P.inkSec} fontFamily="mono" fontSize="xs" letterSpacing="0.06em" textTransform="uppercase" _hover={{ bg: P.sunken }}>Today</Button>
            <NavBtn icon={TbChevronRight} onClick={goNext} label="Next month" />
            <Button ml={1} bg={P.lime} color={P.limeInk} fontWeight="700" leftIcon={<TbPlus size={16} />} onClick={() => openNew(todayIso)} _hover={{ bg: '#B8CC4A' }} _active={{ bg: '#A9BD3E' }}>
              New appointment
            </Button>
          </HStack>
        </HStack>

        {loading ? (
          <Center py={24}><Spinner color={P.limeDeep} thickness="3px" /></Center>
        ) : (
          <>
            {/* Desktop: grid + rail */}
            <HStack display={{ base: 'none', md: 'flex' }} align="start" spacing={6}>
              <Box flex={1} minW={0}>
                <MonthGrid weeks={weeks} apptsByDay={apptsByDay} todayIso={todayIso} onDayClick={openNew} onApptClick={openEdit} />
              </Box>
              <Box w={{ md: '300px', xl: '330px' }} flexShrink={0}>
                <Text fontFamily="mono" fontSize="2xs" fontWeight="600" letterSpacing="0.18em" textTransform="uppercase" color={P.inkMuted} mb={3}>
                  Next up
                </Text>
                {upcoming.length === 0 ? (
                  <EmptyUpcoming onNew={() => openNew(todayIso)} />
                ) : (
                  <VStack spacing={2.5} align="stretch">
                    {upcoming.slice(0, 8).map((a) => (
                      <AppointmentCard key={a.id} appt={a} client={clientsById[a.client_id]} onClick={openEdit} />
                    ))}
                  </VStack>
                )}
              </Box>
            </HStack>

            {/* Mobile: stacked agenda */}
            <Box display={{ base: 'block', md: 'none' }}>
              {agendaGroups.length === 0 ? (
                <EmptyUpcoming onNew={() => openNew(todayIso)} />
              ) : (
                <VStack spacing={5} align="stretch">
                  {agendaGroups.map((g) => (
                    <Box key={g.key}>
                      <HStack mb={2.5} spacing={2} align="center">
                        <Text fontFamily="mono" fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color={g.key === todayIso ? P.limeDeep : P.inkSec}>
                          {g.key === todayIso ? 'Today' : fmtDayLong(g.items[0].starts_at)}
                        </Text>
                        <Divider borderColor={P.hair} flex={1} />
                      </HStack>
                      <VStack spacing={2.5} align="stretch">
                        {g.items.map((a) => (
                          <AppointmentCard key={a.id} appt={a} client={clientsById[a.client_id]} onClick={openEdit} />
                        ))}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </>
        )}
      </Box>

      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
        appointment={editAppt}
        initialDate={initialDate}
        user={user}
        onSaved={fetchAll}
      />
    </Box>
  );
};

const EmptyUpcoming = ({ onNew }) => (
  <Box bg={P.sheet} border="1px dashed" borderColor={P.hair} borderRadius="16px" p={6}>
    <VStack spacing={2.5}>
      <Icon as={TbCalendarOff} boxSize={7} color={P.inkFaint} />
      <Text fontSize="sm" fontWeight="600" color={P.inkSec}>Nothing scheduled</Text>
      <Text fontSize="xs" color={P.inkMuted} textAlign="center">Click a day, or start one right here.</Text>
      <Button size="sm" variant="outline" borderColor={P.hair} color={P.inkSec} leftIcon={<TbCalendarPlus size={15} />} onClick={onNew} _hover={{ bg: P.sunken, borderColor: P.inkFaint }}>
        New appointment
      </Button>
    </VStack>
  </Box>
);

export default Calendar;
