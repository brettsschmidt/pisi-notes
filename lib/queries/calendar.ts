import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ScheduledItem {
  kind: "reminder" | "task";
  id: string;
  note_id: string;
  text: string;
  scheduled_at: string;
  done: boolean;
  note_snippet: string;
}

/**
 * Return everything currently scheduled (reminders with `remind_at` set, plus
 * tasks with `due_at` or `remind_at` set). The calendar view groups these by
 * day client-side so we can render markers per date.
 */
export async function getScheduled(): Promise<ScheduledItem[]> {
  const supabase = await createClient();

  const [remindersRes, tasksRes] = await Promise.all([
    supabase
      .from("reminders")
      .select("id, note_id, text, remind_at, done, notes!inner(content_md)")
      .not("remind_at", "is", null),
    supabase
      .from("tasks")
      .select(
        "id, note_id, text, due_at, remind_at, done, notes!tasks_note_id_fkey!inner(content_md)",
      )
      .or("due_at.not.is.null,remind_at.not.is.null"),
  ]);

  if (remindersRes.error) throw remindersRes.error;
  if (tasksRes.error) throw tasksRes.error;

  const out: ScheduledItem[] = [];

  for (const r of remindersRes.data ?? []) {
    if (!r.remind_at) continue;
    const noteMd = extractNoteMd(r.notes);
    out.push({
      kind: "reminder",
      id: r.id,
      note_id: r.note_id,
      text: r.text,
      scheduled_at: r.remind_at,
      done: r.done,
      note_snippet: snippet(noteMd),
    });
  }

  for (const t of tasksRes.data ?? []) {
    const when = t.remind_at ?? t.due_at;
    if (!when) continue;
    const noteMd = extractNoteMd(t.notes);
    out.push({
      kind: "task",
      id: t.id,
      note_id: t.note_id,
      text: t.text,
      scheduled_at: when,
      done: t.done,
      note_snippet: snippet(noteMd),
    });
  }

  out.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  return out;
}

// PostgREST embed returns either an object or an array depending on the
// relationship — coerce to a string so callers don't have to.
function extractNoteMd(notes: unknown): string {
  if (!notes) return "";
  if (Array.isArray(notes)) {
    return (notes[0] as { content_md?: string } | undefined)?.content_md ?? "";
  }
  return (notes as { content_md?: string }).content_md ?? "";
}

function snippet(md: string): string {
  return md
    .replace(/<!--task:[a-f0-9-]+-->/g, "")
    .replace(/<!--reminder:[a-f0-9-]+(?:@[^>]+)?-->/g, "")
    .replace(/^\s*[-*+]\s*\[[ xX]\]\s*/gm, "")
    .replace(/^\s*\([ xX]\)\s*/gm, "")
    .replace(/[#*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
