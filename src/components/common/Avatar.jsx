// src/components/common/Avatar.jsx
// One avatar for people, on Paper. Shows the exact image someone uploaded, no
// dark plate behind it, and the ring carries presence: lime when they are online
// (so a glance at the team tells you who is here), gold when away, a quiet cream
// hair when offline or when no presence is passed (client avatars in a list, so
// lime is not sprayed everywhere). The initials fallback is ink on cream, never a
// black tile.
//
// Usage:
//   <Avatar name={user.display_name} url={user.avatar_url} size="md" presence="online" />
//   <Avatar name={client.name} url={client.avatar_url} size="lg" />
// No oxford commas, no em dashes.

import { Box, Image, Text } from '@chakra-ui/react';
import { getInitials } from '../../utils/phone';
import colors from '../../theme/colors';

const P = colors.paper;

const SIZE_MAP = {
  xs: { box: '24px', text: '2xs', dot: '7px',  dotPos: '-1px', border: '2px' },
  sm: { box: '32px', text: 'xs',  dot: '9px',  dotPos: '-1px', border: '2px' },
  md: { box: '40px', text: 'sm',  dot: '11px', dotPos: '0px',  border: '2px' },
  lg: { box: '56px', text: 'lg',  dot: '13px', dotPos: '1px',  border: '2px' },
  xl: { box: '80px', text: '2xl', dot: '16px', dotPos: '3px',  border: '3px' },
};

// The ring and the dot both read presence. Lime is the online signal.
const RING = { online: P.lime, away: P.gold, offline: P.hair };
const DOT = { online: P.lime, away: P.gold, offline: P.inkFaint };

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
  const hasImage = url && url.length > 0;
  const radius = shape === 'square' ? 'lg' : 'full';
  const ring = presence ? RING[presence] || P.hair : P.hair;

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
        bg={hasImage ? P.sheet : P.sunken}
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        border={border ? `${sizes.border} solid` : 'none'}
        borderColor={ring}
        boxShadow={glow || presence === 'online' ? `0 0 0 3px ${P.lime}22` : 'none'}
        transition="border-color 0.2s, box-shadow 0.2s"
      >
        {hasImage ? (
          <Image
            src={url}
            alt={name}
            w="100%"
            h="100%"
            objectFit="cover"
            fallback={
              <Box w="100%" h="100%" bg={P.sunken} display="flex" alignItems="center" justifyContent="center">
                <Text color={P.inkSec} fontSize={sizes.text} fontWeight="800" letterSpacing="-0.02em">{initials}</Text>
              </Box>
            }
          />
        ) : (
          <Text color={P.inkSec} fontSize={sizes.text} fontWeight="800" letterSpacing="-0.02em">{initials}</Text>
        )}
      </Box>

      {presence && (
        <Box
          position="absolute"
          bottom={sizes.dotPos}
          right={sizes.dotPos}
          w={sizes.dot}
          h={sizes.dot}
          borderRadius="full"
          bg={DOT[presence] || DOT.offline}
          border="2px solid"
          borderColor={P.mat}
          boxShadow={presence === 'online' ? `0 0 8px ${P.lime}99` : 'none'}
          sx={presence === 'online' ? {
            animation: 'nbAvatarPulse 2.2s ease-in-out infinite',
            '@keyframes nbAvatarPulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.65 },
            },
          } : {}}
        />
      )}
    </Box>
  );
};

export default Avatar;
