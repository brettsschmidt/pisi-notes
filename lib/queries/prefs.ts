import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface HiddenTag {
  tag: string;
  hiddenAt: string;
}

export interface HiddenReminderDate {
  date: string;
  hiddenAt: string;
}

export interface UserPrefs {
  showRemindersInSidebar: boolean;
  hiddenTags: HiddenTag[];
  hiddenReminderDates: HiddenReminderDate[];
}

const DEFAULT_PREFS: UserPrefs = {
  showRemindersInSidebar: false,
  hiddenTags: [],
  hiddenReminderDates: [],
};

export async function getUserPrefs(): Promise<UserPrefs> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_PREFS;

  const { data } = await supabase
    .from("user_prefs")
    .select("show_reminders_in_sidebar, hidden_tags, hidden_reminder_dates")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return DEFAULT_PREFS;
  return {
    showRemindersInSidebar: data.show_reminders_in_sidebar,
    hiddenTags: (data.hidden_tags ?? []).map((h) => ({ tag: h.tag, hiddenAt: h.hidden_at })),
    hiddenReminderDates: (data.hidden_reminder_dates ?? []).map((h) => ({
      date: h.date,
      hiddenAt: h.hidden_at,
    })),
  };
}
