// src/pages/Clients/components/SitesTab.jsx
// Sites tab for ClientDetail - shows connected Netlify sites + connect form

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Center, Spinner, Input,
  Button, Checkbox, useToast,
} from '@chakra-ui/react';
import { TbWorld, TbPlus, TbX, TbExternalLink, TbCheck } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import { formatSmart } from '../../../lib/time';

const SitesTab = ({ clientId, clientName }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchSites(); }, [clientId]);

  const fetchSites = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('client_sites')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setSites(data || []);
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!siteName.trim()) {
      toast({ title: 'Site name required', status: 'warning', duration: 2000 });
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch('/.netlify/functions/connect-netlify-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: siteName.trim().toLowerCase(),
          clientId,
          isInternal,
          displayName: displayName.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connect failed');

      toast({
        title: 'Site connected',
        description: data.message,
        status: 'success',
        duration: 4000,
      });

      // Reset and refresh
      setSiteName('');
      setDisplayName('');
      setIsInternal(false);
      setShowConnect(false);
      fetchSites();
    } catch (err) {
      toast({
        title: 'Could not connect site',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setConnecting(false);
    }
  };

  if (loading) return <Center py={16}><Spinner color="brand.500" /></Center>;

  return (
    <VStack spacing={0} align="stretch">
      {sites.length === 0 && !showConnect && (
        <Center py={12}>
          <VStack spacing={3}>
            <Icon as={TbWorld} boxSize={8} color="surface.700" />
            <Text color="surface.500" fontSize="sm">No sites connected yet</Text>
          </VStack>
        </Center>
      )}

      {sites.map((site) => (
        <HStack
          key={site.id}
          py={3}
          spacing={3}
          borderBottom="1px solid"
          borderColor="surface.900"
        >
          <Icon as={TbWorld} boxSize={3.5} color="surface.600" />
          <Box flex={1}>
            <HStack spacing={2}>
              <Text color="white" fontSize="sm" fontWeight="600">
                {site.display_name || site.netlify_site_name}
              </Text>
              {site.is_internal && (
                <Text
                  fontSize="2xs"
                  color="surface.600"
                  fontFamily="mono"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  Internal
                </Text>
              )}
            </HStack>
            <HStack spacing={2} mt={0.5}>
              <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                {site.netlify_site_name}
              </Text>
              {site.framework && (
                <>
                  <Text color="surface.700" fontSize="2xs">·</Text>
                  <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                    {site.framework}
                  </Text>
                </>
              )}
              {site.last_synced_at && (
                <>
                  <Text color="surface.700" fontSize="2xs">·</Text>
                  <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                    synced {formatSmart(site.last_synced_at)}
                  </Text>
                </>
              )}
            </HStack>
          </Box>
          {site.primary_url && (
            <Box
              as="a"
              href={site.primary_url}
              target="_blank"
              color="surface.600"
              _hover={{ color: 'brand.500' }}
              transition="color 0.15s"
            >
              <Icon as={TbExternalLink} boxSize={3.5} />
            </Box>
          )}
          {site.webhook_registered_at && (
            <HStack spacing={1}>
              <Box
                w="6px"
                h="6px"
                borderRadius="full"
                bg="accent.neon"
                boxShadow="0 0 6px rgba(57,255,20,0.6)"
              />
              <Text color="surface.600" fontSize="2xs" fontFamily="mono">live</Text>
            </HStack>
          )}
        </HStack>
      ))}

      {showConnect ? (
        <Box py={5} borderBottom="1px solid" borderColor="surface.900">
          <VStack spacing={4} align="stretch">
            <Box>
              <Text
                fontSize="2xs"
                fontWeight="700"
                color="surface.600"
                textTransform="uppercase"
                letterSpacing="0.1em"
                fontFamily="mono"
                mb={1}
              >
                Netlify Site Name
              </Text>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="mwgridsolutions"
                autoFocus
                bg="transparent"
                border="none"
                borderBottom="1px solid"
                borderColor="surface.700"
                borderRadius={0}
                color="white"
                fontSize="md"
                fontFamily="mono"
                h="40px"
                px={0}
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              />
              <Text color="surface.700" fontSize="2xs" mt={1}>
                The slug from Netlify (the part before .netlify.app)
              </Text>
            </Box>

            <Box>
              <Text
                fontSize="2xs"
                fontWeight="700"
                color="surface.600"
                textTransform="uppercase"
                letterSpacing="0.1em"
                fontFamily="mono"
                mb={1}
              >
                Display Name
              </Text>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={`${clientName} Public Site`}
                bg="transparent"
                border="none"
                borderBottom="1px solid"
                borderColor="surface.700"
                borderRadius={0}
                color="white"
                fontSize="md"
                h="40px"
                px={0}
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              />
            </Box>

            <Checkbox
              isChecked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              colorScheme="cyan"
              size="sm"
            >
              <Text color="surface.400" fontSize="xs">
                Internal site (hide from client portal)
              </Text>
            </Checkbox>

            <HStack spacing={2} pt={2}>
              <Button
                size="sm"
                bg="brand.500"
                color="surface.950"
                fontWeight="700"
                borderRadius="lg"
                leftIcon={<TbCheck size={14} />}
                onClick={handleConnect}
                isLoading={connecting}
                loadingText="Connecting"
              >
                Connect Site
              </Button>
              <Button
                size="sm"
                variant="ghost"
                color="surface.500"
                onClick={() => {
                  setShowConnect(false);
                  setSiteName('');
                  setDisplayName('');
                  setIsInternal(false);
                }}
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>
      ) : (
        <HStack
          py={4}
          spacing={1.5}
          cursor="pointer"
          onClick={() => setShowConnect(true)}
          color="brand.500"
          opacity={0.6}
          _hover={{ opacity: 1 }}
        >
          <Icon as={TbPlus} boxSize={3} />
          <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
            Connect Netlify Site
          </Text>
        </HStack>
      )}
    </VStack>
  );
};

export default SitesTab;
