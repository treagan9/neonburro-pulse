// src/pages/Analytics/index.jsx
// Placeholder for the Analytics command center, on Paper so it sits right inside
// the new cream shell instead of reading as a dark hole. This is not the finished
// page, it is an honest map of what is being wired and what each source needs,
// so the section looks intentional while the integrations land. The plan and the
// env vars live in docs/analytics-and-integrations.md. No oxford commas, no dashes.

import { Box, Text, HStack, Icon, SimpleGrid, Badge } from '@chakra-ui/react';
import { TbActivity, TbCoin, TbChartArea, TbBrandStripe, TbServer } from 'react-icons/tb';
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
    title: 'Web traffic',
    line: 'Visitors, top pages and referrers across all five properties, one unified view.',
    status: 'Choosing the tool',
    tone: P.inkMuted,
    note: 'Plausible is the front runner, see the notes doc.',
  },
];

const Analytics = () => (
  <Box bg={P.mat} minH="100vh" px={{ base: 4, md: 6, xl: 8 }} py={{ base: 5, md: 7 }}>
    <Box maxW="1500px">
      <Text fontFamily="mono" fontSize="2xs" fontWeight="600" letterSpacing="0.22em" textTransform="uppercase" color={P.limeDeep} mb={2}>
        Command center
      </Text>
      <Text fontFamily="display" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="600" color={P.ink} letterSpacing="-0.02em" lineHeight="1.05">
        Analytics
      </Text>
      <Text fontSize="sm" color={P.inkMuted} mt={3} maxW="620px" lineHeight="1.7">
        One place for every property, interconnected and honest. Here is what is being wired and what each source needs. The two green ones are ready to turn on now.
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={8}>
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

export default Analytics;
