// netlify/functions/keep-alive.js
// Pings Supabase every 5 days to prevent free-tier pausing
// Netlify scheduled function using cron syntax

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async () => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    console.log(`[keep-alive] Supabase pinged successfully. Profiles: ${count}`);

    return new Response(
      JSON.stringify({ status: 'alive', profiles: count, timestamp: new Date().toISOString() }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[keep-alive] Supabase ping failed:', err.message);

    return new Response(
      JSON.stringify({ status: 'error', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config = {
  schedule: '0 8 */5 * *',
};