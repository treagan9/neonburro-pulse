// src/pages/Dashboard/components/TeamOnlineStrip.jsx
// ============================================
// TEAM ONLINE STRIP (Pulse version)
// - Shows only team members currently online (via usePresence)
// - Hidden when nobody is online
// - Small naked avatars with green presence dot
// - Click avatar navigates to /projects/?assigned={id}
// - No container, naked inline
// ============================================

import { useState, useEffect } from 'react';
import { HStack, Tooltip, Box } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { usePresence } from '../../../hooks/usePresence';
import Avatar from '../../../components/common/Avatar';

const TeamOnlineStrip = () => {
  const navigate = useNavigate();
  const { presenceMap } = usePresence();
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, role')
        .in('role', ['owner', 'admin', 'team'])
        .order('display_name');
      if (data) setProfiles(data);
    };
    fetchProfiles();
  }, []);

  // Filter to only online members using presenceMap from the hook
  const onlineMembers = profiles.filter((p) => presenceMap[p.id]?.status === 'online');

  if (onlineMembers.length === 0) return null;

  return (
    <HStack spacing={2}>
      {onlineMembers.map((member) => (
        <Tooltip
          key={member.id}
          label={member.display_name || member.username || 'Team member'}
          placement="bottom"
          hasArrow
          bg="surface.800"
          color="white"
          fontSize="xs"
          openDelay={300}
        >
          <Box
            cursor="pointer"
            onClick={() => navigate(`/projects/?assigned=${member.id}`)}
            transition="all 0.15s"
            _hover={{ transform: 'translateY(-1px)' }}
          >
            <Avatar
              name={member.display_name || member.username || 'Team'}
              url={member.avatar_url}
              size="xs"
              presence="online"
            />
          </Box>
        </Tooltip>
      ))}
    </HStack>
  );
};

export default TeamOnlineStrip;