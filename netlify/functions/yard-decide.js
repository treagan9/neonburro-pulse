// netlify/functions/yard-decide.js
// SENTINEL: NB_PULSE_YARD_DECIDE_V1
//
// The yard from the back office. The public page at
// neonburro.com/send-a-burro/ has a hidden owner mode guarded by a shared
// key, built for moderating from a phone in a parking lot. This is the same
// hand behind a Pulse login instead, no secret taps, no shared key, the
// session and a staff role are the door.
//
// Actions, all POST:
//   list      every entry with the wallet truncated, plus the dials and the
//             size of the private wallet book
//   pasture   X an entry, random canon verdict, spot freed
//   remove    the not-jokes rule, gone from every public surface, no verdict
//   approve   pen or pasture to the ramp, lowest free spot, two tries on the
//             unique constraint because a parallel submit can race it
//   dial      flip gate_open or auto_ramp without a deploy
//
// ── THE VERDICTS ARE A COPY ─────────────────────────────────────────────────
// The canon list lives twice, here and in the studio's
// netlify/functions/send-a-burro-decide.js. Different repos share no module,
// so the duplication is documented instead, same policy as the layout
// tokens. Change a verdict in both files in the same sitting.
//
// ── WALLETS STAY TRUNCATED ──────────────────────────────────────────────────
// The base table holds full addresses and this function reads it with the
// service role. What leaves for the browser is first four dot dot dot last
// four, enough to tell entries apart, never enough to reconstruct the book.
// The full book stays server side on purpose.
//
// No oxford commas, no em dashes.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supa = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const VERDICTS = [
  ['lint', 'Not square.'],
  ['cypher', 'No. Final.'],
  ['kolache', 'That is not on the menu.'],
  ['epoch', 'Wrong era.'],
  ['tender', 'It has no hands.'],
  ['anvil', 'Too soft.'],
  ['chisel', 'Too much left on it.'],
  ['sift', 'Nothing came through.'],
  ['scour', 'Still dirty.'],
  ['tally', 'Does not add up.'],
  ['latch', 'Will not hold.'],
  ['git', 'Reverted.'],
  ['gauge', 'Reads low.'],
  ['hitch', 'Does not connect.'],
  ['rook', 'Predictable.'],
  ['nudge', 'Almost.'],
];

const DIALS_ALLOWED = ['gate_open', 'auto_ramp'];

