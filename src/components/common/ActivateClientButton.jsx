// src/components/common/ActivateClientButton.jsx
// Triggers send-client-invite Netlify function which:
//   1. Ensures client has a fresh 8-char PIN
//   2. Creates Supabase auth user (email + PIN as password, email pre-confirmed)
//   3. Upserts profile row with role='client'
//   4. Sends branded Resend email with credentials
//   5. Marks client.portal_account_created_at
//
// Shown only when portal_account_created_at is null.
// Disabled during loading. Confirmation modal before firing to prevent mis-clicks.

import { useState, useRef } from 'react';
import {
  Button, Icon, useToast,
  AlertDialog, AlertDialogBody, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  VStack, Text, HStack, Box,
} from '@chakra-ui/react';
import { TbMailForward, TbSparkles } from 'react-icons/tb';

const ActivateClientButton = ({ client, onActivated }) => {
  const toast = useToast();
  const cancelRef = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!client) return null;

  const handleActivate = async () => {
    if (!client.email) {
      toast({
        title: 'Client has no email on file',
        description: 'Add an email to the client before activating.',
        status: 'warning',
        duration: 4000,
      });
      setIsOpen(false);
      return;
    }

    if (!client.username) {
      toast({
        title: 'Client has no username',
        description: 'Set a username on the client before activating.',
        status: 'warning',
        duration: 4000,
      });
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/send-client-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Activation failed');
      }

      toast({
        title: 'Portal activated',
        description: `Welcome email sent to ${client.email}`,
        status: 'success',
        duration: 5000,
      });

      setIsOpen(false);
      if (onActivated) onActivated();
    } catch (err) {
      console.error('[ActivateClientButton] failed', err);
      toast({
        title: 'Could not activate',
        description: err.message,
        status: 'error',
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        borderColor="accent.neon"
        color="accent.neon"
        fontWeight="700"
        borderRadius="full"
        leftIcon={<Icon as={TbSparkles} boxSize={3.5} />}
        onClick={() => setIsOpen(true)}
        _hover={{
          bg: 'rgba(57, 255, 20, 0.08)',
          transform: 'translateY(-1px)',
        }}
        transition="all 0.15s"
      >
        Activate portal
      </Button>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => !loading && setIsOpen(false)}
        isCentered
        motionPreset="slideInBottom"
      >
        <AlertDialogOverlay bg="blackAlpha.800" backdropFilter="blur(8px)">
          <AlertDialogContent
            bg="surface.900"
            border="1px solid"
            borderColor="surface.800"
            borderRadius="lg"
            maxW="440px"
          >
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="800"
              color="white"
              pb={2}
            >
              Activate portal for {client.name}?
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack align="stretch" spacing={4}>
                <Text color="surface.400" fontSize="sm" lineHeight="1.6">
                  This will create their sign-in account and send them a
                  welcome email with their username and PIN.
                </Text>

                <Box
                  bg="surface.950"
                  borderRadius="md"
                  p={3}
                  border="1px solid"
                  borderColor="surface.800"
                >
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between">
                      <Text
                        fontSize="2xs"
                        fontFamily="mono"
                        fontWeight="700"
                        color="surface.500"
                        textTransform="uppercase"
                        letterSpacing="0.1em"
                      >
                        Email
                      </Text>
                      <Text
                        fontSize="xs"
                        color="brand.500"
                        fontWeight="600"
                        fontFamily="mono"
                      >
                        {client.email}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text
                        fontSize="2xs"
                        fontFamily="mono"
                        fontWeight="700"
                        color="surface.500"
                        textTransform="uppercase"
                        letterSpacing="0.1em"
                      >
                        Username
                      </Text>
                      <Text
                        fontSize="xs"
                        color="white"
                        fontWeight="600"
                        fontFamily="mono"
                      >
                        {client.username || '—'}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                <Text color="surface.500" fontSize="xs">
                  Safe to run again. If they already have a portal account,
                  the email will just be resent with their current PIN.
                </Text>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter gap={2}>
              <Button
                ref={cancelRef}
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                isDisabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleActivate}
                bg="accent.neon"
                color="surface.950"
                size="sm"
                borderRadius="full"
                fontWeight="800"
                leftIcon={<Icon as={TbMailForward} boxSize={3.5} />}
                isLoading={loading}
                loadingText="Activating"
                _hover={{ bg: '#50FF30' }}
              >
                Send welcome email
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default ActivateClientButton;
