import "server-only";
import { createClient } from "@/lib/supabase/server";

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
  // match tag filters (their tags were stripped on archive) or text search.
  const filtering = (filters.tags && filters.tags.length > 0) || !!filters.search?.trim();
  if (filtering) {
    q = q.is("archived_at", null);
  }

  if (filters.tags && filters.tags.length > 0) {
    q = q.contains("tags", filters.tags);
  }
  if (filters.search && filters.search.trim()) {
    q = q.ilike("content_md", `%${filters.search.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  // Reverse so the timeline can render oldest → newest.
  return (data ?? []).slice().reverse();
}

export async function getTagCounts(): Promise<{ tag: string; count: number }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Pull raw rows and aggregate client-side; this avoids needing a custom RPC
  // and the row count per user is bounded by the user's notes (small).
  // Archived notes are excluded from tag counts (their tags are also stripped).
  const { data, error } = await supabase.from("notes").select("tags").is("archived_at", null);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
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
