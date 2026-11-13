-- pisi-notes: weekly AI digest. Tracks when each subscriber last received a
-- digest so the dispatcher will not double-send within a week.

alter table pisi.subscriptions
  add column if not exists last_digest_at timestamptz;
