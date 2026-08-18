// src/pages/Settings/components/SettingsFooter.jsx
// Sign out, and the version line, on Paper.

import { HStack, Text, VStack, Button, useToast } from '@chakra-ui/react';
import { TbLogout } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import colors from '../../../theme/colors';

const P = colors.paper;

const SettingsFooter = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: 'Signed out', status: 'success', duration: 2000 });
      navigate('/login/');
    } catch {
      toast({ title: 'Sign out failed', status: 'error', duration: 2000 });
    }
  };

  return (
    <VStack spacing={4} pt={2}>
      <Button w="100%" h="46px" borderRadius="xl" fontSize="sm" fontWeight="700" leftIcon={<TbLogout size={16} />} bg="transparent" color={P.inkMuted} border="1px solid" borderColor={P.hair} transition="all 0.2s" _hover={{ color: P.coral, borderColor: `${P.coral}66`, bg: `${P.coral}0F` }} onClick={handleSignOut}>
        Sign out
      </Button>
      <HStack justify="space-between" w="100%" pt={4} borderTop="1px solid" borderColor={P.hairSoft}>
        <Text fontSize="2xs" color={P.inkFaint} fontFamily="mono">Neon Burro Pulse</Text>
        <Text fontSize="2xs" color={P.inkFaint} fontFamily="mono">v1.1.0</Text>
      </HStack>
    </VStack>
  );
};

export default SettingsFooter;
