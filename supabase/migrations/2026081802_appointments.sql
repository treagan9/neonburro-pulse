-- supabase/migrations/2026081802_appointments.sql
-- The calendar. One appointment is a call, a video meeting or an in-person
-- meeting, tied to a client (or internal, client_id null). Times are stored as
-- absolute instants (timestamptz) plus the zone they were entered in, so the
-- invite email and the .ics render the same instant in the client's own zone and
-- nobody is off by an hour. client_notified_at and reminder_sent_at record when
-- send-appointment last emailed the client. Applied live 2026-08-18.
--
-- RLS follows the Pulse convention: any authenticated team member reads and
-- writes; the send-appointment function uses the service role and bypasses this.

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  meeting_type text not null default 'call' check (meeting_type in ('call','video','in_person')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  meeting_url text,
  timezone text not null default 'America/Denver',
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  client_notified_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_starts_at_idx on public.appointments (starts_at);
create index if not exists appointments_client_id_idx on public.appointments (client_id);

alter table public.appointments enable row level security;

drop policy if exists appointments_rw on public.appointments;
create policy appointments_rw on public.appointments
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
