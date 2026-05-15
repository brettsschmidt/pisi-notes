-- Reminders + due dates on tasks, a separate reminders concept on notes,
-- and push subscription storage for web push.

alter table public.tasks
  add column if not exists due_at      timestamptz,
  add column if not exists remind_at   timestamptz,
  add column if not exists reminded_at timestamptz;

create index if not exists tasks_due_idx    on public.tasks (user_id, due_at)   where due_at    is not null;
create index if not exists tasks_remind_idx on public.tasks (remind_at)         where remind_at is not null and reminded_at is null;

create table if not exists public.reminders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  note_id      uuid not null references public.notes(id) on delete cascade,
  text         text not null,
  remind_at    timestamptz,
  reminded_at  timestamptz,
  done         boolean not null default false,
  completed_at timestamptz,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists reminders_user_open_idx on public.reminders (user_id, done, created_at desc);
create index if not exists reminders_note_idx      on public.reminders (note_id);
create index if not exists reminders_due_idx       on public.reminders (remind_at) where remind_at is not null and reminded_at is null;

alter table public.reminders enable row level security;

drop policy if exists "reminders_select_own" on public.reminders;
drop policy if exists "reminders_insert_own" on public.reminders;
drop policy if exists "reminders_update_own" on public.reminders;
drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_select_own" on public.reminders for select using (auth.uid() = user_id);
create policy "reminders_insert_own" on public.reminders for insert with check (auth.uid() = user_id);
create policy "reminders_update_own" on public.reminders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminders_delete_own" on public.reminders for delete using (auth.uid() = user_id);

drop trigger if exists reminders_updated_at on public.reminders;
create trigger reminders_updated_at before update on public.reminders
  for each row execute function public.pisi_set_updated_at();

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subs_select_own" on public.push_subscriptions;
drop policy if exists "push_subs_insert_own" on public.push_subscriptions;
drop policy if exists "push_subs_update_own" on public.push_subscriptions;
drop policy if exists "push_subs_delete_own" on public.push_subscriptions;
create policy "push_subs_select_own" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "push_subs_insert_own" on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_subs_update_own" on public.push_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push_subs_delete_own" on public.push_subscriptions for delete using (auth.uid() = user_id);

drop trigger if exists push_subscriptions_updated_at on public.push_subscriptions;
create trigger push_subscriptions_updated_at before update on public.push_subscriptions
  for each row execute function public.pisi_set_updated_at();

-- Setting a new remind_at clears reminded_at so the dispatcher fires again.
create or replace function public.pisi_reset_reminded_at() returns trigger as $$
begin
  if new.remind_at is distinct from old.remind_at then
    new.reminded_at := null;
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists tasks_reset_reminded_at on public.tasks;
create trigger tasks_reset_reminded_at before update on public.tasks
  for each row execute function public.pisi_reset_reminded_at();

drop trigger if exists reminders_reset_reminded_at on public.reminders;
create trigger reminders_reset_reminded_at before update on public.reminders
  for each row execute function public.pisi_reset_reminded_at();

-- Atomic: flip reminder done state and rewrite the source note's marker.
create or replace function public.toggle_reminder(p_id uuid, p_done boolean)
returns public.reminders
language plpgsql
security invoker
as $$
declare
  v_rem public.reminders;
  v_md text;
  v_pattern text;
  v_replacement text;
begin
  select * into v_rem from public.reminders where id = p_id and user_id = auth.uid();
  if not found then
    raise exception 'reminder not found';
  end if;

  update public.reminders
     set done = p_done,
         completed_at = case when p_done then now() else null end
   where id = p_id
   returning * into v_rem;

  select content_md into v_md from public.notes where id = v_rem.note_id;
  v_pattern := '\(([ xX])\)(\s*<!--reminder:' || v_rem.id::text || '[^>]*-->)';
  v_replacement := case when p_done then '(x)\2' else '( )\2' end;
  update public.notes
     set content_md = regexp_replace(v_md, v_pattern, v_replacement, 'g')
   where id = v_rem.note_id;

  return v_rem;
end $$;

grant execute on function public.toggle_reminder(uuid, boolean) to authenticated;
