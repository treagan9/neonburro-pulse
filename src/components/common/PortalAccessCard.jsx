// src/components/common/PortalAccessCard.jsx
// Owner-only portal access management for a client
// - Reveal PIN (logged to activity_log)
// - Regenerate PIN (updates both clients.portal_pin + auth.users password)
// - Copy PIN when revealed
// - Shows last login timestamp

import { useState } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Button, useToast, Spinner,
} from '@chakra-ui/react';
import {
  TbEye, TbEyeOff, TbCopy, TbCheck, TbRefresh,
  TbLock, TbAlertTriangle,
} from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

const Row = ({ label, children }) => (
  <HStack
    py={3}
    spacing={4}
    borderBottom="1px solid"
    borderColor="surface.900"
    align="center"
    _last={{ borderBottom: 'none' }}
  >
    <Text
      fontSize="2xs"
      fontWeight="700"
      color="surface.600"
      textTransform="uppercase"
      letterSpacing="0.1em"
      fontFamily="mono"
      minW="90px"
    >
      {label}
    </Text>
    <Box flex={1}>{children}</Box>
  </HStack>
);

const PortalAccessCard = ({ client, onUpdate }) => {
  const toast = useToast();
  const [showPin, setShowPin] = useState(false);
  const [revealedPin, setRevealedPin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmingRegen, setConfirmingRegen] = useState(false);
  const [regenResult, setRegenResult] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!client) return null;

  const username = client.username || client.email?.split('@')[0] || '—';
  const hasPortalAccount = !!client.portal_account_created_at;

  const handleShow = async () => {
    if (showPin) {
      setShowPin(false);
      setRevealedPin(null);
      return;
    }

    setLoading(true);
    try {
      // Log the view to audit trail
      const { error: logError } = await supabase.rpc('log_client_pin_viewed', {
        client_uuid: client.id,
      });
      if (logError) throw logError;

      setRevealedPin(client.portal_pin || '—');
      setShowPin(true);
    } catch (err) {
      toast({
        title: 'Could not reveal PIN',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (pin) => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Select and copy manually',
        status: 'warning',
        duration: 2000,
      });
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('regenerate_client_pin', {
        client_uuid: client.id,
      });
      if (error) throw error;

      setRegenResult(data);
      setConfirmingRegen(false);

      toast({
        title: 'PIN regenerated',
        description: data?.auth_updated
          ? 'Client portal password updated'
          : 'PIN updated (no portal account linked)',
        status: 'success',
        duration: 3000,
      });

      if (onUpdate) onUpdate();
    } catch (err) {
      toast({
        title: 'Regeneration failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const lastLoginText = client.last_login_at
    ? `Last login ${formatDistanceToNow(new Date(client.last_login_at), { addSuffix: true })}`
    : 'Never logged in';

  return (
    <Box>
      <HStack spacing={2} mb={4}>
        <Icon as={TbLock} boxSize={3} color="surface.600" />
        <Text
          fontSize="2xs"
          fontWeight="700"
          color="surface.600"
          textTransform="uppercase"
          letterSpacing="0.1em"
          fontFamily="mono"
        >
          Portal Access
        </Text>
      </HStack>

      {/* Post-regen reveal — shows once, must be copied */}
      {regenResult && (
        <Box
          mb={4}
          p={4}
          bg="rgba(57,255,20,0.04)"
          border="1px solid"
          borderColor="rgba(57,255,20,0.25)"
          borderRadius="md"
        >
          <HStack spacing={2} mb={2}>
            <Icon as={TbCheck} boxSize={3.5} color="accent.neon" />
            <Text
              fontSize="2xs"
              fontWeight="700"
              color="accent.neon"
              textTransform="uppercase"
              letterSpacing="0.1em"
              fontFamily="mono"
            >
              New PIN
            </Text>
          </HStack>
          <Text color="surface.400" fontSize="xs" mb={3} lineHeight="1.5">
            Copy this now. It will not be shown again.
          </Text>
          <HStack spacing={2}>
            <Text
              color="white"
              fontSize="xl"
              fontWeight="800"
              fontFamily="mono"
              letterSpacing="0.15em"
              flex={1}
            >
              {regenResult.pin}
            </Text>
            <Button
              size="xs"
              variant="outline"
              borderColor="accent.neon"
              color="accent.neon"
              borderRadius="md"
              leftIcon={copied ? <TbCheck size={12} /> : <TbCopy size={12} />}
              onClick={() => handleCopy(regenResult.pin)}
              _hover={{ bg: 'rgba(57,255,20,0.08)' }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              size="xs"
              variant="ghost"
              color="surface.500"
              onClick={() => setRegenResult(null)}
              _hover={{ color: 'white' }}
            >
              Done
            </Button>
          </HStack>
        </Box>
      )}

      {/* Regenerate confirmation */}
      {confirmingRegen && (
        <Box
          mb={4}
          p={4}
          bg="rgba(255,51,102,0.04)"
          border="1px solid"
          borderColor="rgba(255,51,102,0.25)"
          borderRadius="md"
        >
          <HStack spacing={2} mb={2}>
            <Icon as={TbAlertTriangle} boxSize={3.5} color="red.400" />
            <Text
              fontSize="2xs"
              fontWeight="700"
              color="red.400"
              textTransform="uppercase"
              letterSpacing="0.1em"
              fontFamily="mono"
            >
              Regenerate PIN
            </Text>
          </HStack>
          <Text color="surface.400" fontSize="xs" mb={3} lineHeight="1.5">
            Old PIN stops working immediately. Client will need the new PIN to log in.
          </Text>
          <HStack spacing={2}>
            <Button
              size="xs"
              bg="red.500"
              color="white"
              fontWeight="700"
              borderRadius="md"
              onClick={handleRegenerate}
              isLoading={loading}
              loadingText="Generating"
              _hover={{ bg: 'red.600' }}
            >
              Yes, Regenerate
            </Button>
            <Button
              size="xs"
              variant="ghost"
              color="surface.500"
              onClick={() => setConfirmingRegen(false)}
              _hover={{ color: 'white' }}
            >
              Cancel
            </Button>
          </HStack>
        </Box>
      )}

      {/* Info rows */}
      <Box borderTop="1px solid" borderColor="surface.900">
        <Row label="Username">
          <Text color="white" fontSize="sm" fontFamily="mono" fontWeight="600">
            {username}
          </Text>
        </Row>

        <Row label="PIN">
          <HStack spacing={2} align="center">
            <Text
              color={showPin ? 'white' : 'surface.600'}
              fontSize="sm"
              fontFamily="mono"
              fontWeight="700"
              letterSpacing="0.15em"
              minW="100px"
            >
              {showPin ? (revealedPin || '—') : '••••••••'}
            </Text>
            <Button
              size="xs"
              variant="ghost"
              color="surface.500"
              leftIcon={loading && !showPin ? <Spinner size="xs" /> : (showPin ? <TbEyeOff size={12} /> : <TbEye size={12} />)}
              onClick={handleShow}
              isDisabled={loading}
              _hover={{ color: 'brand.500' }}
              fontWeight="600"
              fontSize="2xs"
              textTransform="uppercase"
              letterSpacing="0.05em"
            >
              {showPin ? 'Hide' : 'Show'}
            </Button>
            {showPin && revealedPin && revealedPin !== '—' && (
              <Button
                size="xs"
                variant="ghost"
                color="surface.500"
                leftIcon={copied ? <TbCheck size={12} /> : <TbCopy size={12} />}
                onClick={() => handleCopy(revealedPin)}
                _hover={{ color: 'brand.500' }}
                fontWeight="600"
                fontSize="2xs"
                textTransform="uppercase"
                letterSpacing="0.05em"
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
            <Box flex={1} />
            <Button
              size="xs"
              variant="ghost"
              color="surface.500"
              leftIcon={<TbRefresh size={12} />}
              onClick={() => setConfirmingRegen(true)}
              isDisabled={loading || confirmingRegen}
              _hover={{ color: 'accent.banana' }}
              fontWeight="600"
              fontSize="2xs"
              textTransform="uppercase"
              letterSpacing="0.05em"
            >
              Regenerate
            </Button>
          </HStack>
        </Row>

        <Row label="Status">
          <HStack spacing={2}>
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg={hasPortalAccount ? 'accent.neon' : 'surface.600'}
              boxShadow={hasPortalAccount ? '0 0 6px rgba(57,255,20,0.5)' : 'none'}
            />
            <Text color="white" fontSize="sm" fontWeight="600">
              {hasPortalAccount ? 'Active' : 'Not activated'}
            </Text>
            <Text color="surface.600" fontSize="xs" fontFamily="mono">
              · {lastLoginText}
            </Text>
          </HStack>
        </Row>
      </Box>
    </Box>
  );
};

export default PortalAccessCard;
