// src/pages/Analytics/index.jsx
// SENTINEL: NB_PULSE_ANALYTICS_V2
//
// ── V2, 2026-08-26. THE TRAFFIC PANEL IS LIVE ───────────────────────────────
// Did anybody hit the page stopped being a question for Google's console.
// The studio site carries a first party beacon (src/services/beacon.js in
// the neonburro repo) that writes one blind row per pageview into
// page_views, migration 2026082609, path and referrer host and a time and
// nothing else. This page reads the last seven days and aggregates in the
// browser, which is fine at the volumes a studio site sees. When rows pass
// six figures move the math into a database view and keep the panel.
//
// The source cards below the live panel stay, they are the honest map of
// what is wired next. GA4 still collects in parallel, deeper SEO tooling
// (search console, the semrush shaped stuff) rides on those cards.
//
// No oxford commas, no em dashes.

import { useState, useEffect } from 'react';
import { Box, Text, HStack, VStack, Icon, SimpleGrid, Badge, Spinner } from '@chakra-ui/react';
import { TbActivity, TbCoin, TbChartArea, TbBrandStripe, TbServer, TbEye } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';

const P = colors.paper;

const SOURCES = [
  {
    icon: TbServer,
    title: 'Deploy health',
    line: 'Every property in one board, the shop, order, lounge, the studio site and Pulse. Last deploy, build time, up or down.',
    status: 'Ready to wire',
    tone: P.green,
    note: 'Uses the Netlify token you already have.',
  },
  {
    icon: TbCoin,
    title: 'Revenue and pipeline',
    line: 'Outstanding and collected, active clients, open sprints, subscriptions and forms in, pulled straight from Supabase.',
    status: 'Ready to wire',
    tone: P.green,
    note: 'No new keys, Pulse already reads this.',
  },
  {
    icon: TbBrandStripe,
    title: 'Stripe money',
    line: 'MRR, recent charges and payouts alongside everything else, so the money view is live not a monthly guess.',
    status: 'Needs a key on Pulse',
    tone: P.gold,
    note: 'Add STRIPE_SECRET_KEY to the Pulse site.',
  },
  {
    icon: TbChartArea,
    title: 'Search and rankings',
    line: 'Queries, clicks and positions the way the semrush shaped tools show them, riding on Google Search Console which is free.',
    status: 'Needs a connection',
    tone: P.gold,
    note: 'A GSC service account key unlocks it, ask when ready.',
  },
];

const dayKey = (d) => d.toISOString().slice(0, 10);

