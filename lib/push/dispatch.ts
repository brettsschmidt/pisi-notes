import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush, type PushSubscription as WP } from "./webpush";
import { vapidKeys } from "./config";

export interface DispatchResult {
  scanned: number;
  fired: number;
  sent: number;
  removed: number;
  failed: number;
}

interface DueRow {
  kind: "task" | "reminder";
  id: string;
  user_id: string;
  text: string;
  note_id: string;
  remind_at: string;
}

export async function dispatchDueReminders(now: Date = new Date()): Promise<DispatchResult> {
  const result: DispatchResult = { scanned: 0, fired: 0, sent: 0, removed: 0, failed: 0 };
  const keys = vapidKeys();
  if (!keys) {
    throw new Error("VAPID keys not configured (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)");
  }
  const supabase = createAdminClient();
  const nowIso = now.toISOString();

  const [{ data: taskRows }, { data: reminderRows }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, user_id, text, note_id, remind_at")
      .lte("remind_at", nowIso)
      .is("reminded_at", null)
      .eq("done", false)
      .limit(200),
    supabase
      .from("reminders")
      .select("id, user_id, text, note_id, remind_at")
      .lte("remind_at", nowIso)
      .is("reminded_at", null)
      .eq("done", false)
      .limit(200),
  ]);

  const due: DueRow[] = [
    ...(taskRows ?? []).map((r): DueRow => ({
      kind: "task",
      id: r.id,
      user_id: r.user_id,
      text: r.text,
      note_id: r.note_id,
      remind_at: r.remind_at as string,
    })),
    ...(reminderRows ?? []).map((r): DueRow => ({
      kind: "reminder",
      id: r.id,
      user_id: r.user_id,
      text: r.text,
      note_id: r.note_id,
      remind_at: r.remind_at as string,
    })),
  ];

  result.scanned = due.length;
  if (due.length === 0) return result;

  // Group by user so we fetch each user's subscriptions once.
  const byUser = new Map<string, DueRow[]>();
  for (const d of due) {
    const list = byUser.get(d.user_id) ?? [];
    list.push(d);
    byUser.set(d.user_id, list);
  }

  for (const [userId, items] of byUser) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    for (const item of items) {
      result.fired += 1;
      const payload = JSON.stringify({
        kind: item.kind,
        id: item.id,
        title: item.kind === "task" ? "Task reminder" : "Reminder",
        body: item.text,
        url: `/notes#note-${item.note_id}`,
      });

      let anySent = false;
      for (const sub of subs ?? []) {
        try {
          const r = await sendPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth } as WP,
            payload,
            keys,
          );
          if (r.ok) {
            result.sent += 1;
            anySent = true;
          } else if (r.gone) {
            result.removed += 1;
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          } else {
            result.failed += 1;
          }
        } catch {
          result.failed += 1;
        }
      }

      // Mark fired even if no subs — otherwise we'd retry forever.
      if (item.kind === "task") {
        await supabase.from("tasks").update({ reminded_at: nowIso }).eq("id", item.id);
      } else {
        await supabase.from("reminders").update({ reminded_at: nowIso }).eq("id", item.id);
      }
      // anySent is informational; nothing further to do.
      void anySent;
    }
  }

  return result;
}
