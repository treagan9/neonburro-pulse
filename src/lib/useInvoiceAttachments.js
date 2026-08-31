// src/lib/useInvoiceAttachments.js
//
// The attachment rows for one invoice, for any surface that renders the client
// document. Metadata only, never the file bytes.
//
// ── WHY THIS IS SHARED RATHER THAN FETCHED IN EACH MODAL ────────────────────
//
// buildInvoiceEmailHTML has four callers and they are supposed to produce
// IDENTICAL output: the in-app preview, the review and send gate, the sent
// snapshot, and the server that actually mails it. The gate is the one that
// matters most, because a person approves what it shows and that approval sends
// the email. If the gate does not list the attachments and the email carries
// them, somebody approves a document they have not seen.
//
// So the rows come from one place. The server has its own copy of this query in
// netlify/functions/send-invoice.js, because it runs on the service role over
// REST rather than through the browser client, and that one is the source of
// truth for what is actually sent.
//
// No oxford commas, no em dashes.

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useInvoiceAttachments(invoiceId) {
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    let active = true;
    if (!invoiceId) { setAttachments([]); return undefined; }
    supabase
      .from('invoice_attachments')
      .select('filename, label, content_type, size_bytes, sort_order')
      .eq('invoice_id', invoiceId)
      .order('sort_order')
      .then(({ data }) => { if (active) setAttachments(data || []); });
    return () => { active = false; };
  }, [invoiceId]);

  return attachments;
}

export default useInvoiceAttachments;
