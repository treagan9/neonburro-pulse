-- 2026081801_clients_billing_and_contacts.sql
-- Applied live to sspbripimqvfdkfbpubq on 2026-08-18 via the Supabase connector.
-- Expands the client record so an invoice has a real Bill To, marks a client as
-- an individual or a business, adds a timezone for the shared calendar, and adds
-- a client_contacts table for any number of contacts, each flaggable as primary
-- or as a billing CC (who gets copied on an invoice). Idempotent, safe to re-run.

alter table public.clients
  add column if not exists client_type text not null default 'individual',
  add column if not exists tax_id text,
  add column if not exists timezone text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists postal_code text,
  add column if not exists country text default 'US';

alter table public.clients drop constraint if exists clients_client_type_check;
alter table public.clients
  add constraint clients_client_type_check check (client_type in ('individual','business'));

create table if not exists public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text,
  email text,
  phone text,
  role text,
  is_primary boolean not null default false,
  is_billing boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists client_contacts_client_id_idx on public.client_contacts(client_id);

alter table public.client_contacts enable row level security;
drop policy if exists "Authenticated users can manage client_contacts" on public.client_contacts;
create policy "Authenticated users can manage client_contacts"
  on public.client_contacts for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
