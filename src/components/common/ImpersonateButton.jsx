// src/components/common/ImpersonateButton.jsx
// View as Client. Mints a read-only impersonation session and opens the portal
// in a new tab. Paper styled, confirm dialog before firing, detailed server
// error codes logged to the console. No oxford commas, no dashes.

import { useRef, useState } from 'react';
import {
  Box, Button, HStack, Icon, Text, useToast,
  AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
} from '@chakra-ui/react';
import { TbEye, TbExternalLink } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';

const P = colors.paper;
const IMPERSONATE_ENDPOINT = 'https://pulse.neonburro.com/.netlify/functions/impersonate-client';

const ImpersonateButton = ({ client, size = 'sm' }) => {
  const toast = useToast();
  const cancelRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!client?.id) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error('Your session expired. Please sign in again.');

      const res = await fetch(IMPERSONATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ client_id: client.id, duration_minutes: 30 }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.group('%c[ImpersonateButton] Request failed', 'color:#C2402F;font-weight:bold');
        console.log('HTTP status:', res.status);
        console.log('Error code:', data.code);
        console.log('Error message:', data.error);
        if (data.debug) console.log('Debug payload:', data.debug);
        console.log('Full response:', data);
        console.groupEnd();
        const description = data.code ? `${data.error} [${data.code}]` : data.error;
        throw new Error(description || 'Could not start session');
      }

      const opened = window.open(data.redirect_url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        await navigator.clipboard.writeText(data.redirect_url).catch(() => {});
        toast({ title: 'Popup blocked', description: 'URL copied to clipboard. Paste it in a new tab.', status: 'warning', duration: 5000 });
      } else {
        toast({ title: 'Session started', description: `Viewing as ${client.name} · 30 min`, status: 'success', duration: 2500 });
      }
      setIsOpen(false);
    } catch (err) {
      toast({ title: 'Could not start session', description: err.message, status: 'error', duration: 8000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button size={size} variant="outline" borderColor={P.hair} color={P.inkSec} fontWeight="600" borderRadius="full" leftIcon={<Icon as={TbEye} boxSize={3} />} onClick={() => setIsOpen(true)} _hover={{ borderColor: P.inkFaint, color: P.ink, bg: P.sheet }} transition="all 0.15s">
        View as client
      </Button>

      <AlertDialog isOpen={isOpen} onClose={() => !isLoading && setIsOpen(false)} leastDestructiveRef={cancelRef} isCentered motionPreset="none">
        <AlertDialogOverlay bg="rgba(23,17,12,0.6)" backdropFilter="blur(4px)">
          <AlertDialogContent bg={P.sheet} border="1px solid" borderColor={P.hair} borderRadius="16px" maxW="420px" mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="700" color={P.ink} letterSpacing="-0.01em" borderBottom="1px solid" borderColor={P.hairSoft} py={4}>View as {client.name}?</AlertDialogHeader>
            <AlertDialogBody py={5}>
              <Text color={P.inkSec} fontSize="sm" lineHeight="1.7" mb={4}>
                You will see the client portal exactly as {client.name.split(' ')[0]} sees it. Fully read-only. The session lasts 30 minutes and is logged automatically.
              </Text>
              <HStack spacing={2} py={2.5} px={3} bg={`${P.lime}18`} border="1px solid" borderColor={`${P.lime}44`} borderRadius="12px">
                <Icon as={TbExternalLink} boxSize={3.5} color={P.limeDeep} />
                <Text fontSize="2xs" color={P.inkMuted} fontFamily="mono" textTransform="uppercase" letterSpacing="0.05em" fontWeight="700">Opens in a new tab</Text>
              </HStack>
            </AlertDialogBody>
            <AlertDialogFooter borderTop="1px solid" borderColor={P.hairSoft} py={4} gap={2}>
              <Button ref={cancelRef} variant="ghost" color={P.inkMuted} size="sm" borderRadius="full" onClick={() => setIsOpen(false)} isDisabled={isLoading} _hover={{ color: P.ink, bg: P.sunken }}>Cancel</Button>
              <Button bg={P.lime} color={P.limeInk} fontWeight="700" size="sm" borderRadius="full" leftIcon={<Icon as={TbEye} boxSize={3.5} />} onClick={handleConfirm} isLoading={isLoading} loadingText="Starting" _hover={{ bg: '#D2E26B', transform: 'translateY(-1px)' }} transition="all 0.15s">View as client</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default ImpersonateButton;
