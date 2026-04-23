// src/components/common/ImpersonateButton.jsx
// "View as Client" button + confirmation dialog.
// Opens an admin-minted impersonation session and launches it in a new tab
// at neonburro.com/account/?impersonate=<token>.
//
// Shows detailed error codes from the server to make debugging painless.

import { useRef, useState } from 'react';
import {
  Box, Button, HStack, Icon, Text, useToast,
  AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
} from '@chakra-ui/react';
import { TbEye, TbExternalLink } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';

const IMPERSONATE_ENDPOINT =
  'https://pulse.neonburro.com/.netlify/functions/impersonate-client';

const ImpersonateButton = ({ client, size = 'xs' }) => {
  const toast = useToast();
  const cancelRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!client?.id) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Your session expired. Please sign in again.');
      }

      const res = await fetch(IMPERSONATE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          client_id: client.id,
          duration_minutes: 30,
        }),
      });

      const data = await res.json();

      // Log everything to console so Tyler can see what the server returned
      if (!res.ok) {
        console.group('%c[ImpersonateButton] Request failed', 'color:#FF3366;font-weight:bold');
        console.log('HTTP status:', res.status);
        console.log('Error code:', data.code);
        console.log('Error message:', data.error);
        if (data.debug) console.log('Debug payload:', data.debug);
        console.log('Full response:', data);
        console.groupEnd();

        // Build a useful description that includes the code
        const description = data.code
          ? `${data.error} [${data.code}]`
          : data.error;

        throw new Error(description || 'Could not start session');
      }

      const opened = window.open(data.redirect_url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        await navigator.clipboard.writeText(data.redirect_url).catch(() => {});
        toast({
          title: 'Popup blocked',
          description: 'URL copied to clipboard. Paste it in a new tab.',
          status: 'warning',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Session started',
          description: `Viewing as ${client.name} \u00b7 30 min`,
          status: 'success',
          duration: 2500,
        });
      }

      setIsOpen(false);
    } catch (err) {
      toast({
        title: 'Could not start session',
        description: err.message,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        size={size}
        variant="outline"
        borderColor="surface.800"
        color="surface.400"
        borderRadius="lg"
        leftIcon={<Icon as={TbEye} boxSize={3} />}
        onClick={() => setIsOpen(true)}
        _hover={{ borderColor: 'brand.500', color: 'brand.500' }}
        transition="all 0.15s"
      >
        View as Client
      </Button>

      <AlertDialog
        isOpen={isOpen}
        onClose={() => !isLoading && setIsOpen(false)}
        leastDestructiveRef={cancelRef}
        isCentered
        motionPreset="none"
      >
        <AlertDialogOverlay bg="blackAlpha.800" backdropFilter="blur(4px)">
          <AlertDialogContent
            bg="surface.950"
            border="1px solid"
            borderColor="surface.800"
            borderRadius="xl"
            maxW="420px"
            mx={4}
          >
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="800"
              color="white"
              letterSpacing="-0.01em"
              borderBottom="1px solid"
              borderColor="surface.900"
              py={4}
            >
              View as {client.name}?
            </AlertDialogHeader>

            <AlertDialogBody py={5}>
              <Text color="surface.400" fontSize="sm" lineHeight="1.7" mb={4}>
                You will see the client portal exactly as {client.name.split(' ')[0]} sees it.
                Fully read-only. Session lasts 30 minutes and is logged automatically.
              </Text>

              <HStack
                spacing={2}
                py={2.5}
                px={3}
                bg="rgba(0,229,229,0.04)"
                border="1px solid"
                borderColor="rgba(0,229,229,0.2)"
                borderRadius="md"
              >
                <Icon as={TbExternalLink} boxSize={3.5} color="brand.500" />
                <Text
                  fontSize="2xs"
                  color="surface.400"
                  fontFamily="mono"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  fontWeight="700"
                >
                  Opens in a new tab
                </Text>
              </HStack>
            </AlertDialogBody>

            <AlertDialogFooter
              borderTop="1px solid"
              borderColor="surface.900"
              py={4}
              gap={2}
            >
              <Button
                ref={cancelRef}
                variant="ghost"
                color="surface.400"
                size="sm"
                borderRadius="full"
                onClick={() => setIsOpen(false)}
                isDisabled={isLoading}
                _hover={{ color: 'white', bg: 'surface.900' }}
              >
                Cancel
              </Button>
              <Button
                bg="brand.500"
                color="surface.950"
                fontWeight="800"
                size="sm"
                borderRadius="full"
                leftIcon={<Icon as={TbEye} boxSize={3.5} />}
                onClick={handleConfirm}
                isLoading={isLoading}
                loadingText="Starting"
                _hover={{ bg: 'brand.400', transform: 'translateY(-1px)' }}
                transition="all 0.15s"
              >
                View as Client
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default ImpersonateButton;
