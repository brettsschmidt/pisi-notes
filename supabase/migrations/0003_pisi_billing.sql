-- pisi-notes: subscriptions + billing. Free/Pro plans, Stripe-backed.
-- Additive on the shared Supabase project; lives entirely in the `pisi` schema.

create table if not exists pisi.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  plan                   text not null default 'free'   check (plan in ('free', 'pro')),
  status                 text not null default 'active'
                           check (status in ('active', 'trialing', 'past_due', 'canceled')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  ai_credits_used        integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_stripe_customer_idx
  on pisi.subscriptions (stripe_customer_id) where stripe_customer_id is not null;

alter table pisi.subscriptions enable row level security;

-- Users may read their own subscription and bootstrap a default free row.
-- Plan upgrades only ever come from the Stripe webhook (service role, which
-- bypasses RLS) — there is deliberately no user-facing UPDATE/DELETE policy,
-- so a user can never grant themselves Pro through the API.
drop policy if exists "subscriptions_select_own" on pisi.subscriptions;
drop policy if exists "subscriptions_insert_bootstrap" on pisi.subscriptions;
create policy "subscriptions_select_own" on pisi.subscriptions
  for select using (auth.uid() = user_id);
create policy "subscriptions_insert_bootstrap" on pisi.subscriptions
  for insert with check (
    auth.uid() = user_id
    and plan = 'free' and status = 'active'
    and ai_credits_used = 0
    and stripe_customer_id is null
    and stripe_subscription_id is null
  );

drop trigger if exists subscriptions_updated_at on pisi.subscriptions;
create trigger subscriptions_updated_at before update on pisi.subscriptions
  for each row execute function pisi.set_updated_at();

-- Atomically meter one "Ask Pisi" question by incrementing the lifetime
-- counter. SECURITY DEFINER so a user can never tamper with their own
-- counter — the only mutation path is the +1 here. The free-trial limit
-- itself is enforced in app code (lib/billing/plans.ts), keeping a single
-- source of truth; this function only ever moves the counter upward.
create or replace function pisi.consume_ai_credit()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_used integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  insert into pisi.subscriptions (user_id) values (v_uid)
    on conflict (user_id) do nothing;
  update pisi.subscriptions
     set ai_credits_used = ai_credits_used + 1
   where user_id = v_uid
   returning ai_credits_used into v_used;
  return v_used;
end $$;

revoke all on function pisi.consume_ai_credit() from public;
grant execute on function pisi.consume_ai_credit() to authenticated;
