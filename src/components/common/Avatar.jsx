// src/components/common/Avatar.jsx
// Reusable avatar component for users (admin/staff) and clients
// Shows uploaded image OR initials fallback
// Optional presence dot for online status
//
// Usage:
//   <Avatar name={user.display_name} url={user.avatar_url} size="md" />
//   <Avatar name={client.name} url={client.avatar_url} size="lg" presence="online" />

import { Box, Image, Text } from '@chakra-ui/react';
import { getInitials, getAvatarColor } from '../../utils/phone';

const SIZE_MAP = {
  xs: { box: '24px', text: '2xs', dot: '6px', dotPos: '0px', border: '1px' },
  sm: { box: '32px', text: 'xs',  dot: '8px', dotPos: '0px', border: '2px' },
  md: { box: '40px', text: 'sm',  dot: '10px', dotPos: '1px', border: '2px' },
  lg: { box: '56px', text: 'lg',  dot: '12px', dotPos: '2px', border: '2px' },
  xl: { box: '80px', text: '2xl', dot: '16px', dotPos: '3px', border: '3px' },
};

const PRESENCE_COLORS = {
  online: '#39FF14',
  away:   '#FFE500',
  offline: '#525252',
};

const Avatar = ({
  name = '',
  url = null,
  size = 'md',
  presence = null,
  shape = 'circle',
  border = true,
  glow = false,
  onClick = null,
}) => {
  const sizes = SIZE_MAP[size] || SIZE_MAP.md;
  const initials = getInitials(name);
  const color = getAvatarColor(name);
  const hasImage = url && url.length > 0;
  const radius = shape === 'square' ? 'lg' : 'full';

  return (
    <Box
      position="relative"
      display="inline-block"
      flexShrink={0}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      transition="all 0.2s"
      _hover={onClick ? { transform: 'scale(1.05)' } : {}}
    >
      <Box
        w={sizes.box}
        h={sizes.box}
        borderRadius={radius}
        bg={hasImage ? 'transparent' : color}
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        border={border ? `${sizes.border} solid` : 'none'}
        borderColor={hasImage ? 'rgba(255,255,255,0.1)' : `${color}40`}
        boxShadow={glow ? `0 0 20px ${color}25` : 'none'}
        position="relative"
      >
        {hasImage ? (
          <Image
            src={url}
            alt={name}
            w="100%"
            h="100%"
            objectFit="cover"
            fallback={
              <Box
                w="100%"
                h="100%"
                bg={color}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text
                  color="surface.950"
                  fontSize={sizes.text}
                  fontWeight="800"
                  letterSpacing="-0.02em"
                >
                  {initials}
                </Text>
              </Box>
            }
          />
        ) : (
          <Text
            color="surface.950"
            fontSize={sizes.text}
            fontWeight="800"
            letterSpacing="-0.02em"
          >
            {initials}
          </Text>
        )}
      </Box>

      {/* Presence dot */}
      {presence && (
        <Box
          position="absolute"
          bottom={sizes.dotPos}
          right={sizes.dotPos}
          w={sizes.dot}
          h={sizes.dot}
          borderRadius="full"
          bg={PRESENCE_COLORS[presence] || PRESENCE_COLORS.offline}
          border="2px solid"
          borderColor="surface.950"
          boxShadow={presence === 'online' ? `0 0 8px ${PRESENCE_COLORS.online}80` : 'none'}
          sx={presence === 'online' ? {
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.7 },
            },
          } : {}}
        />
      )}
    </Box>
  );
};

export default Avatar;