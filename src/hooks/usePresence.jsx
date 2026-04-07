// src/hooks/usePresence.jsx
// Tracks current user's online status and provides presence data for all users
//
// - On mount: marks current user as 'online'
// - Heartbeat every 30s while tab is visible
// - On unmount or tab close: marks as 'offline'
// - Polls all-users presence every 30s
// - Returns: { presenceMap, getStatus(userId) }
//
// Status logic:
//   online  = last_seen_at within 60s
//   away    = last_seen_at within 5min
//   offline = older than 5min

import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const PresenceContext = createContext({
  presenceMap: {},
  getStatus: () => 'offline',
});

const ONLINE_THRESHOLD_SEC = 60;
const AWAY_THRESHOLD_SEC = 300;
const HEARTBEAT_INTERVAL_MS = 30000;

const computeStatus = (lastSeenAt) => {
  if (!lastSeenAt) return 'offline';
  const ageSec = (Date.now() - new Date(lastSeenAt).getTime()) / 1000;
  if (ageSec < ONLINE_THRESHOLD_SEC) return 'online';
  if (ageSec < AWAY_THRESHOLD_SEC) return 'away';
  return 'offline';
};

export const PresenceProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [presenceMap, setPresenceMap] = useState({});

  // Heartbeat: update my presence
  const heartbeat = useCallback(async () => {
    if (!user?.id) return;
    try {
      await supabase.rpc('update_presence', { page_path: location.pathname });
    } catch (err) {
      // Silent fail - not critical
    }
  }, [user?.id, location.pathname]);

  // Fetch all presence data
  const fetchAllPresence = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('presence')
        .select('user_id, last_seen_at, current_page');

      const map = {};
      (data || []).forEach((p) => {
        map[p.user_id] = {
          status: computeStatus(p.last_seen_at),
          lastSeenAt: p.last_seen_at,
          currentPage: p.current_page,
        };
      });
      setPresenceMap(map);
    } catch (err) {
      // Silent fail
    }
  }, [user?.id]);

  // Initial heartbeat + fetch + interval
  useEffect(() => {
    if (!user?.id) return;

    heartbeat();
    fetchAllPresence();

    const heartbeatInterval = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    const fetchInterval = setInterval(fetchAllPresence, HEARTBEAT_INTERVAL_MS);

    // Mark offline when tab closes
    const handleBeforeUnload = async () => {
      try {
        await supabase
          .from('presence')
          .update({ status: 'offline', updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } catch {}
    };

    // Heartbeat when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        heartbeat();
        fetchAllPresence();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(fetchInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, heartbeat, fetchAllPresence]);

  // Heartbeat on route change
  useEffect(() => {
    heartbeat();
  }, [location.pathname, heartbeat]);

  const getStatus = useCallback(
    (userId) => presenceMap[userId]?.status || 'offline',
    [presenceMap]
  );

  return (
    <PresenceContext.Provider value={{ presenceMap, getStatus }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  return useContext(PresenceContext);
};