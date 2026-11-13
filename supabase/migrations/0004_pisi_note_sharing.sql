-- pisi-notes: public note sharing. A note with a share_token is readable by
-- anyone who has the (unguessable) token, via the get_shared_note function.

alter table pisi.notes
  add column if not exists share_token text,
  add column if not exists shared_at   timestamptz;

create unique index if not exists notes_share_token_idx
  on pisi.notes (share_token) where share_token is not null;

-- Public, read-only fetch of a single shared note by its token. SECURITY
-- DEFINER so an anonymous visitor (who can't pass the owner-scoped RLS on
-- pisi.notes) can still load a note they were given the link to. The token is
-- a 128-bit random value, so there is nothing to enumerate.
create or replace function pisi.get_shared_note(p_token text)
returns table (id uuid, content_md text, tags text[], created_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select n.id, n.content_md, n.tags, n.created_at
  from pisi.notes n
  where n.share_token = p_token
  limit 1;
$$;

revoke all on function pisi.get_shared_note(text) from public;
grant execute on function pisi.get_shared_note(text) to anon, authenticated;
