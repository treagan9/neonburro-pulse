-- supabase/migrations/2026082901_releases.sql
-- The release timeline. One row is one thing the studio intends to put into
-- the world: a site feature, a post on a channel, a newsletter, a page, a
-- product door opening. The Releases page in Pulse reads and writes this
-- straight through the client. NOT YET APPLIED, Tyler pastes this in the
-- dashboard SQL editor, the connector cannot reach this org.
--
-- channel is free text on purpose (site, x, instagram, reddit, telegram,
-- blog, newsletter, phosphor, shop, pulse), a check list would need a
-- migration every time the studio grows a room. voice is the burro who
-- fronts the release, lowercase slug, the page renders it with the period.
--
-- RLS follows the Pulse convention: any authenticated team member reads and
-- writes, nothing here is client visible.

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  channel text not null default 'site',
  voice text,
  status text not null default 'idea' check (status in ('idea','drafted','staged','released')),
  release_at timestamptz,
  released_at timestamptz,
  link text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists releases_release_at_idx on public.releases (release_at);
create index if not exists releases_status_idx on public.releases (status);

alter table public.releases enable row level security;

drop policy if exists releases_rw on public.releases;
create policy releases_rw on public.releases
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- The board should not open empty. The real slate as of 2026-08-29, dates
-- are intentions not promises, move them freely.
insert into public.releases (title, channel, voice, status, release_at, notes) values
  ('the contact form reads the billboard doors', 'site', 'volt', 'drafted', now() + interval '2 days', 'about param preselects computer-build and free-analysis subjects'),
  ('business computer builds page', 'site', 'cypher', 'idea', now() + interval '5 days', 'the designated machine, tap to talk, confirms before changing anything'),
  ('the free analysis machinery', 'site', 'gauge', 'idea', now() + interval '7 days', 'supabase row per request, three day promise, emailed through resend'),
  ('cypherburro walks into reddit', 'reddit', 'cypher', 'staged', now() + interval '1 day', 'comments only for two weeks, no links until earned'),
  ('newsletter one, the herd hears from us', 'newsletter', 'warbleur', 'idea', now() + interval '10 days', 'footer signups have been collecting with nothing sent, first note goes out through resend'),
  ('council aliases go live in gmail', 'pulse', 'latch', 'staged', now() + interval '1 day', 'waits on the admin password, then seven send-as entries with faces'),
  ('custom marketing and outreach pages', 'site', 'aster', 'idea', now() + interval '12 days', 'short pages, both exist so the billboard can rotate them in'),
  ('hoodedwarbleur leaves the prototypes', 'site', 'warbleur', 'idea', now() + interval '14 days', 'the coin adjacent property gets a real face');
