// netlify/functions/registry-balances.js
// SENTINEL: NB_PULSE_REGISTRY_BALANCES_V1
//
// The chain side of the Registry page. Takes a list of Solana addresses and
// answers with each one's SOL and NEONBURRO balance, read live from public
// mainnet RPC. The wallet list itself lives in token_wallets and travels
// through the Supabase client, this function only ever talks to the chain.
//
// ── WHY SERVER SIDE ─────────────────────────────────────────────────────────
// The public RPC rate limits browsers hard and CORS behavior shifts under
// load. One server request with one batched JSON-RPC body is friendlier to
// the endpoint and gives one place to slot a private RPC url later, set
// SOLANA_RPC_URL on the Pulse site and nothing else changes.
//
// ── RATE LIMITS ARE A WHEN NOT AN IF ────────────────────────────────────────
// Seen live 2026-08-26, getTokenLargestAccounts answered 429 on the public
// endpoint. Any address the RPC refuses comes back with null balances and
// the page shows a dash, a partial answer beats a dead page. Session gated
// like every Pulse function, chain data is public but this door is ours.
//
// No oxford commas, no em dashes.

import { createClient } from '@supabase/supabase-js';

const RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const MINT = 'EdBEwPyso39z2ow59frpuLUVz5axm61dnqAeAuxYpump';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supa = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const isAddress = (s) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(s || ''));

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

  try {
    const { addresses } = JSON.parse(event.body || '{}');
    const list = (Array.isArray(addresses) ? addresses : []).filter(isAddress).slice(0, 40);
    if (!list.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Send addresses.' }) };
    }

    // One batched body, two requests per address. Ids map back by index.
    const batch = [];
    list.forEach((a, i) => {
      batch.push({ jsonrpc: '2.0', id: i * 2, method: 'getBalance', params: [a] });
      batch.push({
        jsonrpc: '2.0',
        id: i * 2 + 1,
        method: 'getTokenAccountsByOwner',
        params: [a, { mint: MINT }, { encoding: 'jsonParsed' }],
      });
    });

    const res = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      return { statusCode: 200, body: JSON.stringify({ balances: {}, note: `the rpc answered ${res.status}, try again in a minute` }) };
    }
    const answers = await res.json();
    const byId = new Map((Array.isArray(answers) ? answers : []).map((r) => [r.id, r]));

    const balances = {};
    list.forEach((a, i) => {
      const solAns = byId.get(i * 2);
      const nbAns = byId.get(i * 2 + 1);
      const sol = (typeof solAns?.result?.value === 'number') ? solAns.result.value / 1e9 : null;
      let nb = null;
      if (nbAns?.result?.value) {
        nb = nbAns.result.value.reduce(
          (sum, acc) => sum + (acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0),
          0
        );
      }
      balances[a] = { sol, nb };
    });

    return { statusCode: 200, body: JSON.stringify({ balances }) };
  } catch (err) {
    console.error('registry-balances error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'The chain read failed.' }) };
  }
};
