// src/components/common/ClientAvatarUpload.jsx
// Reusable avatar with click-to-upload
// RLS policies on storage.objects enforce that only owners can write to avatars/clients/*
// Frontend doesn't gate - if a non-owner tries to upload, Supabase rejects it

import { useState, useRef } from 'react';
import {
  Box, Text, Image, Icon, Menu, MenuButton, MenuList, MenuItem,
  Spinner, useToast,
} from '@chakra-ui/react';
import { TbCamera, TbTrash, TbUpload } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { getInitials, getAvatarColor } from '../../utils/phone';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ClientAvatarUpload = ({
  clientId,
  clientName,
  avatarUrl,
  size = 72,
  onChange,
  canEdit = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const editable = canEdit && !!clientId;

  const initials = getInitials(clientName);
  const avatarColor = getAvatarColor(clientName);

  const displayUrl = avatarUrl ? `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}v=${Date.now()}` : null;

  const handleFilePick = () => {
    if (!editable || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Use JPG, PNG, or WebP', status: 'warning', duration: 3000 });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: `Max 2MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`, status: 'warning', duration: 3000 });
      return;
    }

    setUploading(true);
    try {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `clients/${clientId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('clients')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', clientId);
      if (updateError) throw updateError;

      await supabase.from('activity_log').insert({
        action: 'client_avatar_updated',
        entity_type: 'client',
        entity_id: clientId,
        client_id: clientId,
        category: 'admin',
        metadata: { client_name: clientName },
        created_at: new Date().toISOString(),
      });

      toast({ title: 'Avatar updated', status: 'success', duration: 1500 });
      if (onChange) onChange(publicUrl);
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast({ title: 'Upload failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!editable || uploading) return;
    setUploading(true);
    try {
      await supabase.storage.from('avatars').remove([
        `clients/${clientId}.jpg`,
        `clients/${clientId}.png`,
        `clients/${clientId}.webp`,
      ]);

      const { error: updateError } = await supabase
        .from('clients')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', clientId);
      if (updateError) throw updateError;

      await supabase.from('activity_log').insert({
        action: 'client_avatar_removed',
        entity_type: 'client',
        entity_id: clientId,
        client_id: clientId,
        category: 'admin',
        metadata: { client_name: clientName },
        created_at: new Date().toISOString(),
      });

      toast({ title: 'Avatar removed', status: 'success', duration: 1500 });
      if (onChange) onChange(null);
    } catch (err) {
      toast({ title: 'Remove failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setUploading(false);
    }
  };

  const fontSize = size >= 64 ? 'xl' : size >= 48 ? 'md' : 'xs';

  const avatarContent = (
    <Box
      position="relative"
      w={`${size}px`}
      h={`${size}px`}
      borderRadius="full"
      overflow="hidden"
      flexShrink={0}
      cursor={editable ? 'pointer' : 'default'}
      bg={displayUrl ? 'surface.900' : avatarColor}
      display="flex"
      alignItems="center"
      justifyContent="center"
      transition="all 0.2s"
      boxShadow={`0 0 ${size / 2}px ${avatarColor}25`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      _hover={editable ? { boxShadow: `0 0 ${size / 2}px ${avatarColor}45` } : {}}
    >
      {displayUrl ? (
        <Image
          src={displayUrl}
          alt={clientName}
          w="100%"
          h="100%"
          objectFit="cover"
          fallback={
            <Text color="surface.950" fontSize={fontSize} fontWeight="800" letterSpacing="-0.02em">
              {initials}
            </Text>
          }
        />
      ) : (
        <Text color="surface.950" fontSize={fontSize} fontWeight="800" letterSpacing="-0.02em">
          {initials}
        </Text>
      )}

      {editable && hovered && !uploading && (
        <Box position="absolute" inset={0} bg="blackAlpha.700" display="flex" alignItems="center" justifyContent="center">
          <Icon as={TbCamera} boxSize={size / 4} color="white" />
        </Box>
      )}

      {uploading && (
        <Box position="absolute" inset={0} bg="blackAlpha.800" display="flex" alignItems="center" justifyContent="center">
          <Spinner size="sm" color="brand.500" thickness="2px" />
        </Box>
      )}
    </Box>
  );

  if (!editable) return avatarContent;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      {avatarUrl ? (
        <Menu placement="bottom-start">
          <MenuButton
            as={Box}
            onClick={(e) => {
              e.stopPropagation();
              handleFilePick();
            }}
          >
            {avatarContent}
          </MenuButton>
          <MenuList bg="surface.900" borderColor="surface.700" py={1} minW="160px">
            <MenuItem bg="transparent" _hover={{ bg: 'surface.800' }} icon={<TbUpload />} fontSize="sm" color="surface.300" onClick={handleFilePick}>
              Upload new
            </MenuItem>
            <MenuItem bg="transparent" _hover={{ bg: 'surface.800' }} icon={<TbTrash />} fontSize="sm" color="red.300" onClick={handleRemove}>
              Remove
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <Box onClick={handleFilePick}>{avatarContent}</Box>
      )}
    </>
  );
};

export default ClientAvatarUpload;
