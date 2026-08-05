// src/lib/personas.js
// SENTINEL: NB_PERSONAS_V1
//
// The council, as messaging identities. A reply can go out as the person who
// typed it, or as the burro assigned to that client.
//
// Assignment is STABLE per client, not random per message. A client who gets
// Lyra keeps Lyra. Rotating on every message reads as a gimmick and quietly
// destroys the one thing a support thread needs, which is the feeling that
// somebody specific is on the other end. The rotation still exists, it just
// happens across the client list rather than inside a single conversation.
//
// Nothing here is automated yet. This is the identity layer a future assistant
// will speak through, put in place now so the UI does not have to change later.

const CDN = 'https://neonburro.com/burros';

export const PERSONAS = [
  { id: 'lyra',     name: 'Lyra',     lane: 'Design and brand',        blurb: 'Dream Architect' },
  { id: 'cypher',   name: 'Cypher',   lane: 'Systems and integration', blurb: 'Digital Nomad' },
  { id: 'pixel',    name: 'Pixel',    lane: 'Motion and interface',    blurb: 'Motion Alchemist' },
  { id: 'volt',     name: 'Volt',     lane: 'Performance and infra',   blurb: 'Bioelectric Alchemist' },
  { id: 'skye',     name: 'Skye',     lane: 'Pipelines and delivery',  blurb: 'Aerial Innovator' },
  { id: 'echo',     name: 'Echo',     lane: 'Billing and the ledger',  blurb: 'Storyteller of Frequencies' },
  { id: 'ion',      name: 'Ion',      lane: 'Research and discovery',  blurb: 'Hydro Frequency Researcher' },
  { id: 'aster',    name: 'Aster',    lane: 'Growth and the compound', blurb: 'Orb Wanderer' },
  { id: 'warbleur', name: 'Warbleur', lane: 'Runs the yard',           blurb: 'The Whispered Founder' },
].map((p) => ({
  ...p,
  avatar: `${CDN}/${p.id}/${p.id}-avatar.webp`,
  portrait: `${CDN}/${p.id}/${p.id}-tall-portrait.webp`,
}));

const BY_ID = Object.fromEntries(PERSONAS.map((p) => [p.id, p]));

export const getPersona = (id) => BY_ID[id] || null;

// Deterministic, dependency free, and stable across both repos. Same client id
// resolves to the same burro on the admin side and the portal side, which is the
// whole point: the client and the operator must be looking at the same face.
const hash = (s = '') => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (s.charCodeAt(i) + ((h << 5) - h)) | 0;
  return Math.abs(h);
};

export const personaForClient = (clientId) => {
  if (!clientId) return BY_ID.warbleur;
  return PERSONAS[hash(String(clientId)) % PERSONAS.length];
};

// Resolves what a rendered message should show. A message carries an optional
// `persona_id`; when absent we fall back to the human name already stored on the
// row, so every historical message keeps rendering exactly as it did before.
export const resolveSender = ({ message, client }) => {
  if (message.sender_type === 'client') {
    return {
      kind: 'client',
      name: message.sender_name || client?.name || 'Client',
      avatarUrl: client?.avatar_url || null,
    };
  }
  const persona = message.persona_id ? getPersona(message.persona_id) : null;
  if (persona) {
    return { kind: 'persona', name: persona.name, avatarUrl: persona.avatar, persona };
  }
  return {
    kind: 'team',
    name: message.sender_name || 'Neon Burro',
    avatarUrl: '/neon-burro-email-logo.png',
  };
};

// Helper copy, kept in one place so the admin note and the client note stay
// honest with each other. Neither promises a date.
export const ASSISTANT_NOTE_ADMIN =
  'Replies can go out under your own name or as this client’s burro. The burro is a persona today, not a bot — a person still writes every word. Automated replies and scheduled check-ins are planned to run through this same identity.';

export const ASSISTANT_NOTE_CLIENT =
  'A real person on the Neon Burro crew writes every reply here. Your burro is who they sign as.';

export default PERSONAS;
