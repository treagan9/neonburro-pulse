-- neonburro · subscriptions
-- Run against the Neon Burro project in the SQL editor. Additive and idempotent.
--
-- A subscription is a GENERATOR, not a second billing system. It emits ordinary
-- rows into `invoices` every time Stripe charges it, so the invoice list, the
-- client detail tab, snapshots, MTD revenue and the overdue cron all keep
-- working with no changes. Nobody has to learn a new screen to see the money.

create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  client_id               uuid not null references public.clients (id) on delete cascade,
  subscription_number     text unique,

  -- what the client is buying, in their words
  name                    text not null,
  description             text,
  included                jsonb not null default '[]'::jsonb,

  -- money. amount is per interval, in dollars, matching how invoices store it
  amount                  numeric(10,2) not null check (amount > 0),
  setup_fee               numeric(10,2) default 0 check (setup_fee >= 0),
  currency                text not null default 'usd',
  interval                text not null default 'month' check (interval in ('month','year')),
  interval_count          integer not null default 1 check (interval_count > 0),

  status                  text not null default 'draft'
                            check (status in ('draft','pending','active','past_due','paused','cancelled')),

  -- stripe. price is inline at checkout so there is no product catalog to keep
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  stripe_price_id         text,
  checkout_session_id     text,

  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  cancelled_at            timestamptz,
  started_at              timestamptz,

  -- the token in the branded email link, same idea as invoices.pay_token
  pay_token               text unique,

  notes                   text,
  created_by              uuid references auth.users (id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists subscriptions_client_idx    on public.subscriptions (client_id, created_at desc);
create index if not exists subscriptions_status_idx    on public.subscriptions (status) where status in ('active','past_due');
create index if not exists subscriptions_stripe_id_idx on public.subscriptions (stripe_subscription_id);
create index if not exists subscriptions_pay_token_idx on public.subscriptions (pay_token);

-- invoices gain a parent. null means it was raised by hand, which is every
-- invoice that exists today, so nothing changes for them.
alter table public.invoices
  add column if not exists subscription_id  uuid references public.subscriptions (id) on delete set null,
  add column if not exists source           text not null default 'manual'
                             check (source in ('manual','subscription')),
  add column if not exists stripe_invoice_id text,
  -- the billing window a recurring invoice covers. null on manual invoices,
  -- which is every invoice that exists today.
  add column if not exists period_start     timestamptz,
  add column if not exists period_end       timestamptz;

create index if not exists invoices_subscription_idx on public.invoices (subscription_id, created_at desc);
create unique index if not exists invoices_stripe_invoice_uniq
  on public.invoices (stripe_invoice_id) where stripe_invoice_id is not null;

-- numbering, matching the invoice and sprint pattern. NBS + YY + MM + counter.
create or replace function public.next_subscription_number()
returns text
language plpgsql
as $$
declare
  prefix text := 'NBS' || to_char(now() at time zone 'America/Denver', 'YYMM');
  n integer;
begin
  select coalesce(max(substring(subscription_number from '\d+$')::int), 0) + 1
    into n
    from public.subscriptions
   where subscription_number like prefix || '%';
  return prefix || lpad(n::text, 2, '0');
end;
$$;

create or replace function public.touch_subscriptions_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_subscriptions_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.subscriptions enable row level security;

-- staff read everything
drop policy if exists subscriptions_staff_read on public.subscriptions;
create policy subscriptions_staff_read on public.subscriptions
  for select to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid()
                    and p.role in ('super_admin','admin','manager','team')));

-- staff write everything
drop policy if exists subscriptions_staff_write on public.subscriptions;
create policy subscriptions_staff_write on public.subscriptions
  for all to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid()
                    and p.role in ('super_admin','admin','manager')))
  with check (exists (select 1 from public.profiles p
                       where p.id = auth.uid()
                         and p.role in ('super_admin','admin','manager')));

-- a client reads only their own, and only once it is real
drop policy if exists subscriptions_client_read on public.subscriptions;
create policy subscriptions_client_read on public.subscriptions
  for select to authenticated
  using (
    status <> 'draft'
    and exists (select 1 from public.profiles p
                 where p.id = auth.uid()
                   and p.role = 'client'
                   and p.client_id = subscriptions.client_id)
  );

-- ── verify ───────────────────────────────────────────────────────────────────
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'subscriptions'
order by ordinal_position;

select public.next_subscription_number() as next_number;
