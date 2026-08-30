// src/pages/Releases/index.jsx
// SENTINEL: NB_PULSE_RELEASES_V1
//
// The release timeline. One row is one thing the studio intends to put into
// the world, a page, a post, a door opening. Two shelves: on the ramp holds
// everything that has not shipped, ordered by intended date, out the door
// holds what shipped, newest first. The status pip is the whole workflow,
// click it and the release advances idea to drafted to staged to released,
// and landing on released stamps released_at. There is deliberately no
// delete on this page, a release that dies gets its notes updated and stays
// on the record, the timeline is a ledger not a todo list.
//
// The table was applied 2026-08-29. The missing table panel stays in the code
// anyway, it is what a fresh branch database shows before its migrations run,
// and it points at supabase/migrations/2026082901_releases.sql.
//
// Paper system page, same idioms as Blog and Clients. Lime is spent once,
// on the add button. No oxford commas, no em dashes.

import { useState, useEffect, useCallback } from 'react';
import { Box, VStack, HStack, Text, Container, Spinner, Input, Select } from '@chakra-ui/react';
import { TbPlus, TbRocket } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';
import { TYPE, EASE, FAST } from '../../theme/layout';

const P = colors.paper;

const STATUSES = ['idea', 'drafted', 'staged', 'released'];
const CHANNELS = ['site', 'x', 'instagram', 'reddit', 'telegram', 'blog', 'newsletter', 'phosphor', 'shop', 'pulse'];

const STATUS_TINT = {
  idea: P.inkFaint,
  drafted: P.gold,
  staged: P.limeDeep,
  released: P.green,
};

