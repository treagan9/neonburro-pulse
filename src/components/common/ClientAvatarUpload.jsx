// src/components/common/ClientAvatarUpload.jsx
// Reusable avatar with click-to-upload (admin only)
// Falls back to colored initials when no avatar_url is set
//
// Props:
//   clientId      - uuid of client (required)
//   clientName    - string (for initials fallback + color hash)
//   avatarUrl     - current URL from clients.avatar_url (null/string)
//   size          - pixel size, defaults 72
//   onChange      - callback(newUrl) - fired after successful upload/delete
//   canEdit       - bool, defaults true (checks profile.role === 'owner')
//
// Behavior:
//   - If canEdit && current user is owner: avatar is clickable
//   - Click opens hidden file input -> validates -> uploads to Supabase Storage
//   - Path: avatars/clients/{clientId}.{ext}
//   - Cache-busts URL with ?v={timestamp} so updates show instantly
//   - Hover shows camera icon overlay
//   - Right-click / long-press reveals delete option

import { useState, useRef } from 'react';
import {
  Box, Text, Image, Icon, Menu, MenuButton, MenuList, MenuItem,
  Spinner, useToast,
} from '@chakra-ui/react';
import { TbCamera, TbTrash, TbUpload } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { getInitials, getAvatarColor } from '../../utils/phone';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
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
  const { profile } = useAuth();

  const isOwner = profile?.role === 'owner';
  const editable = canEdit && isOwner && !!clientId;

  const initials = getInitials(clientName);
  const avatarColor = getAvatarColor(clientName);

  // Cache bust so newly uploaded images show immediately
  const displayUrl = avatarUrl ? `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}v=${Date.now()}` : null;

  const handleFilePick = () => {
    if (!editable || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-picked after error
    e.target.value = '';

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Use JPG, PNG, or WebP',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `Max 2MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setUploading(true);
    try {
      // Build path: clients/{clientId}.{ext}
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `clients/${clientId}.${ext}`;

      // Upload with upsert so replacing works
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      // Save URL to clients table
      const { error: updateError } = await supabase
        .from('clients')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', clientId);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from('activity_log').insert({
        action: 'client_avatar_updated',
        entity_type: 'client',
        entity_id: clientId,
        client_id: clientId,
        category: 'admin',
        metadata: { client_name: clientName },
        created_at: new Date().toISOString(),
      });

      toast({
        title: 'Avatar updated',
        status: 'success',
        duration: 1500,
      });

      if (onChange) onChange(publicUrl);
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast({
        title: 'Upload failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!editable || uploading) return;
    setUploading(true);
    try {
      // Try to delete storage objects (both extensions in case we've uploaded multiple formats)
      await supabase.storage
        .from('avatars')
        .remove([
          `clients/${clientId}.jpg`,
          `clients/${clientId}.png`,
          `clients/${clientId}.webp`,
        ]);

      // Clear from clients table
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

      toast({
        title: 'Avatar removed',
        status: 'success',
        duration: 1500,
      });

      if (onChange) onChange(null);
    } catch (err) {
      toast({
        title: 'Remove failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setUploading(false);
    }
  };

  // Fontsize scales with avatar size
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
            <Text
              color="surface.950"
              fontSize={fontSize}
              fontWeight="800"
              letterSpacing="-0.02em"
            >
              {initials}
            </Text>
          }
        />
      ) : (
        <Text
          color="surface.950"
          fontSize={fontSize}
          fontWeight="800"
          letterSpacing="-0.02em"
        >
          {initials}
        </Text>
      )}

      {/* Hover overlay - camera icon */}
      {editable && hovered && !uploading && (
        <Box
          position="absolute"
          inset={0}
          bg="blackAlpha.700"
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="opacity 0.15s"
        >
          <Icon as={TbCamera} boxSize={size / 4} color="white" />
        </Box>
      )}

      {/* Uploading state */}
      {uploading && (
        <Box
          position="absolute"
          inset={0}
          bg="blackAlpha.800"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="sm" color="brand.500" thickness="2px" />
        </Box>
      )}
    </Box>
  );

  // Non-editable: just the avatar, no wrappers
  if (!editable) return avatarContent;

  // Editable: wrap in menu for right-click remove + left-click upload
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      <Menu placement="bottom-start">
        {({ onClose }) => (
          <>
            {avatarUrl ? (
              // Has avatar - show menu with options
              <>
                <MenuButton
                  as={Box}
                  onClick={(e) => {
                    // Left click triggers file picker directly
                    e.stopPropagation();
                    handleFilePick();
                  }}
                  onContextMenu={(e) => {
                    // Right click opens menu instead
                    e.preventDefault();
                  }}
                >
                  {avatarContent}
                </MenuButton>
                <MenuList bg="surface.900" borderColor="surface.700" py={1} minW="160px">
                  <MenuItem
                    bg="transparent"
                    _hover={{ bg: 'surface.800' }}
                    icon={<TbUpload />}
                    fontSize="sm"
                    color="surface.300"
                    onClick={handleFilePick}
                  >
                    Upload new
                  </MenuItem>
                  <MenuItem
                    bg="transparent"
                    _hover={{ bg: 'surface.800' }}
                    icon={<TbTrash />}
                    fontSize="sm"
                    color="red.300"
                    onClick={handleRemove}
                  >
                    Remove
                  </MenuItem>
                </MenuList>
              </>
            ) : (
              // No avatar yet - click goes straight to file picker
              <Box onClick={handleFilePick}>{avatarContent}</Box>
            )}
          </>
        )}
      </Menu>
    </>
  );
};

export default ClientAvatarUpload;
