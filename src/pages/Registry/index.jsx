// src/pages/Registry/index.jsx
// SENTINEL: NB_PULSE_REGISTRY_V1
//
// The Registry, the private book of the studio's own labeled wallets. Every
// wallet Tyler mints gets a row the moment it exists, ion and the vaults and
// the voice accounts and every fresh phantom, and the page reads live SOL
// and NEONBURRO balances from the chain so the map never goes stale.
//
// ── WHAT THIS PAGE IS NOT ───────────────────────────────────────────────────
// Not public, not the token page's wallet map. That one is editorial and
// deliberate, this one is operational and complete. Public addresses and
// labels only, NEVER keys, NEVER seeds, and nothing here ships to a public
// surface. If a row needs to become public it goes through wallets.js in
// the studio repo by hand.
//
// The wallet list is direct Supabase reads and writes, token_wallets with
// staff RLS from migration 2026082605 in the studio repo. Balances go
// through registry-balances.js because the public RPC treats browsers
// worse than servers. A dash means the chain did not answer, refresh.
//
// Paper system page. No oxford commas, no em dashes.

import { useState, useEffect, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Container, Spinner, Input,
} from '@chakra-ui/react';
import { TbPlus, TbCopy, TbCheck, TbExternalLink, TbRefresh, TbTrash } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';
import { TYPE, EASE, FAST } from '../../theme/layout';

const P = colors.paper;
const SUPPLY = 1_000_000_000;

const shortAddr = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : '');
const fmtM = (n) => {
  if (n === null || n === undefined) return '–';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(n < 10 ? 2 : 0);
};
const fmtSol = (n) => (n === null || n === undefined ? '–' : n.toFixed(n < 1 ? 3 : 2));

const inputProps = {
  bg: P.sheet,
  border: '1px solid',
  borderColor: P.hair,
  borderRadius: '10px',
  color: P.ink,
  fontSize: TYPE.small,
  h: '38px',
  px: 3,
  _placeholder: { color: P.inkFaint },
  _hover: { borderColor: P.inkFaint },
  _focus: { borderColor: P.limeDeep, boxShadow: 'none', outline: 'none' },
};

