// src/pages/Invoicing/components/InvoiceAttachments.jsx
//
// Backup documents on an invoice. Built for pass through billing: hardware sold
// on at cost, with the supplier's own invoice riding along to prove the number.
//
// ── THE FILES ARE EMAILED, NOT LINKED ───────────────────────────────────────
//
// The invoice-attachments bucket is PRIVATE and has no anon read policy, unlike
// invoices and invoice_items which anon can read by pay_token. These are
// supplier invoices carrying wholesale pricing, and a public URL is a
// competitor reading what we pay. netlify/functions/send-invoice.js pulls the
// bytes with the service role and attaches them to the message, so the client
// gets real files and the bucket stays sealed.
//
// That has one consequence visible here: the preview link below is a SIGNED url
// with a short life, for the sender to check they uploaded the right page. It
// is not what the client receives and it is not a share link.
//
// ── IT NEEDS A SAVED INVOICE ────────────────────────────────────────────────
//
// An attachment row points at an invoice id, and a brand new invoice does not
// have one until the draft is saved. Rather than invent a staging area, this
// says so and asks for a save. That is honest and it is one click.
//
// ── THE LABEL IS THE POINT ──────────────────────────────────────────────────
//
// "Camera hardware, billed at cost" reads on an invoice. "scan_0043.pdf" does
// not. The label is what prints on the client's document, the filename is shown
// underneath it in mono as the receipt. A file with no label falls back to its
// filename, which is why the label field is optional but strongly worth filling.
//
// No oxford commas, no em dashes.

import { useState, useEffect, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Input, Button, Spinner, useToast,
} from '@chakra-ui/react';
import { TbPaperclip, TbTrash, TbEye, TbUpload } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';
import colors from '../../../theme/colors';

const BUCKET = 'invoice-attachments';
const MAX_BYTES = 10 * 1024 * 1024;

const prettySize = (n) => {
  const b = Number(n || 0);
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  if (b >= 1024) return `${Math.round(b / 1024)} KB`;
  return `${b} B`;
};

export default function InvoiceAttachments({ invoiceId, readOnly = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    if (!invoiceId) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('invoice_attachments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sort_order');
    setRows(data || []);
    setLoading(false);
  }, [invoiceId]);

  useEffect(() => { load(); }, [load]);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast({
        title: 'That file is too big',
        description: `${prettySize(file.size)}. The limit is 10 MB so the email still sends.`,
        status: 'warning',
      });
      return;
    }

    setBusy(true);
    try {
      // invoice id first in the path, so everything for one invoice sits
      // together and deleting an invoice's files is one prefix.
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${invoiceId}/${Date.now()}-${safe}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: rowErr } = await supabase.from('invoice_attachments').insert({
        invoice_id: invoiceId,
        storage_path: path,
        filename: file.name,
        content_type: file.type || null,
        size_bytes: file.size,
        sort_order: rows.length,
      });
      // Leaving a file in the bucket with no row is an orphan nobody will ever
      // find, so the upload is undone if the row does not land.
      if (rowErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw rowErr;
      }

      await load();
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, status: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const setLabel = async (row, label) => {
    if ((row.label || '') === label) return;
    await supabase.from('invoice_attachments').update({ label: label || null }).eq('id', row.id);
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, label: label || null } : x)));
  };

  const remove = async (row) => {
    setBusy(true);
    await supabase.storage.from(BUCKET).remove([row.storage_path]);
    await supabase.from('invoice_attachments').delete().eq('id', row.id);
    setBusy(false);
    load();
  };

  // A short lived signed url so the sender can check the right page went up.
  // Not a share link, see the note at the top.
  const peek = async (row) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(row.storage_path, 60);
    if (error) {
      toast({ title: 'Could not open that file', description: error.message, status: 'error' });
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const labelStyle = {
    fontFamily: 'mono',
    fontSize: '2xs',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'paper.inkMuted',
  };

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={3}>
        <Text {...labelStyle}>
          Attached {rows.length > 0 && `(${rows.length})`}
        </Text>
        {!readOnly && invoiceId && (
          <Button
            as="label"
            size="xs"
            variant="ghost"
            cursor="pointer"
            leftIcon={<Icon as={TbUpload} boxSize={3.5} />}
            isDisabled={busy}
            color="paper.inkSec"
            _hover={{ color: 'paper.ink', bg: 'paper.raised' }}
          >
            {busy ? 'Uploading…' : 'Add a file'}
            <Input
              type="file"
              display="none"
              onChange={onPick}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.csv"
            />
          </Button>
        )}
      </HStack>

      {!invoiceId ? (
        <Text fontSize="sm" color="paper.inkFaint">
          Save the draft first and you can attach backup documents to it.
        </Text>
      ) : loading ? (
        <Spinner size="sm" color="paper.inkMuted" />
      ) : rows.length === 0 ? (
        <Text fontSize="sm" color="paper.inkFaint" maxW="60ch">
          Nothing attached. A supplier invoice here is what turns a line billed at
          cost into a line the client can check.
        </Text>
      ) : (
        <VStack align="stretch" spacing={0}>
          {rows.map((row) => (
            <HStack
              key={row.id}
              spacing={3}
              py={3}
              borderTop="1px solid"
              borderColor="paper.hair"
              align="center"
            >
              <Icon as={TbPaperclip} boxSize={4} color="paper.inkMuted" flexShrink={0} />
              <Box flex="1" minW={0}>
                <Input
                  defaultValue={row.label || ''}
                  onBlur={(e) => setLabel(row, e.target.value.trim())}
                  placeholder="what this is, e.g. camera hardware, billed at cost"
                  variant="unstyled"
                  fontSize="sm"
                  fontWeight="600"
                  color="paper.ink"
                  isReadOnly={readOnly}
                  _placeholder={{ color: 'paper.inkFaint', fontWeight: '400' }}
                />
                <Text fontFamily="mono" fontSize="2xs" color="paper.inkMuted" mt={0.5} noOfLines={1}>
                  {row.filename} · {prettySize(row.size_bytes)}
                </Text>
              </Box>
              <Icon
                as={TbEye}
                boxSize={4}
                color="paper.inkMuted"
                cursor="pointer"
                flexShrink={0}
                onClick={() => peek(row)}
                _hover={{ color: 'paper.ink' }}
                aria-label={`Preview ${row.filename}`}
              />
              {!readOnly && (
                <Icon
                  as={TbTrash}
                  boxSize={4}
                  color="paper.inkMuted"
                  cursor="pointer"
                  flexShrink={0}
                  onClick={() => remove(row)}
                  _hover={{ color: colors.accent?.coral || 'red.400' }}
                  aria-label={`Remove ${row.filename}`}
                />
              )}
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}
