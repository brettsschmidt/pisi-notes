"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUserAndSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  return { supabase, user };
}

function revalidateAll() {
  revalidatePath("/notes");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/settings");
}

export async function setUserPref(
  key: "show_reminders_in_sidebar",
  value: boolean,
): Promise<void> {
  const { supabase, user } = await requireUserAndSupabase();
  const { error } = await supabase
    .from("user_prefs")
    .upsert({ user_id: user.id, [key]: value }, { onConflict: "user_id" });
  if (error) throw error;
  revalidateAll();
}

export async function hideSidebarTag(tag: string): Promise<void> {
  const { supabase, user } = await requireUserAndSupabase();
  const { data } = await supabase
    .from("user_prefs")
    .select("hidden_tags")
    .eq("user_id", user.id)
    .maybeSingle();

  const current = (data?.hidden_tags ?? []).filter((h) => h.tag !== tag);
  const next = [...current, { tag, hidden_at: new Date().toISOString() }];

  const { error } = await supabase
    .from("user_prefs")
    .upsert({ user_id: user.id, hidden_tags: next }, { onConflict: "user_id" });
  if (error) throw error;
  revalidateAll();
}

export async function unhideSidebarTag(tag: string): Promise<void> {
  const { supabase, user } = await requireUserAndSupabase();
  const { data } = await supabase
    .from("user_prefs")
    .select("hidden_tags")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return;

  const next = (data.hidden_tags ?? []).filter((h) => h.tag !== tag);
  const { error } = await supabase
    .from("user_prefs")
    .update({ hidden_tags: next })
    .eq("user_id", user.id);
  if (error) throw error;
  revalidateAll();
}

export async function hideSidebarReminderDate(date: string): Promise<void> {
  const { supabase, user } = await requireUserAndSupabase();
  const { data } = await supabase
    .from("user_prefs")
    .select("hidden_reminder_dates")
    .eq("user_id", user.id)
    .maybeSingle();

  const current = (data?.hidden_reminder_dates ?? []).filter((h) => h.date !== date);
  const next = [...current, { date, hidden_at: new Date().toISOString() }];

  const { error } = await supabase
    .from("user_prefs")
    .upsert({ user_id: user.id, hidden_reminder_dates: next }, { onConflict: "user_id" });
  if (error) throw error;
  revalidateAll();
}

export async function unhideSidebarReminderDate(date: string): Promise<void> {
  const { supabase, user } = await requireUserAndSupabase();
  const { data } = await supabase
    .from("user_prefs")
    .select("hidden_reminder_dates")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return;

  const next = (data.hidden_reminder_dates ?? []).filter((h) => h.date !== date);
  const { error } = await supabase
    .from("user_prefs")
    .update({ hidden_reminder_dates: next })
    .eq("user_id", user.id);
  if (error) throw error;
  revalidateAll();
}