const trunc = (w) => {
  const s = String(w || '');
  return s.length > 10 ? `${s.slice(0, 4)}…${s.slice(-4)}` : s;
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!supa || !token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Sign in first.' }) };
  }
  const { data: userData, error: authErr } = await supa.auth.getUser(token);
  if (authErr || !userData?.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Sign in first.' }) };
  }
  const { data: profile } = await supa
    .from('profiles').select('role').eq('id', userData.user.id).single();
  if (!['super_admin', 'admin', 'manager'].includes(profile?.role)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'The yard needs a staff role.' }) };
  }

  try {
    const { action, id, key, value } = JSON.parse(event.body || '{}');

    if (action === 'list') {
      const [entriesRes, dialsRes, bookRes] = await Promise.all([
        supa.from('send_a_burro_entries')
          .select('id, username, character_name, blurb, image_path, status, spot, verdict_burro, verdict_line, attempts, wallet, wallet_source, created_at, decided_at')
          .order('created_at', { ascending: false }),
        supa.from('send_a_burro_settings').select('key, value'),
        supa.from('send_a_burro_wallets').select('wallet', { count: 'exact', head: true }),
      ]);
      const entries = (entriesRes.data || []).map((e) => ({ ...e, wallet: trunc(e.wallet) }));
      const dials = Object.fromEntries((dialsRes.data || []).map((d) => [d.key, d.value]));
      return {
        statusCode: 200,
        body: JSON.stringify({ entries, dials, walletBook: bookRes.count || 0 }),
      };
    }

    if (action === 'dial') {
      if (!DIALS_ALLOWED.includes(key) || !['true', 'false'].includes(String(value))) {
        return { statusCode: 400, body: JSON.stringify({ error: 'That dial does not turn from here.' }) };
      }
      await supa.from('send_a_burro_settings').upsert({ key, value: String(value) });
      return { statusCode: 200, body: JSON.stringify({ ok: true, key, value: String(value) }) };
    }

    if (!id || !['pasture', 'remove', 'approve', 'vouch'].includes(action)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Send an action and an id.' }) };
    }

    // The vouch. The operator saw the trail name in a reply on the coin page
    // from the account that owns the pasted address, so the claim is proven
    // socially. Only a pasted entry takes one, signed never needs it.
    if (action === 'vouch') {
      const { data, error } = await supa.from('send_a_burro_entries')
        .update({ wallet_source: 'vouched' })
        .eq('id', id).eq('wallet_source', 'pasted').select('id').single();
      if (error || !data) return { statusCode: 404, body: JSON.stringify({ error: 'Only a pasted entry takes a vouch.' }) };
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (action === 'pasture') {
      const [burro, line] = VERDICTS[Math.floor(Math.random() * VERDICTS.length)];
      const { data, error } = await supa.from('send_a_burro_entries')
        .update({ status: 'pasture', spot: null, verdict_burro: burro, verdict_line: line, decided_at: new Date().toISOString() })
        .eq('id', id).select('id').single();
      if (error || !data) return { statusCode: 404, body: JSON.stringify({ error: 'No such entry.' }) };
      return { statusCode: 200, body: JSON.stringify({ ok: true, verdict_burro: burro, verdict_line: line }) };
    }

    if (action === 'remove') {
      const { data, error } = await supa.from('send_a_burro_entries')
        .update({ status: 'removed', spot: null, verdict_burro: null, verdict_line: null, decided_at: new Date().toISOString() })
        .eq('id', id).select('id').single();
      if (error || !data) return { statusCode: 404, body: JSON.stringify({ error: 'No such entry.' }) };
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // approve, the lowest free spot with a race guard, same shape as the
    // studio's submit. A parallel submit can land between the read and the
    // write, the unique constraint on spot catches it, second try wins.
    const { data: dialRows } = await supa.from('send_a_burro_settings').select('key, value');
    const dials = Object.fromEntries((dialRows || []).map((d) => [d.key, d.value]));
    const spotsTotal = Number(dials.spots_total) || 100;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { data: takenRows } = await supa.from('send_a_burro_entries')
        .select('spot').not('spot', 'is', null);
      const taken = new Set((takenRows || []).map((r) => r.spot));
      let free = null;
      for (let s = 1; s <= spotsTotal; s += 1) if (!taken.has(s)) { free = s; break; }
      if (free === null) return { statusCode: 403, body: JSON.stringify({ error: 'The ramp is full.' }) };

      const { data, error } = await supa.from('send_a_burro_entries')
        .update({ status: 'ramp', spot: free, verdict_burro: null, verdict_line: null, decided_at: new Date().toISOString() })
        .eq('id', id).select('id, spot, wallet').single();
      if (!error && data) {
        // Phosphor acknowledges the ramp. Same write as the studio's
        // send-a-burro-submit auto ramp path, change both together. An X
        // later does not revoke, pruning the guest list is its own decision.
        try {
          await supa.from('burrow_grants')
            .upsert({ wallet: data.wallet, reason: 'send a burro, on the ramp' });
        } catch { /* quiet, the sweep can catch it later */ }
        return { statusCode: 200, body: JSON.stringify({ ok: true, spot: data.spot }) };
      }
      if (error && !String(error.message || '').includes('duplicate')) {
        return { statusCode: 404, body: JSON.stringify({ error: 'No such entry.' }) };
      }
    }
    return { statusCode: 409, body: JSON.stringify({ error: 'Two racers took the spot, try again.' }) };
  } catch (err) {
    console.error('yard-decide error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'The yard hit an error.' }) };
  }
};
