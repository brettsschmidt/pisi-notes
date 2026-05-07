-- pisi-notes: initial schema. Additive on the shared Supabase project that hosts Baby-food.

create extension if not exists pg_trgm;

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  content_md  text not null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notes_user_created_idx on public.notes (user_id, created_at desc);
create index if not exists notes_tags_gin_idx     on public.notes using gin (tags);
create index if not exists notes_content_trgm_idx on public.notes using gin (content_md gin_trgm_ops);

create table if not exists public.tasks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  note_id             uuid not null references public.notes(id) on delete cascade,
  text                text not null,
  done                boolean not null default false,
  completed_at        timestamptz,
  completion_note_id  uuid references public.notes(id) on delete set null,
  position            int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists tasks_user_open_idx       on public.tasks (user_id, done, created_at desc);
create index if not exists tasks_note_idx            on public.tasks (note_id);
create index if not exists tasks_completion_note_idx on public.tasks (completion_note_id);

alter table public.notes enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes for delete using (auth.uid() = user_id);

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

create or replace function public.pisi_set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at before update on public.notes
  for each row execute function public.pisi_set_updated_at();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.pisi_set_updated_at();

-- Atomic: flip task done state and rewrite the source note's checkbox.
create or replace function public.toggle_task(p_id uuid, p_done boolean)
returns public.tasks
language plpgsql
security invoker
as $$
declare
  v_task public.tasks;
  v_md text;
  v_pattern text;
  v_replacement text;
begin
  select * into v_task from public.tasks where id = p_id and user_id = auth.uid();
  if not found then
    raise exception 'task not found';
  end if;

  update public.tasks
     set done = p_done,
         completed_at = case when p_done then now() else null end
   where id = p_id
   returning * into v_task;

  select content_md into v_md from public.notes where id = v_task.note_id;
  v_pattern := '\[[ xX]\](\s*<!--task:' || v_task.id::text || '-->)';
  v_replacement := case when p_done then '[x]\1' else '[ ]\1' end;
  update public.notes
     set content_md = regexp_replace(v_md, v_pattern, v_replacement, 'g')
   where id = v_task.note_id;

  return v_task;
end $$;

grant execute on function public.toggle_task(uuid, boolean) to authenticated;
