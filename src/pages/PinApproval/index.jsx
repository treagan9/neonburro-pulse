// src/pages/PinApproval/index.jsx
// path: /pin-approval/?token=xxx
//
// Public page (no auth required - validated by approval token from email)
// Team clicks link in notification email -> lands here -> one click to approve/deny

import { useState, useEffect } from 'react';
import {
  Box, Container, VStack, HStack, Text, Heading, Button, Spinner,
  Center, Icon, useToast, Image,
} from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import { TbKey, TbCheck, TbX, TbAlertTriangle, TbShield } from 'react-icons/tb';

const colors = {
  space: '#0A0A0A',
  surface: '#141414',
  border: '#1f1f1f',
  cyan: '#00E5E5',
  lime: '#39FF14',
  amber: '#FFE500',
  red: '#FF3366',
};

const PinApproval = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [request, setRequest] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(null); // 'approved' | 'denied'

  useEffect(() => {
    if (!token) {
      setError('No approval token provided');
      setLoading(false);
      return;
    }
    fetchRequest();
  }, [token]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/.netlify/functions/approve-pin-request?token=${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Unable to load request');
        setLoading(false);
        return;
      }

      setRequest(data.request);
      setLoading(false);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setProcessing(true);
    try {
      const res = await fetch(`/.netlify/functions/approve-pin-request?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setDone(action === 'approve' ? 'approved' : 'denied');
      toast({
        title: action === 'approve' ? 'PIN sent to client' : 'Request denied',
        status: 'success',
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: 'Failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={colors.space}>
        <Center minH="100vh">
          <VStack spacing={4}>
            <Spinner size="lg" color={colors.cyan} thickness="3px" />
            <Text color="gray.500" fontSize="sm">Loading request</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg={colors.space}>
        <Center minH="100vh" px={4}>
          <Container maxW="480px">
            <VStack
              spacing={5}
              p={8}
              bg={colors.surface}
              border="1px solid"
              borderColor={colors.border}
              borderRadius="2xl"
              textAlign="center"
            >
              <Box
                w="64px"
                h="64px"
                borderRadius="full"
                bg={`${colors.amber}15`}
                border={`1px solid ${colors.amber}40`}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={TbAlertTriangle} boxSize={7} color={colors.amber} />
              </Box>
              <Heading size="md" color="white">Request Unavailable</Heading>
              <Text color="gray.400" fontSize="sm" lineHeight="1.6">{error}</Text>
              <Button
                as="a"
                href="/dashboard/"
                size="sm"
                variant="outline"
                borderColor={colors.cyan}
                color={colors.cyan}
                borderRadius="full"
              >
                Go to Dashboard
              </Button>
            </VStack>
          </Container>
        </Center>
      </Box>
    );
  }

  if (done) {
    return (
      <Box minH="100vh" bg={colors.space}>
        <Center minH="100vh" px={4}>
          <Container maxW="480px">
            <VStack
              spacing={5}
              p={8}
              bg={colors.surface}
              border="1px solid"
              borderColor={done === 'approved' ? `${colors.lime}30` : colors.border}
              borderRadius="2xl"
              textAlign="center"
            >
              <Box
                w="72px"
                h="72px"
                borderRadius="full"
                bg={done === 'approved' ? `${colors.lime}15` : `${colors.red}15`}
                border={done === 'approved' ? `2px solid ${colors.lime}40` : `2px solid ${colors.red}40`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow={done === 'approved' ? `0 0 40px ${colors.lime}30` : 'none'}
              >
                <Icon
                  as={done === 'approved' ? TbCheck : TbX}
                  boxSize={8}
                  color={done === 'approved' ? colors.lime : colors.red}
                />
              </Box>
              <Heading size="md" color="white">
                {done === 'approved' ? 'PIN Sent' : 'Request Denied'}
              </Heading>
              <Text color="gray.400" fontSize="sm" lineHeight="1.6">
                {done === 'approved'
                  ? `The PIN has been emailed to ${request?.client?.name || 'the client'}`
                  : 'The request has been denied and the client will not receive their PIN'}
              </Text>
              <Button
                as="a"
                href="/dashboard/"
                size="sm"
                bg={colors.cyan}
                color="black"
                fontWeight="700"
                borderRadius="full"
              >
                Back to Pulse
              </Button>
            </VStack>
          </Container>
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={colors.space} position="relative">
      <Box
        position="absolute"
        top="-200px"
        left="50%"
        transform="translateX(-50%)"
        w="800px"
        h="800px"
        borderRadius="full"
        bg={`radial-gradient(circle, ${colors.cyan}06 0%, transparent 60%)`}
        pointerEvents="none"
      />

      <Center minH="100vh" px={4} position="relative">
        <Container maxW="520px">
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <VStack spacing={3} textAlign="center">
              <Image src="/neon-burro-email-logo.png" alt="NeonBurro" w="48px" h="48px" borderRadius="full" mx="auto" />
              <HStack spacing={2.5} justify="center">
                <Box w="6px" h="6px" borderRadius="full" bg={colors.amber} boxShadow={`0 0 8px ${colors.amber}`} />
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color={colors.amber}
                  letterSpacing="0.14em"
                  textTransform="uppercase"
                  fontFamily="mono"
                >
                  PIN Request
                </Text>
              </HStack>
              <Heading size="lg" color="white" letterSpacing="-0.02em">
                Review & Approve
              </Heading>
              <Text color="gray.500" fontSize="sm">
                A client is asking for their invoice lookup PIN
              </Text>
            </VStack>

            {/* Request details */}
            <Box
              bg={colors.surface}
              border="1px solid"
              borderColor={colors.border}
              borderRadius="2xl"
              p={6}
            >
              <VStack spacing={4} align="stretch">
                {request?.client ? (
                  <>
                    <Box>
                      <Text color="gray.600" fontSize="2xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={1}>
                        Client
                      </Text>
                      <Text color="white" fontSize="lg" fontWeight="800">
                        {request.client.name}
                      </Text>
                      {request.client.company && (
                        <Text color="gray.500" fontSize="sm">{request.client.company}</Text>
                      )}
                    </Box>

                    <Box>
                      <Text color="gray.600" fontSize="2xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={1}>
                        Email on file
                      </Text>
                      <Text color={colors.cyan} fontSize="sm" fontWeight="600" fontFamily="mono">
                        {request.client.email}
                      </Text>
                    </Box>
                  </>
                ) : (
                  <Box
                    p={4}
                    bg={`${colors.red}08`}
                    border={`1px solid ${colors.red}30`}
                    borderRadius="lg"
                  >
                    <HStack spacing={2} mb={2}>
                      <Icon as={TbAlertTriangle} boxSize={4} color={colors.red} />
                      <Text color={colors.red} fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                        No Client Match
                      </Text>
                    </HStack>
                    <Text color="gray.400" fontSize="xs" lineHeight="1.5">
                      No client record was found for <Text as="span" color="white" fontFamily="mono">{request?.email}</Text>. This might be a mistake or an attempt to probe for valid emails.
                    </Text>
                  </Box>
                )}

                <Box borderTop="1px solid" borderColor={colors.border} pt={3}>
                  <HStack justify="space-between" mb={1}>
                    <Text color="gray.600" fontSize="2xs" fontWeight="600">Requested</Text>
                    <Text color="gray.400" fontSize="xs" fontFamily="mono">
                      {request?.created_at && new Date(request.created_at).toLocaleString()}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.600" fontSize="2xs" fontWeight="600">IP Address</Text>
                    <Text color="gray.600" fontSize="2xs" fontFamily="mono">
                      {request?.request_ip || 'unknown'}
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </Box>

            {/* Safety notice */}
            <HStack
              spacing={3}
              p={4}
              bg={`${colors.amber}06`}
              border={`1px solid ${colors.amber}25`}
              borderRadius="xl"
            >
              <Icon as={TbShield} boxSize={5} color={colors.amber} flexShrink={0} />
              <Text color="gray.400" fontSize="xs" lineHeight="1.5">
                Only approve if you recognize this client. Approving will email their PIN to the address shown above. This link expires in 24 hours.
              </Text>
            </HStack>

            {/* Actions */}
            <HStack spacing={3}>
              <Button
                flex={1}
                size="lg"
                h="56px"
                variant="outline"
                borderColor={colors.border}
                color="gray.400"
                fontWeight="700"
                borderRadius="xl"
                leftIcon={<TbX />}
                onClick={() => handleAction('deny')}
                isLoading={processing}
                _hover={{
                  borderColor: colors.red,
                  color: colors.red,
                  bg: `${colors.red}08`,
                }}
              >
                Deny
              </Button>
              <Button
                flex={2}
                size="lg"
                h="56px"
                bg={colors.cyan}
                color="black"
                fontWeight="800"
                borderRadius="xl"
                leftIcon={<TbCheck />}
                onClick={() => handleAction('approve')}
                isLoading={processing}
                loadingText="Sending..."
                isDisabled={!request?.client}
                _hover={{
                  bg: '#00CCCC',
                  transform: 'translateY(-1px)',
                  boxShadow: `0 16px 40px ${colors.cyan}40`,
                }}
                _disabled={{ opacity: 0.3, cursor: 'not-allowed' }}
              >
                Approve & Send PIN
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Center>
    </Box>
  );
};

export default PinApproval;