const when = (iso) => {
  if (!iso) return 'undated';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// the pip is the workflow. click advances, released wraps back to idea so a
// mistaken tap is recoverable in three more taps.
const StatusPip = ({ status, onAdvance }) => (
  <HStack as="button" type="button" spacing={1.5} onClick={onAdvance}
    title="advance status" cursor="pointer" flexShrink={0}
    _hover={{ opacity: 0.75 }} transition={`opacity ${FAST} ${EASE}`}>
    <Box boxSize="7px" borderRadius="full" bg={STATUS_TINT[status]} />
    <Text fontFamily="mono" fontSize={TYPE.label} color={STATUS_TINT[status]} minW="58px" textAlign="left">
      {status}
    </Text>
  </HStack>
);

const Row = ({ r, onAdvance }) => (
  <HStack align="baseline" spacing={{ base: 3, md: 4 }} py={3}
    borderBottom="1px solid" borderColor={P.hairSoft} w="100%">
    <Text fontFamily="mono" fontSize={TYPE.label} color={P.inkFaint} minW="52px" flexShrink={0}>
      {when(r.status === 'released' ? r.released_at || r.release_at : r.release_at)}
    </Text>
    <Box flex="1" minW={0}>
      <Text fontSize={TYPE.body} color={P.ink} noOfLines={1}>{r.title}</Text>
      {r.notes && (
        <Text fontSize={TYPE.label} color={P.inkMuted} noOfLines={1} mt={0.5}>{r.notes}</Text>
      )}
    </Box>
    {r.voice && (
      <Text fontFamily="mono" fontSize={TYPE.label} color={P.limeDeep}
        display={{ base: 'none', md: 'block' }} flexShrink={0}>
        {r.voice}.
      </Text>
    )}
    <Text fontFamily="mono" fontSize={TYPE.label} color={P.inkMuted}
      border="1px solid" borderColor={P.hair} borderRadius="full" px={2.5} py={0.5}
      display={{ base: 'none', sm: 'block' }} flexShrink={0}>
      {r.channel}
    </Text>
    <StatusPip status={r.status} onAdvance={() => onAdvance(r)} />
  </HStack>
);

const Releases = () => {
  const [rows, setRows] = useState(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('site');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .order('release_at', { ascending: true, nullsFirst: false });
    if (error) {
      setTableMissing(true);
      setRows([]);
      return;
    }
    setRows(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const { error } = await supabase.from('releases').insert({
      title: title.trim(),
      channel,
      release_at: date ? new Date(`${date}T12:00:00`).toISOString() : null,
    });
    setSaving(false);
    if (!error) {
      setTitle('');
      setDate('');
      load();
    }
  };

  const advance = async (r) => {
    const next = STATUSES[(STATUSES.indexOf(r.status) + 1) % STATUSES.length];
    const patch = { status: next, updated_at: new Date().toISOString() };
    if (next === 'released') patch.released_at = new Date().toISOString();
    // optimistic, the pip flips before the network answers
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from('releases').update(patch).eq('id', r.id);
    if (error) load();
  };

  const ramp = (rows || []).filter((r) => r.status !== 'released');
  const shipped = (rows || [])
    .filter((r) => r.status === 'released')
    .sort((a, b) => new Date(b.released_at || b.release_at || 0) - new Date(a.released_at || a.release_at || 0));

  return (
    <Container maxW="880px" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
      <VStack align="stretch" spacing={{ base: 8, md: 10 }}>
        <Box>
          <Text fontSize={TYPE.h1} fontWeight="600" letterSpacing="-0.02em" color={P.ink}>
            Releases
          </Text>
          <Text fontSize={TYPE.body} color={P.inkSec} mt={1}>
            What leaves the yard, and when. Click a status to advance it.
          </Text>
        </Box>

        {/* the quick add. title, channel, date, one lime button */}
        <HStack spacing={2.5} flexWrap={{ base: 'wrap', md: 'nowrap' }} rowGap={2.5}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="what ships next"
            bg={P.sheet} borderColor={P.hair} color={P.ink} fontSize={TYPE.body}
            _placeholder={{ color: P.inkFaint }}
            _hover={{ borderColor: P.inkFaint }}
            _focus={{ borderColor: P.inkMuted, boxShadow: 'none' }}
            flex="1" minW={{ base: '100%', md: '240px' }} />
          <Select value={channel} onChange={(e) => setChannel(e.target.value)}
            bg={P.sheet} borderColor={P.hair} color={P.inkSec} fontSize={TYPE.label}
            fontFamily="mono" w={{ base: '46%', md: '140px' }} flexShrink={0}>
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            bg={P.sheet} borderColor={P.hair} color={P.inkSec} fontSize={TYPE.label}
            fontFamily="mono" w={{ base: '46%', md: '150px' }} flexShrink={0} />
          <HStack as="button" type="button" onClick={add} spacing={1.5}
            bg={P.lime} color={P.limeInk} borderRadius="10px" px={4} py={2}
            fontSize={TYPE.label} fontWeight="600" cursor="pointer" flexShrink={0}
            opacity={saving ? 0.6 : 1}
            _hover={{ opacity: 0.85 }} transition={`opacity ${FAST} ${EASE}`}>
            <TbPlus size={15} />
            <Text>add</Text>
          </HStack>
        </HStack>

        {rows === null && (
          <HStack justify="center" py={16}><Spinner size="sm" color={P.inkMuted} /></HStack>
        )}

        {tableMissing && (
          <Box bg={P.sunken} border="1px solid" borderColor={P.hair} borderRadius="14px" p={5}>
            <Text fontSize={TYPE.body} color={P.inkSec}>
              The releases table is not in the database yet. Paste
              supabase/migrations/2026082901_releases.sql into the dashboard SQL editor
              and reload, the seed slate comes with it.
            </Text>
          </Box>
        )}

        {rows !== null && !tableMissing && (
          <>
            <Box>
              <HStack spacing={2} mb={2}>
                <TbRocket size={14} color={P.inkMuted} />
                <Text fontFamily="mono" fontSize={TYPE.label} letterSpacing="0.14em"
                  textTransform="uppercase" color={P.inkMuted}>
                  on the ramp · {ramp.length}
                </Text>
              </HStack>
              <VStack align="stretch" spacing={0} borderTop="1px solid" borderColor={P.hair}>
                {ramp.map((r) => <Row key={r.id} r={r} onAdvance={advance} />)}
                {ramp.length === 0 && (
                  <Text fontSize={TYPE.body} color={P.inkFaint} py={6}>
                    Nothing staged. The yard is suspiciously quiet.
                  </Text>
                )}
              </VStack>
            </Box>

            <Box>
              <Text fontFamily="mono" fontSize={TYPE.label} letterSpacing="0.14em"
                textTransform="uppercase" color={P.inkMuted} mb={2}>
                out the door · {shipped.length}
              </Text>
              <VStack align="stretch" spacing={0} borderTop="1px solid" borderColor={P.hair}>
                {shipped.map((r) => <Row key={r.id} r={r} onAdvance={advance} />)}
                {shipped.length === 0 && (
                  <Text fontSize={TYPE.body} color={P.inkFaint} py={6}>
                    Nothing shipped from this board yet. It will not stay that way.
                  </Text>
                )}
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default Releases;