const Registry = () => {
  const [rows, setRows] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ label: '', address: '', app: '', note: '' });
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState('');

  const readChain = useCallback(async (list) => {
    if (!list.length) return;
    setReading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/.netlify/functions/registry-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ addresses: list.map((r) => r.address) }),
      });
      const data = await res.json();
      if (res.ok) {
        setBalances(data.balances || {});
        if (data.note) setNote(data.note);
      } else {
        setNote(data.error || 'the chain read failed');
      }
    } catch {
      setNote('the chain read failed, refresh to retry');
    }
    setReading(false);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('token_wallets')
      .select('id, label, address, app, note, sort')
      .order('sort', { ascending: true })
      .order('created_at', { ascending: true });
    const list = data || [];
    setRows(list);
    setLoading(false);
    readChain(list);
  }, [readChain]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (e) => {
    e.preventDefault();
    const address = draft.address.trim();
    if (!draft.label.trim()) { setNote('a wallet needs a label'); return; }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) { setNote('that does not read as a solana address'); return; }
    const { error } = await supabase.from('token_wallets').insert({
      label: draft.label.trim().toLowerCase(),
      address,
      app: draft.app.trim(),
      note: draft.note.trim(),
    });
    if (error) {
      setNote(error.message.includes('duplicate') ? 'that address is already in the book' : error.message);
      return;
    }
    setDraft({ label: '', address: '', app: '', note: '' });
    setAdding(false);
    setNote('');
    refresh();
  };

  const remove = async (r) => {
    if (!window.confirm(`Drop ${r.label} from the book? The wallet itself is untouched.`)) return;
    await supabase.from('token_wallets').delete().eq('id', r.id);
    refresh();
  };

  const copy = async (r) => {
    try {
      await navigator.clipboard.writeText(r.address);
      setCopied(r.id);
      setTimeout(() => setCopied(''), 1500);
    } catch { setNote('the clipboard said no'); }
  };

  const totalNb = rows.reduce((s, r) => s + (balances[r.address]?.nb || 0), 0);
  const totalSol = rows.reduce((s, r) => s + (balances[r.address]?.sol || 0), 0);

  return (
    <Box position="relative" minH="100vh" bg={P.mat}>
      <Box position="absolute" top={0} left={0} right={0} h="320px" bg={`radial-gradient(ellipse at top center, ${P.lime}12, transparent 70%)`} pointerEvents="none" />

      <Container maxW="1100px" mx={0} px={{ base: 5, md: 8 }} py={{ base: 6, md: 10 }} position="relative">
        <VStack spacing={{ base: 7, md: 9 }} align="stretch">

          <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
            <VStack align="start" spacing={1.5} minW={0}>
              <Text fontFamily="mono" fontSize={TYPE.micro} fontWeight="600" letterSpacing="0.22em" textTransform="uppercase" color={P.inkMuted}>
                Registry
              </Text>
              <Text fontSize={TYPE.title} fontWeight="600" letterSpacing="-0.03em" lineHeight="1.1" color={P.ink}>
                The book of our own wallets.
              </Text>
              <Text fontSize={TYPE.small} color={P.inkMuted}>
                Public addresses and labels, never keys, never published. Balances read live from the chain.
              </Text>
            </VStack>

            <HStack spacing={3}>
              <HStack as="button" onClick={() => readChain(rows)} spacing={1.5} color={P.inkMuted} _hover={{ color: P.ink }} transition={`color ${FAST} ${EASE}`}>
                <Icon as={TbRefresh} boxSize={4} sx={reading ? { animation: 'spin 1s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } } : undefined} />
              </HStack>
              <HStack as="button" onClick={() => setAdding((v) => !v)} spacing={1.5} bg={P.lime} color={P.limeInk} borderRadius="full" px={4} h="38px" fontWeight="700" fontSize="sm" transition={`all 0.18s ${EASE}`} _hover={{ bg: '#D2E26B', transform: 'translateY(-1px)' }}>
                <Icon as={TbPlus} boxSize={4} />
                <Text>Wallet</Text>
              </HStack>
            </HStack>
          </HStack>

          <HStack spacing={0} flexWrap="wrap" rowGap={1}>
            <HStack spacing={1.5} align="baseline">
              <Text fontFamily="mono" fontSize={TYPE.small} fontWeight="700" color={P.ink} sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtM(totalNb)}</Text>
              <Text fontFamily="mono" fontSize={TYPE.small} color={P.inkMuted}>neonburro in the book</Text>
            </HStack>
            <Text color={P.inkFaint} fontSize={TYPE.small} mx={2}>·</Text>
            <HStack spacing={1.5} align="baseline">
              <Text fontFamily="mono" fontSize={TYPE.small} fontWeight="700" color={P.ink} sx={{ fontVariantNumeric: 'tabular-nums' }}>{totalNb ? `${((totalNb / SUPPLY) * 100).toFixed(1)}%` : '–'}</Text>
              <Text fontFamily="mono" fontSize={TYPE.small} color={P.inkMuted}>of supply</Text>
            </HStack>
            <Text color={P.inkFaint} fontSize={TYPE.small} mx={2}>·</Text>
            <HStack spacing={1.5} align="baseline">
              <Text fontFamily="mono" fontSize={TYPE.small} fontWeight="700" color={P.ink} sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtSol(totalSol)}</Text>
              <Text fontFamily="mono" fontSize={TYPE.small} color={P.inkMuted}>sol</Text>
            </HStack>
            <Text color={P.inkFaint} fontSize={TYPE.small} mx={2}>·</Text>
            <HStack spacing={1.5} align="baseline">
              <Text fontFamily="mono" fontSize={TYPE.small} fontWeight="700" color={P.inkMuted} sx={{ fontVariantNumeric: 'tabular-nums' }}>{rows.length}</Text>
              <Text fontFamily="mono" fontSize={TYPE.small} color={P.inkMuted}>wallets</Text>
            </HStack>
          </HStack>

          {note && <Text fontFamily="mono" fontSize={TYPE.small} color={P.limeDeep}>{note}</Text>}

          {adding && (
            <Box as="form" onSubmit={add} bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="16px" p={4}>
              <HStack spacing={3} flexWrap="wrap" rowGap={3} align="end">
                <Box flex="0 1 160px"><Input {...inputProps} placeholder="label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></Box>
                <Box flex="1 1 320px"><Input {...inputProps} fontFamily="mono" placeholder="address" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></Box>
                <Box flex="0 1 130px"><Input {...inputProps} placeholder="app" value={draft.app} onChange={(e) => setDraft({ ...draft, app: e.target.value })} /></Box>
                <Box flex="1 1 200px"><Input {...inputProps} placeholder="note" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></Box>
                <HStack as="button" type="submit" spacing={1.5} bg={P.lime} color={P.limeInk} borderRadius="full" px={4} h="38px" fontWeight="700" fontSize="sm" flexShrink={0} transition={`all 0.18s ${EASE}`} _hover={{ bg: '#D2E26B' }}>
                  <Text>Into the book</Text>
                </HStack>
              </HStack>
            </Box>
          )}

          {loading ? (
            <HStack py={16} justify="center"><Spinner color={P.limeDeep} /></HStack>
          ) : (
            <VStack spacing={2} align="stretch">
              {rows.map((r) => {
                const b = balances[r.address] || {};
                return (
                  <HStack key={r.id} bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="14px" px={{ base: 3.5, md: 5 }} py={3} justify="space-between" gap={4} flexWrap="wrap" rowGap={2}>
                    <VStack align="start" spacing={0.5} minW="150px" flex="1 1 180px">
                      <HStack spacing={2}>
                        <Text fontSize={TYPE.body} fontWeight="700" color={P.ink}>{r.label}</Text>
                        {r.app && <Text fontFamily="mono" fontSize={TYPE.micro} color={P.inkFaint}>{r.app}</Text>}
                      </HStack>
                      {r.note && <Text fontSize={TYPE.label} color={P.inkMuted} noOfLines={1}>{r.note}</Text>}
                    </VStack>

                    <HStack spacing={1.5} flexShrink={0}>
                      <Text fontFamily="mono" fontSize={TYPE.label} color={P.inkFaint}>{shortAddr(r.address)}</Text>
                      <HStack as="button" onClick={() => copy(r)} color={copied === r.id ? P.limeDeep : P.inkFaint} _hover={{ color: P.limeDeep }} transition={`color ${FAST} ${EASE}`}>
                        <Icon as={copied === r.id ? TbCheck : TbCopy} boxSize={3.5} />
                      </HStack>
                      <Box as="a" href={`https://solscan.io/account/${r.address}`} target="_blank" rel="noopener noreferrer" color={P.inkFaint} _hover={{ color: P.limeDeep }} transition={`color ${FAST} ${EASE}`}>
                        <Icon as={TbExternalLink} boxSize={3.5} display="block" />
                      </Box>
                    </HStack>

                    <HStack spacing={5} flexShrink={0}>
                      <VStack align="end" spacing={0}>
                        <Text fontFamily="mono" fontSize={TYPE.small} fontWeight="700" color={P.ink} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {fmtM(b.nb)}
                        </Text>
                        <Text fontFamily="mono" fontSize={TYPE.micro} color={P.inkFaint}>
                          {b.nb ? `${((b.nb / SUPPLY) * 100).toFixed(1)}%` : 'neonburro'}
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={0} minW="52px">
                        <Text fontFamily="mono" fontSize={TYPE.small} color={P.inkSec} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {fmtSol(b.sol)}
                        </Text>
                        <Text fontFamily="mono" fontSize={TYPE.micro} color={P.inkFaint}>sol</Text>
                      </VStack>
                      <HStack as="button" onClick={() => remove(r)} color={P.inkFaint} _hover={{ color: P.coral }} transition={`color ${FAST} ${EASE}`}>
                        <Icon as={TbTrash} boxSize={3.5} />
                      </HStack>
                    </HStack>
                  </HStack>
                );
              })}
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default Registry;
