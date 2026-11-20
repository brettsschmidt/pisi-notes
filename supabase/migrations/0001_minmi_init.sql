-- Quiet Upsell: initial schema.
--
-- Everything lives in its own `minmi` schema so it can share a Supabase
-- project with other apps without colliding. After applying, add `minmi` to
-- Project Settings → API → "Exposed schemas" so PostgREST serves it.
--
--   minmi.subscriptions   — Free / Pro plan per user (Stripe-backed)
--   minmi.rotators        — a public image URL (/i/<slug>) that rotates
--   minmi.rotator_images  — the images a rotator cycles through
--   storage: minmi-images — uploaded image files, public-read

create schema if not exists minmi;

grant usage on schema minmi to anon, authenticated, service_role;

create or replace function minmi.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- billing

create table if not exists minmi.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  plan                   text not null default 'free'   check (plan in ('free', 'pro')),
  status                 text not null default 'active'
                           check (status in ('active', 'trialing', 'past_due', 'canceled')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_stripe_customer_idx
  on minmi.subscriptions (stripe_customer_id) where stripe_customer_id is not null;

alter table minmi.subscriptions enable row level security;

-- Users may read their own row and bootstrap a default free one. Upgrades only
-- come from the Stripe webhook (service role bypasses RLS), so there is
-- deliberately no user-facing UPDATE/DELETE policy.
drop policy if exists "subscriptions_select_own" on minmi.subscriptions;
drop policy if exists "subscriptions_insert_bootstrap" on minmi.subscriptions;
create policy "subscriptions_select_own" on minmi.subscriptions
  for select using (auth.uid() = user_id);
create policy "subscriptions_insert_bootstrap" on minmi.subscriptions
  for insert with check (
    auth.uid() = user_id
    and plan = 'free' and status = 'active'
    and stripe_customer_id is null
    and stripe_subscription_id is null
  );

drop trigger if exists subscriptions_updated_at on minmi.subscriptions;
create trigger subscriptions_updated_at before update on minmi.subscriptions
  for each row execute function minmi.set_updated_at();

-- ---------------------------------------------------------------- rotators

create table if not exists minmi.rotators (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 80),
  -- Public, unguessable id used in the image URL: /i/<slug>
  slug           text not null unique check (slug ~ '^[A-Za-z0-9]{8,32}$'),
  mode           text not null default 'sequential' check (mode in ('sequential', 'random')),
  active         boolean not null default true,
  open_count     bigint not null default 0,
  last_opened_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists rotators_user_idx on minmi.rotators (user_id, created_at desc);

create table if not exists minmi.rotator_images (
  id           uuid primary key default gen_random_uuid(),
  rotator_id   uuid not null references minmi.rotators(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- Exactly one source: a file in the minmi-images bucket, or an https URL.
  storage_path text,
  external_url text check (external_url is null or external_url ~* '^https://'),
  content_type text,
  label        text check (label is null or char_length(label) <= 120),
  position     integer not null default 0,
  serve_count  bigint not null default 0,
  created_at   timestamptz not null default now(),
  check ((storage_path is null) <> (external_url is null))
);

create index if not exists rotator_images_rotator_idx
  on minmi.rotator_images (rotator_id, position, created_at);

alter table minmi.rotators enable row level security;
alter table minmi.rotator_images enable row level security;

drop policy if exists "rotators_select_own" on minmi.rotators;
drop policy if exists "rotators_insert_own" on minmi.rotators;
drop policy if exists "rotators_update_own" on minmi.rotators;
drop policy if exists "rotators_delete_own" on minmi.rotators;
create policy "rotators_select_own" on minmi.rotators for select using (auth.uid() = user_id);
create policy "rotators_insert_own" on minmi.rotators for insert with check (auth.uid() = user_id);
create policy "rotators_update_own" on minmi.rotators for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rotators_delete_own" on minmi.rotators for delete using (auth.uid() = user_id);

drop policy if exists "rotator_images_select_own" on minmi.rotator_images;
drop policy if exists "rotator_images_insert_own" on minmi.rotator_images;
drop policy if exists "rotator_images_update_own" on minmi.rotator_images;
drop policy if exists "rotator_images_delete_own" on minmi.rotator_images;
create policy "rotator_images_select_own" on minmi.rotator_images for select using (auth.uid() = user_id);
create policy "rotator_images_insert_own" on minmi.rotator_images for insert with check (
  auth.uid() = user_id
  and exists (select 1 from minmi.rotators r where r.id = rotator_id and r.user_id = auth.uid())
);
create policy "rotator_images_update_own" on minmi.rotator_images for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rotator_images_delete_own" on minmi.rotator_images for delete using (auth.uid() = user_id);

drop trigger if exists rotators_updated_at on minmi.rotators;
create trigger rotators_updated_at before update on minmi.rotators
  for each row execute function minmi.set_updated_at();

-- Serve one open of a rotator: atomically bump its open counter, pick the
-- image for this open, and bump that image's serve counter.
--
--   sequential → image #(open_count - 1) mod n, in position order
--   random     → a uniformly random image
--
-- SECURITY DEFINER so the anonymous email client fetching /i/<slug> can use
-- it without being able to read anyone's rows directly. The UPDATE takes a
-- row lock, so concurrent opens of the same rotator get distinct counters.
-- Returns no row when the slug is unknown, paused, or has no images.
create or replace function minmi.next_rotator_image(p_slug text)
returns table (storage_path text, external_url text, content_type text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rotator minmi.rotators;
  v_count   integer;
  v_offset  integer;
  v_image   minmi.rotator_images;
begin
  update minmi.rotators r
     set open_count = r.open_count + 1,
         last_opened_at = now()
   where r.slug = p_slug and r.active
   returning * into v_rotator;
  if not found then
    return;
  end if;

  select count(*) into v_count from minmi.rotator_images i where i.rotator_id = v_rotator.id;
  if v_count = 0 then
    return;
  end if;

  if v_rotator.mode = 'random' then
    v_offset := floor(random() * v_count)::integer;
  else
    v_offset := ((v_rotator.open_count - 1) % v_count)::integer;
  end if;

  select * into v_image
    from minmi.rotator_images i
   where i.rotator_id = v_rotator.id
   order by i.position, i.created_at, i.id
  offset v_offset
   limit 1;

  update minmi.rotator_images i set serve_count = i.serve_count + 1 where i.id = v_image.id;

  return query select v_image.storage_path, v_image.external_url, v_image.content_type;
end $$;

revoke all on function minmi.next_rotator_image(text) from public;
grant execute on function minmi.next_rotator_image(text) to anon, authenticated, service_role;

-- Table access for signed-in users (RLS above still scopes every row to its
-- owner). `anon` gets no table access at all — only next_rotator_image().
grant select, insert, update, delete on all tables in schema minmi to authenticated;
grant all on all tables in schema minmi to service_role;

-- ---------------------------------------------------------------- storage

-- Public-read bucket: the /i/<slug> route fetches files by public URL. Files
-- are stored under <user_id>/<rotator_id>/<file>, and users may only write
-- inside their own <user_id>/ folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'minmi-images', 'minmi-images', true, 5242880,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "minmi_images_select_own" on storage.objects;
drop policy if exists "minmi_images_insert_own" on storage.objects;
drop policy if exists "minmi_images_update_own" on storage.objects;
drop policy if exists "minmi_images_delete_own" on storage.objects;
create policy "minmi_images_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'minmi-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "minmi_images_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'minmi-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "minmi_images_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'minmi-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "minmi_images_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'minmi-images' and (storage.foldername(name))[1] = auth.uid()::text);
