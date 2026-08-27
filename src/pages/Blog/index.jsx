// src/pages/Blog/index.jsx
// SENTINEL: NB_PULSE_BLOG_LIST_V1
//
// The writing desk. Every post the studio has ever drafted or published, one
// row each, newest movement first. A row is a door to the editor, the lime
// button starts a fresh draft. Published rows carry a quiet link to the live
// page on neonburro.com.
//
// Posts live in blog_posts in Supabase and this page reads them straight
// through the client, staff RLS lets a signed in operator see drafts. The
// studio site only ever sees published rows, that boundary is enforced by
// policy in migration 2026082604 and pulled by scripts/db-posts.mjs in the
// neonburro repo at build time. Nothing here talks to the public site
// directly, publishing goes through the publish-blog-post function from
// inside the editor.
//
// Paper system page, same idioms as Clients. No oxford commas, no em dashes.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, VStack, HStack, Text, Icon, Container, Spinner } from '@chakra-ui/react';
import { TbPlus, TbExternalLink } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';
import { TYPE, EASE, FAST } from '../../theme/layout';

const P = colors.paper;

const FILTERS = [
  { key: 'all', label: 'all' },
  { key: 'draft', label: 'drafts' },
  { key: 'published', label: 'published' },
];

const when = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const StatusPip = ({ status }) => (
  <HStack spacing={1.5}>
    <Box boxSize="7px" borderRadius="full" bg={status === 'published' ? P.lime : P.inkFaint} />
    <Text fontFamily="mono" fontSize={TYPE.label} color={status === 'published' ? P.limeDeep : P.inkMuted}>
      {status}
    </Text>
  </HStack>
);

const Blog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, burro, status, featured, published_at, updated_at, created_at')
        .order('updated_at', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = posts.filter((p) => filter === 'all' || p.status === filter);
  const counts = {
    all: posts.length,
    draft: posts.filter((p) => p.status === 'draft').length,
    published: posts.filter((p) => p.status === 'published').length,
  };

  return (
    <Box position="relative" minH="100vh" bg={P.mat}>
      <Box position="absolute" top={0} left={0} right={0} h="320px" bg={`radial-gradient(ellipse at top center, ${P.lime}12, transparent 70%)`} pointerEvents="none" />

      <Container maxW="1100px" mx={0} px={{ base: 5, md: 8 }} py={{ base: 6, md: 10 }} position="relative">
        <VStack spacing={{ base: 7, md: 9 }} align="stretch">

          <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
            <VStack align="start" spacing={1.5} minW={0}>
              <Text fontFamily="mono" fontSize={TYPE.micro} fontWeight="600" letterSpacing="0.22em" textTransform="uppercase" color={P.inkMuted}>
                Blog
              </Text>
              <Text fontSize={TYPE.title} fontWeight="600" letterSpacing="-0.03em" lineHeight="1.1" color={P.ink}>
                The posts, written here, live there.
              </Text>
            </VStack>

            <HStack as="button" onClick={() => navigate('/blog/new/')} spacing={1.5} bg={P.lime} color={P.limeInk} borderRadius="full" px={4} h="40px" fontWeight="700" fontSize="sm" transition={`all 0.18s ${EASE}`} _hover={{ bg: '#D2E26B', transform: 'translateY(-1px)' }} _active={{ transform: 'scale(0.98)' }}>
              <Icon as={TbPlus} boxSize={4} />
              <Text>Post</Text>
            </HStack>
          </HStack>

          <HStack spacing={5}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <HStack key={f.key} as="button" onClick={() => setFilter(f.key)} spacing={1.5} align="baseline" pb={1} borderBottom="2px solid" borderColor={active ? P.lime : 'transparent'} transition={`all ${FAST} ${EASE}`}>
                  <Text fontSize={TYPE.small} fontWeight="700" color={active ? P.ink : P.inkMuted}>{f.label}</Text>
                  <Text fontFamily="mono" fontSize={TYPE.label} color={active ? P.limeDeep : P.inkFaint}>{counts[f.key]}</Text>
                </HStack>
              );
            })}
          </HStack>

          {loading ? (
            <HStack py={16} justify="center"><Spinner color={P.limeDeep} /></HStack>
          ) : filtered.length === 0 ? (
            <VStack py={16} spacing={2}>
              <Text fontSize={TYPE.body} color={P.inkMuted}>
                {filter === 'all' ? 'Nothing written yet. The lime button starts the first one.' : `No ${filter === 'draft' ? 'drafts' : 'published posts'} right now.`}
              </Text>
            </VStack>
          ) : (
            <VStack spacing={2.5} align="stretch">
              {filtered.map((p) => (
                <HStack
                  key={p.id}
                  as="button"
                  onClick={() => navigate(`/blog/${p.id}/`)}
                  textAlign="left"
                  bg={P.sheet}
                  border="1px solid"
                  borderColor={P.hair}
                  borderRadius="18px"
                  px={{ base: 4, md: 5 }}
                  py={4}
                  justify="space-between"
                  gap={4}
                  transition={`all ${FAST} ${EASE}`}
                  _hover={{ borderColor: P.limeDeep, transform: 'translateY(-1px)' }}
                >
                  <VStack align="start" spacing={1} minW={0} flex={1}>
                    <Text fontSize={TYPE.body} fontWeight="700" color={P.ink} noOfLines={1}>
                      {p.title || 'untitled'}
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      <Text fontFamily="mono" fontSize={TYPE.label} color={P.inkFaint} noOfLines={1}>
                        /blog/{p.slug || '…'}/
                      </Text>
                      <Text fontFamily="mono" fontSize={TYPE.label} color={P.inkMuted}>
                        {p.burro || 'epoch'}.
                      </Text>
                      <Text fontFamily="mono" fontSize={TYPE.label} color={P.inkFaint}>
                        {p.status === 'published' ? when(p.published_at) : `touched ${when(p.updated_at || p.created_at)}`}
                      </Text>
                    </HStack>
                  </VStack>

                  <HStack spacing={4} flexShrink={0}>
                    {p.status === 'published' && (
                      <Box
                        as="span"
                        role="link"
                        onClick={(e) => { e.stopPropagation(); window.open(`https://neonburro.com/blog/${p.slug}/`, '_blank', 'noopener'); }}
                        color={P.inkMuted}
                        transition={`color ${FAST} ${EASE}`}
                        _hover={{ color: P.limeDeep }}
                      >
                        <Icon as={TbExternalLink} boxSize={4} display="block" />
                      </Box>
                    )}
                    <StatusPip status={p.status} />
                  </HStack>
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default Blog;
