// netlify/functions/draft-invoice.js
// Volt's brain. Takes what the operator typed or said (and any receipt PDFs or
// photos) and returns a structured Neon Burro invoice draft: line items with
// amounts and a payment mode, plus a matched client. The composer shows the draft
// and hands it to the invoice editor for preview and send, so Volt never sends
// anything, he only drafts.
//
// Calls the Anthropic API directly with fetch (no SDK) and forces structured
// output through a single tool, so the result is always the shape the editor
// wants. Needs ANTHROPIC_API_KEY on the Pulse site. Until that is set this returns
// a clear "not connected yet" message rather than a stack trace.
//
// No oxford commas, no em dashes.

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-5';

const SYSTEM = `You are Volt, the invoicing assistant for Neon Burro, a small digital studio in Ridgway Colorado. You turn a short spoken or typed description, plus any receipts, into a clean professional invoice draft.

How Neon Burro invoices work:
- An invoice is a list of line items. Each line has a title, an optional one line description, an amount in US dollars, and a payment_mode.
- payment_mode is one of: "pay_full" (the client funds the whole line, the default for normal monthly work), "deposit_50" (50 percent to start, for larger new work), "approve_only" (confirm the scope with no charge yet).
- Most invoices are simple monthly digital management. Sometimes there are on-site calls, staff calls or specific requests. Sometimes a cost was paid on the client's behalf (a domain, a stock asset) and a receipt is attached, add a reimbursement line for that exact amount.
- Billing is usually monthly. Sometimes two months are batched, in that case make it clear in the titles (for example "Digital management, September" and "Digital management, October").

Rules:
- Keep titles short and specific. Keep descriptions to one clean line or leave them empty.
- Use the real numbers the operator gives you. If an amount is genuinely unclear, use 0 and note it so they can fill it in.
- Match the client to the provided list by name and return that client's id. If you are not confident, leave client_id empty and put your best guess in client_name.
- Write a one line summary telling the operator what you drafted.
- Do not invent work that was not described. Do not add tax or discounts.
- Always answer by calling the create_invoice_draft tool.`;

const TOOL = {
  name: 'create_invoice_draft',
  description: 'Return the structured Neon Burro invoice draft.',
  input_schema: {
    type: 'object',
    properties: {
      client_id: { type: 'string', description: "id of the matched client from the provided list, or empty string if unsure" },
      client_name: { type: 'string', description: 'the client name as best understood' },
      lines: {
        type: 'array',
        description: 'the invoice line items',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            amount: { type: 'number' },
            payment_mode: { type: 'string', enum: ['pay_full', 'deposit_50', 'approve_only'] },
          },
          required: ['title', 'amount', 'payment_mode'],
        },
      },
      notes: { type: 'string', description: 'optional internal note for the invoice' },
      summary: { type: 'string', description: 'one line summary for the operator' },
    },
    required: ['lines', 'summary'],
  },
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 200, body: JSON.stringify({ notConnected: true, error: 'Volt is not connected yet. Add ANTHROPIC_API_KEY to the Pulse site and try again.' }) };
  }

  try {
    const { text = '', attachments = [], clients = [] } = JSON.parse(event.body || '{}');
    if (!text.trim() && attachments.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Tell Volt what to invoice, or attach a receipt.' }) };
    }

    const clientList = clients.map((c) => `- ${c.name}${c.company ? ` (${c.company})` : ''} [id: ${c.id}]`).join('\n');

    const content = [];
    for (const a of attachments) {
      if (!a?.data || !a?.media_type) continue;
      if (a.media_type === 'application/pdf') {
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: a.data } });
      } else if (a.media_type.startsWith('image/')) {
        content.push({ type: 'image', source: { type: 'base64', media_type: a.media_type, data: a.data } });
      }
    }
    content.push({
      type: 'text',
      text: `Known clients, match by name and return the id:\n${clientList || '(none provided)'}\n\nWhat to invoice:\n${text || '(see the attached receipt)'}`,
    });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1600,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'create_invoice_draft' },
        messages: [{ role: 'user', content }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic error:', errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'Volt could not reach the model. Check the API key and try again.' }) };
    }

    const data = await res.json();
    const toolUse = (data.content || []).find((b) => b.type === 'tool_use' && b.name === 'create_invoice_draft');
    if (!toolUse) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Volt did not return a structured draft. Try rephrasing.' }) };
    }

    const draft = toolUse.input || {};
    draft.lines = Array.isArray(draft.lines) ? draft.lines : [];
    return { statusCode: 200, body: JSON.stringify({ draft }) };
  } catch (err) {
    console.error('draft-invoice error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Volt hit an error drafting the invoice.' }) };
  }
};
