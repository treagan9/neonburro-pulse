-- 2026083101_invoice_attachments.sql
-- Applied to sspbripimqvfdkfbpubq on 2026-08-31.
--
-- Backup documents that ride along with an invoice. Built for pass through
-- billing: hardware sold on at cost, with the supplier's own invoice attached
-- to prove the number on the line item is the number that was paid.
--
-- ── THE BUCKET IS PRIVATE AND THAT IS THE WHOLE DESIGN ──────────────────────
--
-- The other two buckets on this project, avatars and send-a-burro, are public,
-- because a public URL for an avatar costs nothing. These files are SUPPLIER
-- INVOICES. They carry wholesale pricing, account numbers and vendor terms, and
-- a public bucket is a guessable URL away from a competitor reading what we pay.
--
-- So nothing here is ever served from a URL. netlify/functions/send-invoice.js
-- and resend-invoice.js read each file with the service role and attach the
-- BYTES to the email, so the client receives real attachments and the storage
-- stays sealed. There is deliberately NO anon read policy, unlike invoices and
-- invoice_items which anon can read by pay_token. Do not add one to make a
-- download link work, attach the file instead.

create table if not exists public.invoice_attachments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  content_type text,
  size_bytes bigint,
  -- what it is FOR, in the sender's words. "Camera hardware, billed at cost"
  -- reads on an invoice, "scan_0043.pdf" does not. This is what prints on the
  -- client's document, with the filename under it as the receipt.
  label text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists invoice_attachments_invoice_idx
  on public.invoice_attachments(invoice_id);

alter table public.invoice_attachments enable row level security;

-- Mirrors "Authenticated users can manage invoices" on the parent table.
drop policy if exists "Authenticated users can manage invoice attachments" on public.invoice_attachments;
create policy "Authenticated users can manage invoice attachments"
  on public.invoice_attachments for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- 10MB a file. A scanned supplier invoice is well under that, and Resend caps a
-- whole message near 40MB, so this leaves room for several on one invoice.
-- send-invoice.js enforces a 20MB total before it tries to send.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoice-attachments',
  'invoice-attachments',
  false,
  10485760,
  array['application/pdf','image/png','image/jpeg','image/webp','text/csv']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated manage invoice attachment files" on storage.objects;
create policy "Authenticated manage invoice attachment files"
  on storage.objects for all
  using (bucket_id = 'invoice-attachments' and auth.uid() is not null)
  with check (bucket_id = 'invoice-attachments' and auth.uid() is not null);
