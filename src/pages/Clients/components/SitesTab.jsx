// src/pages/Clients/components/SitesTab.jsx
// Sites tab on ClientDetail
// - Lists connected Netlify sites for this client
// - "Connect Netlify Site" opens a searchable picker of ALL your Netlify sites
// - Sites already linked to other clients are clearly marked
// - Shows real-time connection status, framework, latest commit

import { useState, useEffect, useMemo } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Center, Spinner, Input,
  Button, Checkbox, useToast, Collapse,
} from '@chakra-ui/react';
import {
  TbWorld, TbPlus, TbExternalLink, TbCheck, TbSearch,
  TbBrandGithub, TbLink, TbAlertCircle,
} from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import { formatSmart } from '../../../lib/time';

const SitesTab = ({ clientId, clientName }) => {
  // Connected sites (rows from client_sites for this client)
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Netlify picker state
  const [showPicker, setShowPicker] = useState(false);
  const [netlifySites, setNetlifySites] = useState([]);
  const [loadingNetlify, setLoadingNetlify] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);

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

  const openPicker = async () => {
    setShowPicker(true);
    setConnectError(null);
    setSelectedSite(null);
    setDisplayName('');
    setIsInternal(false);
    setSearchQuery('');

    if (netlifySites.length > 0) return; // already loaded

    setLoadingNetlify(true);
    try {
      const res = await fetch('/.netlify/functions/list-netlify-sites');
      if (!res.ok) throw new Error(`Failed to load Netlify sites (${res.status})`);
      const data = await res.json();
      setNetlifySites(data.sites || []);
    } catch (err) {
      toast({
        title: 'Could not load Netlify sites',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setLoadingNetlify(false);
    }
  };

  // Filter: only show unconnected sites + sites already linked to THIS client,
  // hide ones already linked to OTHER clients unless searched explicitly
  const filteredSites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return netlifySites
      .filter((s) => {
        // Hide sites already connected to other clients (unless searched by name)
        if (s.connected && s.connected_to_client_id !== clientId) {
          return q && s.name.toLowerCase().includes(q);
        }
        // Hide sites already connected to THIS client (they're in the list above)
        if (s.connected && s.connected_to_client_id === clientId) return false;
        // Apply search
        if (q) return s.name.toLowerCase().includes(q) || (s.url || '').toLowerCase().includes(q);
        return true;
      })
      .slice(0, 50); // cap visible results
  }, [netlifySites, searchQuery, clientId]);

  const handleSelectSite = (site) => {
    if (site.connected && site.connected_to_client_id !== clientId) {
      toast({
        title: 'Already connected',
        description: `This site is linked to ${site.connected_to_client}`,
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    setSelectedSite(site);
    setDisplayName(site.name);
    setConnectError(null);
  };

  const handleConnect = async () => {
    if (!selectedSite) {
      toast({ title: 'Pick a site first', status: 'warning', duration: 2000 });
      return;
    }

    setConnecting(true);
    setConnectError(null);
    try {
      const res = await fetch('/.netlify/functions/connect-netlify-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: selectedSite.name,
          clientId,
          isInternal,
          displayName: displayName.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show error inline instead of just toasting - makes debugging obvious
        setConnectError(data.error || `Connect failed (${res.status})`);
        toast({
          title: 'Could not connect site',
          description: data.error || 'Unknown error',
          status: 'error',
          duration: 5000,
        });
        return;
      }

      toast({
        title: 'Site connected',
        description: data.message || `${selectedSite.name} linked to ${clientName}`,
        status: 'success',
        duration: 4000,
      });

      // Refresh both lists
      setShowPicker(false);
      setSelectedSite(null);
      setDisplayName('');
      setIsInternal(false);
      setNetlifySites([]); // force re-fetch next open to update connected markers
      fetchSites();
    } catch (err) {
      setConnectError(err.message);
      toast({
        title: 'Network error',
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
      {/* Connected sites list */}
      {sites.length === 0 && !showPicker && (
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
            <HStack spacing={2} mt={0.5} flexWrap="wrap">
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

      {/* Connect picker */}
      {showPicker ? (
        <Box py={5} borderBottom="1px solid" borderColor="surface.900">
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text
                fontSize="2xs"
                fontWeight="700"
                color="brand.500"
                textTransform="uppercase"
                letterSpacing="0.1em"
                fontFamily="mono"
              >
                Pick a Netlify Site
              </Text>
              <Box
                as="button"
                onClick={() => setShowPicker(false)}
                color="surface.600"
                _hover={{ color: 'surface.400' }}
                fontSize="2xs"
                fontFamily="mono"
                fontWeight="700"
                textTransform="uppercase"
              >
                Cancel
              </Box>
            </HStack>

            {loadingNetlify ? (
              <Center py={8}>
                <VStack spacing={2}>
                  <Spinner size="sm" color="brand.500" thickness="2px" />
                  <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                    Loading your Netlify sites
                  </Text>
                </VStack>
              </Center>
            ) : selectedSite ? (
              // Confirmation view
              <VStack spacing={4} align="stretch">
                <Box
                  bg="surface.900"
                  border="1px solid"
                  borderColor="brand.500"
                  borderRadius="lg"
                  p={4}
                >
                  <HStack spacing={3}>
                    <Icon as={TbWorld} boxSize={5} color="brand.500" />
                    <Box flex={1}>
                      <Text color="white" fontSize="sm" fontWeight="700">
                        {selectedSite.name}
                      </Text>
                      {selectedSite.url && (
                        <Text color="surface.500" fontSize="xs" fontFamily="mono">
                          {selectedSite.url.replace(/^https?:\/\//, '')}
                        </Text>
                      )}
                      <HStack spacing={2} mt={1} flexWrap="wrap">
                        {selectedSite.framework && (
                          <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                            {selectedSite.framework}
                          </Text>
                        )}
                        {selectedSite.published_at && (
                          <>
                            <Text color="surface.700" fontSize="2xs">·</Text>
                            <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                              deployed {formatSmart(selectedSite.published_at)}
                            </Text>
                          </>
                        )}
                      </HStack>
                    </Box>
                    <Box
                      as="button"
                      onClick={() => setSelectedSite(null)}
                      color="surface.600"
                      _hover={{ color: 'surface.400' }}
                      fontSize="2xs"
                      fontFamily="mono"
                      textTransform="uppercase"
                    >
                      Change
                    </Box>
                  </HStack>
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
                    placeholder="Production Site"
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
                  <Text color="surface.700" fontSize="2xs" mt={1}>
                    How this site shows up in Pulse + the client portal
                  </Text>
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

                {connectError && (
                  <HStack
                    bg="rgba(255,51,102,0.08)"
                    border="1px solid rgba(255,51,102,0.25)"
                    borderRadius="lg"
                    p={3}
                    spacing={2}
                    align="start"
                  >
                    <Icon as={TbAlertCircle} boxSize={4} color="red.400" mt={0.5} />
                    <Text color="red.300" fontSize="xs" flex={1}>
                      {connectError}
                    </Text>
                  </HStack>
                )}

                <HStack spacing={2}>
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
                </HStack>
              </VStack>
            ) : (
              // Search + list view
              <VStack spacing={3} align="stretch">
                <HStack
                  borderBottom="1px solid"
                  borderColor="surface.800"
                  pb={2}
                  spacing={2}
                >
                  <Icon as={TbSearch} boxSize={4} color="surface.600" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${netlifySites.length} Netlify sites...`}
                    autoFocus
                    bg="transparent"
                    border="none"
                    color="white"
                    fontSize="sm"
                    h="32px"
                    px={0}
                    _focus={{ boxShadow: 'none' }}
                    _placeholder={{ color: 'surface.600' }}
                  />
                </HStack>

                {filteredSites.length === 0 ? (
                  <Center py={6}>
                    <Text color="surface.600" fontSize="xs" fontFamily="mono">
                      {searchQuery ? 'No matches' : 'No sites available to connect'}
                    </Text>
                  </Center>
                ) : (
                  <Box maxH="360px" overflowY="auto">
                    {filteredSites.map((site) => {
                      const takenByOther = site.connected && site.connected_to_client_id !== clientId;
                      return (
                        <HStack
                          key={site.id}
                          py={2.5}
                          px={2}
                          spacing={3}
                          cursor={takenByOther ? 'not-allowed' : 'pointer'}
                          onClick={() => !takenByOther && handleSelectSite(site)}
                          borderRadius="md"
                          transition="all 0.15s"
                          opacity={takenByOther ? 0.4 : 1}
                          _hover={takenByOther ? {} : { bg: 'rgba(255,255,255,0.02)' }}
                          role="group"
                        >
                          <Icon
                            as={TbLink}
                            boxSize={3}
                            color={takenByOther ? 'surface.700' : 'surface.600'}
                            _groupHover={takenByOther ? {} : { color: 'brand.500' }}
                          />
                          <Box flex={1} minW={0}>
                            <HStack spacing={2}>
                              <Text
                                color="white"
                                fontSize="sm"
                                fontWeight="600"
                                fontFamily="mono"
                              >
                                {site.name}
                              </Text>
                              {takenByOther && (
                                <Text
                                  fontSize="2xs"
                                  color="accent.banana"
                                  fontFamily="mono"
                                  fontWeight="700"
                                  textTransform="uppercase"
                                >
                                  → {site.connected_to_client}
                                </Text>
                              )}
                            </HStack>
                            <HStack spacing={2} mt={0.5} flexWrap="wrap">
                              {site.url && (
                                <Text color="surface.600" fontSize="2xs" fontFamily="mono" noOfLines={1}>
                                  {site.url.replace(/^https?:\/\//, '')}
                                </Text>
                              )}
                              {site.framework && (
                                <>
                                  <Text color="surface.700" fontSize="2xs">·</Text>
                                  <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                                    {site.framework}
                                  </Text>
                                </>
                              )}
                              {site.published_at && (
                                <>
                                  <Text color="surface.700" fontSize="2xs">·</Text>
                                  <Text color="surface.600" fontSize="2xs" fontFamily="mono">
                                    {formatSmart(site.published_at)}
                                  </Text>
                                </>
                              )}
                            </HStack>
                          </Box>
                        </HStack>
                      );
                    })}
                  </Box>
                )}
              </VStack>
            )}
          </VStack>
        </Box>
      ) : (
        <HStack
          py={4}
          spacing={1.5}
          cursor="pointer"
          onClick={openPicker}
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
