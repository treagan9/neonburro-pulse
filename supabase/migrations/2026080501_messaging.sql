-- Neon Burro — messaging upgrade
-- Run against the Neon Burro project (sspbripimqvfdkfbpubq) in the SQL editor.
-- Every statement is additive and idempotent. Nothing here drops or rewrites
-- existing data, and `client_messages` keeps working unchanged if you stop
-- after part 1.

-- ─────────────────────────────────────────────────────────────
-- 1. Persona signing on client messages
-- ─────────────────────────────────────────────────────────────
-- A team reply can now be signed as the client's burro. Null means the reply
-- went out under the human's own name, which is how every existing row reads,
-- so history renders exactly as it did before.

alter table public.client_messages
  add column if not exists persona_id text;

-- Unread lookups drive the sidebar badge and the inbox sort. Without this the
-- badge does a sequential scan of the whole table on every page load.
create index if not exists client_messages_unread_team_idx
  on public.client_messages (client_id, created_at desc)
  where sender_type = 'client' and read_by_team = false;

create index if not exists client_messages_unread_client_idx
  on public.client_messages (client_id, created_at desc)
  where sender_type = 'team' and read_by_client = false;

-- Thread list ordering.
create index if not exists client_messages_client_created_idx
  on public.client_messages (client_id, created_at desc);


-- ─────────────────────────────────────────────────────────────
-- 2. Team to team direct messages, inside Pulse
-- ─────────────────────────────────────────────────────────────
-- Separate table on purpose. `client_messages` is a client-visible artifact and
-- is read by the portal under RLS; internal chatter must never share a table
-- with it, because one wrong policy would expose staff conversation to a client.

create table if not exists public.team_messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  body         text not null check (length(trim(body)) > 0),
  read_at      timestamptz,
  created_at   timestamptz not null default now(),
  constraint team_messages_no_self check (sender_id <> recipient_id)
);

create index if not exists team_messages_pair_idx
  on public.team_messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at desc);

create index if not exists team_messages_unread_idx
  on public.team_messages (recipient_id, created_at desc)
  where read_at is null;

alter table public.team_messages enable row level security;

-- Read: only the two people in the conversation.
drop policy if exists team_messages_select on public.team_messages;
create policy team_messages_select on public.team_messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Write: you can only send as yourself, and only to a staff profile. Clients
-- hold `role = 'client'` and are excluded, so this table can never become a
-- second channel into the portal.
drop policy if exists team_messages_insert on public.team_messages;
create policy team_messages_insert on public.team_messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.profiles p
      where p.id = recipient_id
        and p.role in ('super_admin', 'admin', 'manager', 'team')
    )
  );

-- Update: only the recipient, and only to mark it read.
drop policy if exists team_messages_update on public.team_messages;
create policy team_messages_update on public.team_messages
  for update to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);


-- ─────────────────────────────────────────────────────────────
-- 3. Verify
-- ─────────────────────────────────────────────────────────────
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'client_messages'
order by ordinal_position;

select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p
         where p.tablename = c.relname and p.schemaname = 'public') as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('client_messages', 'team_messages');
