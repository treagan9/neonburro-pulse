-- neonburro · billing rails
-- Run against the Neon Burro project in the SQL editor. Additive and idempotent.
--
-- ════════════════════════════════════════════════════════════════════════════
-- WHY THIS MIGRATION EXISTS
-- ════════════════════════════════════════════════════════════════════════════
--
-- A CARD CAN BE PULLED. A WALLET CANNOT.
--
-- Stripe holds a mandate, so on the renewal date it charges and we find out
-- afterwards. There is no on chain equivalent. Nobody can authorise us to reach
-- into their wallet on the first of the month, so a stablecoin subscription can
-- only ever invoice and wait.
--
--   card        we charge   · silence means it worked
--   stablecoin  we invoice  · silence means it did not
--
-- Those are two different products and the schema has to know which one a row
-- is, or we will ship a subscription that reads active and has not been paid
-- for four months. Everything below exists to make that distinction storable.
--
-- ── THE NUMBER THAT MUST BE WRITTEN ONCE AND NEVER RECOMPUTED ───────────────
-- settlements.usd_value is the dollar value AT THE MOMENT IT CLEARED, stamped
-- then, never derived later. A ledger that stores only a token amount cannot
-- say what a year was worth. A ledger that recomputes from today's price is
-- telling a story rather than keeping a record.
--
-- No oxford commas, no em dashes.

-- ── subscriptions gain a rail ───────────────────────────────────────────────
-- Default card, because every subscription that exists today is a card and
-- guessing forward is how you corrupt a ledger.
alter table public.subscriptions
  add column if not exists rail text not null default 'card'
    check (rail in ('card','stablecoin')),
  -- Only meaningful on a push rail. The address we expect the money to arrive
  -- from, so an incoming transfer can be matched without a hueman guessing.
  add column if not exists payer_address text,
  -- On a push rail nothing happens by itself. This is the day somebody or some
  -- cron has to raise the invoice. On a pull rail it stays null.
  add column if not exists next_invoice_at timestamptz;

comment on column public.subscriptions.rail is
  'card = Stripe pulls on the renewal date. stablecoin = we raise an invoice and wait for a push.';

-- ── invoices gain rails, offered and settled ────────────────────────────────
-- rail_offered is what the pay page shows. rail_settled is what actually paid
-- it, and it stays null until the money is real. Two columns rather than one
-- because an invoice that offers both and is paid by card must not read as a
-- stablecoin invoice afterwards.
alter table public.invoices
  add column if not exists rail_offered text[] not null default array['card','stablecoin']::text[],
  add column if not exists rail_settled text
    check (rail_settled is null or rail_settled in ('card','stablecoin'));

create index if not exists invoices_rail_settled_idx
  on public.invoices (rail_settled) where rail_settled is not null;

-- ── settlements · the on chain ledger ───────────────────────────────────────
-- One row per confirmed transfer. Card payments do not appear here, they live
-- in Stripe and in invoices.total_paid. This table is only for money that
-- arrived on a chain, where we are the system of record because nobody else is.
create table if not exists public.settlements (
  id                uuid primary key default gen_random_uuid(),

  invoice_id        uuid references public.invoices (id) on delete set null,
  subscription_id   uuid references public.subscriptions (id) on delete set null,
  client_id         uuid references public.clients (id) on delete set null,

  chain             text not null check (chain in ('solana','base','ethereum','polygon','arbitrum')),
  asset             text not null default 'USDC',

  -- What actually moved, at full precision. Numeric, never float. A float
  -- cannot hold six decimals of USDC without lying about the last one.
  token_amount      numeric(38,10) not null check (token_amount > 0),

  -- What it was worth the moment it cleared. Stamped once. See the note above.
  usd_value         numeric(12,2) not null check (usd_value >= 0),
  usd_rate          numeric(18,8),
  rate_source       text,

  tx_hash           text not null,
  from_address      text,
  to_address        text,

  status            text not null default 'confirmed'
                      check (status in ('pending','confirmed','failed','reversed')),

  confirmed_at      timestamptz not null default now(),
  recorded_by       uuid references auth.users (id),
  notes             text,
  created_at        timestamptz not null default now()
);

-- A transaction hash is unique per chain and a double insert is a double count.
create unique index if not exists settlements_chain_tx_uniq
  on public.settlements (chain, tx_hash);

create index if not exists settlements_invoice_idx      on public.settlements (invoice_id);
create index if not exists settlements_subscription_idx on public.settlements (subscription_id, confirmed_at desc);
create index if not exists settlements_client_idx       on public.settlements (client_id, confirmed_at desc);

comment on table public.settlements is
  'Confirmed on chain transfers. usd_value is stamped at settlement and is never recomputed.';

-- ── keep invoices.total_paid true for stablecoin invoices ───────────────────
-- Card payments update total_paid from the Stripe webhook. Without this, an
-- invoice paid in USDC would sit at zero paid forever and the overdue cron
-- would chase a client who has already paid us.
create or replace function public.apply_settlement_to_invoice()
returns trigger
language plpgsql
as $$
declare
  paid numeric(12,2);
  due  numeric(12,2);
begin
  if new.invoice_id is null or new.status <> 'confirmed' then
    return new;
  end if;

  select coalesce(sum(usd_value), 0) into paid
    from public.settlements
   where invoice_id = new.invoice_id and status = 'confirmed';

  select coalesce(total, 0) into due from public.invoices where id = new.invoice_id;

  update public.invoices
     set total_paid   = paid,
         rail_settled = 'stablecoin',
         status       = case when paid >= due then 'paid' else status end,
         paid_at      = case when paid >= due and paid_at is null then now() else paid_at end
   where id = new.invoice_id;

  return new;
end;
$$;

drop trigger if exists settlements_apply on public.settlements;
create trigger settlements_apply
  after insert or update of status, usd_value on public.settlements
  for each row execute function public.apply_settlement_to_invoice();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.settlements enable row level security;

drop policy if exists settlements_staff_read on public.settlements;
create policy settlements_staff_read on public.settlements
  for select to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid()
                    and p.role in ('super_admin','admin','manager','team')));

drop policy if exists settlements_staff_write on public.settlements;
create policy settlements_staff_write on public.settlements
  for all to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid()
                    and p.role in ('super_admin','admin','manager')))
  with check (exists (select 1 from public.profiles p
                       where p.id = auth.uid()
                         and p.role in ('super_admin','admin','manager')));

-- A client sees their own settlements. They paid, they get the receipt.
drop policy if exists settlements_client_read on public.settlements;
create policy settlements_client_read on public.settlements
  for select to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid()
                    and p.role = 'client'
                    and p.client_id = settlements.client_id));

-- ── verify ──────────────────────────────────────────────────────────────────
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'settlements'
order by ordinal_position;

select
  (select count(*) from public.subscriptions where rail = 'card')       as card_subs,
  (select count(*) from public.subscriptions where rail = 'stablecoin') as chain_subs;
