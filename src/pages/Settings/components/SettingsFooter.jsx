// src/pages/Settings/components/SettingsFooter.jsx
import { HStack, Text, Box, VStack, Button, Icon, useToast } from '@chakra-ui/react';
import { TbLogout } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

const SettingsFooter = ({ user }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: 'Signed out', status: 'success', duration: 2000 });
      navigate('/login/');
    } catch (err) {
      toast({ title: 'Sign out failed', status: 'error', duration: 2000 });
    }
  };

  return (
    <VStack spacing={4} pt={2}>
      <Button
        w="100%"
        h="44px"
        borderRadius="xl"
        fontSize="sm"
        fontWeight="700"
        leftIcon={<TbLogout size={16} />}
        bg="transparent"
        color="surface.500"
        border="1px solid"
        borderColor="surface.800"
        transition="all 0.2s"
        _hover={{
          color: 'red.400',
          borderColor: 'red.500',
          bg: 'rgba(255,51,102,0.05)',
        }}
        onClick={handleSignOut}
      >
        Sign Out
      </Button>

      <HStack
        justify="space-between"
        w="100%"
        pt={4}
        borderTop="1px solid"
        borderColor="surface.850"
      >
        <Text fontSize="2xs" color="surface.700" fontFamily="mono">
          NeonBurro Pulse
        </Text>
        <Text fontSize="2xs" color="surface.700" fontFamily="mono">
          v1.1.0
        </Text>
      </HStack>
    </VStack>
  );
};

export default SettingsFooter;