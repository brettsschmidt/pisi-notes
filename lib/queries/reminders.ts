import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ReminderRow {
  id: string;
  note_id: string;
  text: string;
  done: boolean;
  completed_at: string | null;
  remind_at: string | null;
  reminded_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

const REMINDER_FIELDS =
  "id, note_id, text, done, completed_at, remind_at, reminded_at, position, created_at, updated_at";

export async function getRemindersForNotes(noteIds: string[]): Promise<Map<string, ReminderRow[]>> {
  const map = new Map<string, ReminderRow[]>();
  if (noteIds.length === 0) return map;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select(REMINDER_FIELDS)
    .in("note_id", noteIds)
    .order("position", { ascending: true });
  if (error) throw error;
  for (const r of data ?? []) {
    const list = map.get(r.note_id) ?? [];
    list.push(r);
    map.set(r.note_id, list);
  }
  return map;
}
