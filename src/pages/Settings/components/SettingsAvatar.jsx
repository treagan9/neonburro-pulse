// src/pages/Settings/components/SettingsAvatar.jsx
import { useRef, useState } from 'react';
import {
  Box, Center, Icon, useToast, Text, VStack, Spinner,
} from '@chakra-ui/react';
import { TbCamera, TbUpload } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import Avatar from '../../../components/common/Avatar';

const SettingsAvatar = ({ user, profile, setProfile }) => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [hovering, setHovering] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Avatar must be under 5MB',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please use JPG, PNG, WebP, or GIF',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const filePath = `users/${user.id}/avatar.${ext}`;

      // Upload to bucket (upsert overwrites existing)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Get public URL with cache buster
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));

      toast({
        title: 'Avatar updated',
        status: 'success',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Center>
      <VStack spacing={3}>
        <Box
          position="relative"
          cursor="pointer"
          onClick={() => !uploading && fileInputRef.current?.click()}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          transition="all 0.2s"
          _hover={{ transform: 'scale(1.02)' }}
        >
          {/* Glow ring on hover */}
          <Box
            position="absolute"
            inset="-4px"
            borderRadius="full"
            bg="radial-gradient(circle, rgba(0,229,229,0.3), transparent 70%)"
            opacity={hovering ? 1 : 0}
            transition="opacity 0.3s"
            pointerEvents="none"
          />

          <Avatar
            name={profile?.display_name || profile?.username || 'NB'}
            url={profile?.avatar_url}
            size="xl"
            border={true}
            glow={hovering}
          />

          {/* Hover overlay */}
          {hovering && !uploading && (
            <Center
              position="absolute"
              inset={0}
              borderRadius="full"
              bg="blackAlpha.700"
              opacity={hovering ? 1 : 0}
              transition="opacity 0.2s"
            >
              <VStack spacing={1}>
                <Icon as={TbUpload} boxSize={5} color="white" />
                <Text fontSize="2xs" color="white" fontWeight="700" letterSpacing="0.05em">
                  CHANGE
                </Text>
              </VStack>
            </Center>
          )}

          {/* Loading state */}
          {uploading && (
            <Center
              position="absolute"
              inset={0}
              borderRadius="full"
              bg="blackAlpha.700"
            >
              <Spinner size="md" color="brand.500" thickness="2px" />
            </Center>
          )}

          {/* Camera badge */}
          <Center
            position="absolute"
            bottom="2px"
            right="2px"
            w="28px"
            h="28px"
            borderRadius="full"
            bg="brand.500"
            border="3px solid"
            borderColor="surface.950"
            boxShadow="0 0 12px rgba(0,229,229,0.5)"
            transition="all 0.2s"
            _hover={{ bg: 'brand.400', transform: 'scale(1.1)' }}
          >
            <Icon as={TbCamera} boxSize={3.5} color="surface.950" />
          </Center>
        </Box>

        <VStack spacing={0}>
          <Text fontSize="md" fontWeight="700" color="white">
            {profile?.display_name || profile?.username || 'No name set'}
          </Text>
          {profile?.username && (
            <Text fontSize="xs" color="surface.500" fontFamily="mono">
              @{profile.username}
            </Text>
          )}
        </VStack>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </VStack>
    </Center>
  );
};

export default SettingsAvatar;