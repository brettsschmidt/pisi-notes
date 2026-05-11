import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface TaskRow {
  id: string;
  note_id: string;
  text: string;
  done: boolean;
  completed_at: string | null;
  completion_note_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  note: {
    created_at: string;
    snippet: string;
  };
}

interface RawTaskJoin {
  id: string;
  note_id: string;
  text: string;
  done: boolean;
  completed_at: string | null;
  completion_note_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  notes: { created_at: string; content_md: string } | null;
}

export async function listTasks(opts: { done?: boolean } = {}): Promise<TaskRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("tasks")
    .select(
      "id, note_id, text, done, completed_at, completion_note_id, position, created_at, updated_at, notes!tasks_note_id_fkey!inner(created_at, content_md)",
    )
    .order("done", { ascending: true })
    .order("created_at", { ascending: true });

  if (opts.done !== undefined) q = q.eq("done", opts.done);

  const { data, error } = await q;
  if (error) throw error;

  return ((data ?? []) as unknown as RawTaskJoin[]).map((r) => ({
    id: r.id,
    note_id: r.note_id,
    text: r.text,
    done: r.done,
    completed_at: r.completed_at,
    completion_note_id: r.completion_note_id,
    position: r.position,
    created_at: r.created_at,
    updated_at: r.updated_at,
    note: {
      created_at: r.notes?.created_at ?? r.created_at,
      snippet: snippet(r.notes?.content_md ?? ""),
    },
  }));
}

export async function getTasksForNotes(noteIds: string[]): Promise<Map<string, TaskRow[]>> {
  const map = new Map<string, TaskRow[]>();
  if (noteIds.length === 0) return map;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, note_id, text, done, completed_at, completion_note_id, position, created_at, updated_at")
    .in("note_id", noteIds)
    .order("position", { ascending: true });
  if (error) throw error;
  for (const r of data ?? []) {
    const row: TaskRow = {
      ...r,
      note: { created_at: r.created_at, snippet: "" },
    };
    const list = map.get(r.note_id) ?? [];
    list.push(row);
    map.set(r.note_id, list);
  }
  return map;
}

function snippet(md: string): string {
  return md
    .replace(/<!--task:[a-f0-9-]+-->/g, "")
    .replace(/[#*_>`\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
