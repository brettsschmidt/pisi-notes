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

export interface UpcomingReminderDate {
  /** YYYY-MM-DD in the user's local time. */
  date: string;
  /** Count of open (not-done) reminders that fall on this date. */
  count: number;
  /** Most recent reminder creation for this date — used to un-hide. */
  latestAt: string;
}

/**
 * Distinct dates (in local time) that have at least one open reminder,
 * sorted earliest first. Used by the sidebar's optional Reminders section.
 */
export async function getUpcomingReminderDates(): Promise<UpcomingReminderDate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("remind_at, created_at")
    .eq("done", false)
    .not("remind_at", "is", null)
    .order("remind_at", { ascending: true });
  if (error) throw error;

  const counts = new Map<string, number>();
  const latest = new Map<string, string>();
  for (const row of data ?? []) {
    if (!row.remind_at) continue;
    const key = localDateKey(new Date(row.remind_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
    const prev = latest.get(key);
    if (!prev || row.created_at > prev) latest.set(key, row.created_at);
  }
  return [...counts.entries()]
    .map(([date, count]) => ({ date, count, latestAt: latest.get(date) ?? new Date(0).toISOString() }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Note IDs that have at least one reminder on the given local date.
 * Used by `getRecentNotes` when the timeline is filtered via `?remind=`.
 */
export async function getNoteIdsRemindingOn(date: string): Promise<string[]> {
  const supabase = await createClient();
  // 24-hour window starting at local midnight; UTC bounds depend on the
  // server, but for a single-user app where the dispatcher and the user
  // share a timezone this is close enough. Widening to ±12h covers most
  // edge cases without dragging in tz infrastructure.
  const day = new Date(`${date}T00:00:00`);
  const start = new Date(day.getTime() - 12 * 60 * 60 * 1000).toISOString();
  const end = new Date(day.getTime() + 36 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("reminders")
    .select("note_id, remind_at")
    .not("remind_at", "is", null)
    .gte("remind_at", start)
    .lte("remind_at", end);
  if (error) throw error;
  const ids = new Set<string>();
  for (const r of data ?? []) {
    if (!r.remind_at) continue;
    if (localDateKey(new Date(r.remind_at)) === date) {
      ids.add(r.note_id);
    }
  }
  return [...ids];
}

function localDateKey(d: Date): string {
  // YYYY-MM-DD in the runtime's local time. Avoid Intl for predictability.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
