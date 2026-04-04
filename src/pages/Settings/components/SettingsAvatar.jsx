// src/pages/Settings/components/SettingsAvatar.jsx
import { useRef, useState } from 'react';
import {
  Box, Center, Avatar, Icon, useToast,
} from '@chakra-ui/react';
import { TbCamera } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';

const SettingsAvatar = ({ user, profile, setProfile }) => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Avatar must be under 2MB',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
    setUploading(false);
  };

  return (
    <Center>
      <Box position="relative">
        <Avatar
          size="xl"
          name={profile?.display_name || profile?.username || 'NB'}
          src={profile?.avatar_url || ''}
          bg="surface.700"
          color="brand.500"
          border="3px solid"
          borderColor="surface.700"
          cursor="pointer"
          onClick={() => fileInputRef.current?.click()}
          opacity={uploading ? 0.5 : 1}
          transition="all 0.2s"
          _hover={{ borderColor: 'brand.500' }}
        />
        <Center
          position="absolute"
          bottom={0}
          right={0}
          w="28px"
          h="28px"
          borderRadius="full"
          bg="brand.500"
          cursor="pointer"
          onClick={() => fileInputRef.current?.click()}
          transition="all 0.2s"
          _hover={{ bg: 'brand.400', transform: 'scale(1.1)' }}
        >
          <Icon as={TbCamera} boxSize={3.5} color="surface.950" />
        </Center>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </Box>
    </Center>
  );
};

export default SettingsAvatar;