const Analytics = () => {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from('page_views')
        .select('path, referrer, viewed_at')
        .gte('viewed_at', since)
        .order('viewed_at', { ascending: false })
        .limit(20000);
      setRows(data || []);
    })();
  }, []);

  const today = dayKey(new Date());
  const todayRows = (rows || []).filter((r) => r.viewed_at.slice(0, 10) === today);

  const countBy = (list, pick) => {
    const m = new Map();
    list.forEach((r) => {
      const k = pick(r);
      if (!k) return;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  const topPaths = countBy(rows || [], (r) => r.path).slice(0, 8);
  const topRefs = countBy(rows || [], (r) => r.referrer).slice(0, 6);
  const burroViews = (rows || []).filter((r) => r.path.startsWith('/send-a-burro')).length;

  return (
    <Box bg={P.mat} minH="100vh" px={{ base: 4, md: 6, xl: 8 }} py={{ base: 5, md: 7 }}>
      <Box maxW="1500px">
        <Text fontFamily="mono" fontSize="2xs" fontWeight="600" letterSpacing="0.22em" textTransform="uppercase" color={P.limeDeep} mb={2}>
          Command center
        </Text>
        <Text fontFamily="display" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="600" color={P.ink} letterSpacing="-0.02em" lineHeight="1.05">
          Analytics
        </Text>

        {/* ── the traffic panel, live, first party ─────────────────────────── */}
        <Box bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="18px" p={5} mt={7}>
          <HStack justify="space-between" mb={4} flexWrap="wrap" gap={2}>
            <HStack spacing={2}>
              <Icon as={TbEye} boxSize={4} color={P.limeDeep} />
              <Text fontSize="md" fontWeight="700" color={P.ink}>neonburro.com traffic</Text>
            </HStack>
            <Text fontFamily="mono" fontSize="2xs" color={P.inkFaint}>the house beacon, last seven days, no cookies no ids</Text>
          </HStack>

          {rows === null ? (
            <HStack py={6} justify="center"><Spinner color={P.limeDeep} size="sm" /></HStack>
          ) : (
            <>
              <HStack spacing={0} flexWrap="wrap" rowGap={1} mb={5}>
                <HStack spacing={1.5} align="baseline">
                  <Text fontFamily="mono" fontSize="lg" fontWeight="700" color={P.ink} sx={{ fontVariantNumeric: 'tabular-nums' }}>{todayRows.length}</Text>
                  <Text fontFamily="mono" fontSize="13px" color={P.inkMuted}>views today</Text>
                </HStack>
                <Text color={P.inkFaint} mx={2}>·</Text>
                <HStack spacing={1.5} align="baseline">
                  <Text fontFamily="mono" fontSize="lg" fontWeight="700" color={P.ink} sx={{ fontVariantNumeric: 'tabular-nums' }}>{rows.length}</Text>
                  <Text fontFamily="mono" fontSize="13px" color={P.inkMuted}>this week</Text>
                </HStack>
                <Text color={P.inkFaint} mx={2}>·</Text>
                <HStack spacing={1.5} align="baseline">
                  <Text fontFamily="mono" fontSize="lg" fontWeight="700" color={P.limeDeep} sx={{ fontVariantNumeric: 'tabular-nums' }}>{burroViews}</Text>
                  <Text fontFamily="mono" fontSize="13px" color={P.inkMuted}>on send a burro</Text>
                </HStack>
              </HStack>

              {rows.length === 0 ? (
                <Text fontSize="sm" color={P.inkMuted}>
                  Nothing yet. The beacon shipped with the latest studio deploy, rows appear the moment anybody loads a page.
                </Text>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  <VStack align="stretch" spacing={1.5}>
                    <Text fontFamily="mono" fontSize="2xs" fontWeight="600" letterSpacing="0.18em" textTransform="uppercase" color={P.inkMuted} mb={1}>Top pages</Text>
                    {topPaths.map(([path, n]) => (
                      <HStack key={path} justify="space-between">
                        <Text fontFamily="mono" fontSize="13px" color={P.inkSec} noOfLines={1}>{path}</Text>
                        <Text fontFamily="mono" fontSize="13px" fontWeight="700" color={P.ink} sx={{ fontVariantNumeric: 'tabular-nums' }}>{n}</Text>
                      </HStack>
                    ))}
                  </VStack>
                  <VStack align="stretch" spacing={1.5}>
                    <Text fontFamily="mono" fontSize="2xs" fontWeight="600" letterSpacing="0.18em" textTransform="uppercase" color={P.inkMuted} mb={1}>Came from</Text>
                    {topRefs.length === 0 && (
                      <Text fontSize="13px" color={P.inkFaint}>Direct visits only so far.</Text>
                    )}
                    {topRefs.map(([host, n]) => (
                      <HStack key={host} justify="space-between">
                        <Text fontFamily="mono" fontSize="13px" color={P.inkSec} noOfLines={1}>{host}</Text>
                        <Text fontFamily="mono" fontSize="13px" fontWeight="700" color={P.ink} sx={{ fontVariantNumeric: 'tabular-nums' }}>{n}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </SimpleGrid>
              )}
            </>
          )}
        </Box>

        <Text fontSize="sm" color={P.inkMuted} mt={8} maxW="620px" lineHeight="1.7">
          What lands next, interconnected and honest. Here is each source and what it needs.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
          {SOURCES.map((s) => (
            <Box key={s.title} bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="18px" p={5}>
              <HStack justify="space-between" align="start" mb={3}>
                <Box w="40px" h="40px" borderRadius="12px" bg={P.sunken} display="flex" alignItems="center" justifyContent="center">
                  <Icon as={s.icon} boxSize={5} color={P.inkSec} />
                </Box>
                <Badge bg={`${s.tone}1A`} color={s.tone} fontFamily="mono" fontSize="2xs" fontWeight="700" letterSpacing="0.06em" textTransform="uppercase" px={2.5} py={1} borderRadius="full">
                  {s.status}
                </Badge>
              </HStack>
              <Text fontSize="md" fontWeight="700" color={P.ink} letterSpacing="-0.01em">{s.title}</Text>
              <Text fontSize="sm" color={P.inkMuted} mt={1.5} lineHeight="1.65">{s.line}</Text>
              <Text fontSize="xs" color={P.inkFaint} mt={3} fontFamily="mono">{s.note}</Text>
            </Box>
          ))}
        </SimpleGrid>

        <HStack mt={6} spacing={2} color={P.inkFaint}>
          <Icon as={TbActivity} boxSize={3.5} />
          <Text fontSize="xs" color={P.inkFaint}>The full plan and the env var names are in docs/analytics-and-integrations.md</Text>
        </HStack>
      </Box>
    </Box>
  );
};

export default Analytics;
