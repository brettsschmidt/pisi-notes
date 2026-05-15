import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getNoteIdsRemindingOn } from "@/lib/queries/reminders";

export interface NoteRow {
  id: string;
  content_md: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface NoteFilters {
  tags?: string[];
  search?: string;
  /** YYYY-MM-DD — show only notes with at least one reminder on this day. */
  remindDate?: string;
  limit?: number;
}

export async function getRecentNotes(filters: NoteFilters = {}): Promise<NoteRow[]> {
  const supabase = await createClient();
  const limit = filters.limit ?? 200;
  let q = supabase
    .from("notes")
    .select("id, content_md, tags, created_at, updated_at, archived_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Archive rules: archived notes show in the default timeline (visibly
  // flagged) but are excluded once the user starts filtering — they don't
  // match tag filters, text search, or reminder-date filters.
  const filtering =
    (filters.tags && filters.tags.length > 0) ||
    !!filters.search?.trim() ||
    !!filters.remindDate;
  if (filtering) {
    q = q.is("archived_at", null);
  }

  if (filters.tags && filters.tags.length > 0) {
    q = q.contains("tags", filters.tags);
  }
  if (filters.search && filters.search.trim()) {
    q = q.ilike("content_md", `%${filters.search.trim()}%`);
  }
  if (filters.remindDate) {
    const ids = await getNoteIdsRemindingOn(filters.remindDate);
    if (ids.length === 0) return [];
    q = q.in("id", ids);
  }

  const { data, error } = await q;
  if (error) throw error;
  // Reverse so the timeline can render oldest → newest.
  return (data ?? []).slice().reverse();
}

export interface TagCount {
  tag: string;
  count: number;
  /** Most recent note creation that contains this tag — used to un-hide. */
  latestAt: string;
}

export async function getTagCounts(): Promise<TagCount[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Pull raw rows and aggregate client-side; this avoids needing a custom RPC
  // and the row count per user is bounded by the user's notes (small).
  // Archived notes are excluded from tag counts (their tags are also stripped).
  const { data, error } = await supabase
    .from("notes")
    .select("tags, created_at")
    .is("archived_at", null);
  if (error) throw error;
  const counts = new Map<string, number>();
  const latest = new Map<string, string>();
  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
      const prev = latest.get(tag);
      if (!prev || row.created_at > prev) latest.set(tag, row.created_at);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count, latestAt: latest.get(tag) ?? new Date(0).toISOString() }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getOpenTaskCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("done", false);
  return count ?? 0;
}
