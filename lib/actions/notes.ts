"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractHashtags } from "@/lib/tags";
import {
  normalizeTaskMarkdown,
  parseRemindersFromMarkdown,
  parseTasksFromMarkdown,
} from "@/lib/tasks-md";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  return { supabase, user };
}

async function syncTasksForNote(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  noteId: string,
  md: string,
) {
  const parsed = parseTasksFromMarkdown(md);
  const { data: existing } = await supabase.from("tasks").select("id, done").eq("note_id", noteId);
  const existingMap = new Map((existing ?? []).map((t) => [t.id, t]));
  const seen = new Set<string>();

  for (const task of parsed) {
    seen.add(task.id);
    const prior = existingMap.get(task.id);
    if (!prior) {
      await supabase.from("tasks").insert({
        id: task.id,
        user_id: userId,
        note_id: noteId,
        text: task.text,
        done: task.done,
        position: task.position,
        completed_at: task.done ? new Date().toISOString() : null,
      });
    } else {
      const update: {
        text: string;
        position: number;
        done?: boolean;
        completed_at?: string | null;
      } = { text: task.text, position: task.position };
      if (prior.done !== task.done) {
        update.done = task.done;
        update.completed_at = task.done ? new Date().toISOString() : null;
      }
      await supabase.from("tasks").update(update).eq("id", task.id);
    }
  }

  const orphans = (existing ?? []).filter((t) => !seen.has(t.id)).map((t) => t.id);
  if (orphans.length) {
    await supabase.from("tasks").delete().in("id", orphans);
  }
}

async function syncRemindersForNote(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  noteId: string,
  md: string,
) {
  const parsed = parseRemindersFromMarkdown(md);
  const { data: existing } = await supabase.from("reminders").select("id, done").eq("note_id", noteId);
  const existingMap = new Map((existing ?? []).map((r) => [r.id, r]));
  const seen = new Set<string>();

  for (const rem of parsed) {
    seen.add(rem.id);
    const prior = existingMap.get(rem.id);
    if (!prior) {
      await supabase.from("reminders").insert({
        id: rem.id,
        user_id: userId,
        note_id: noteId,
        text: rem.text,
        done: rem.done,
        position: rem.position,
        completed_at: rem.done ? new Date().toISOString() : null,
      });
    } else {
      const update: {
        text: string;
        position: number;
        done?: boolean;
        completed_at?: string | null;
      } = { text: rem.text, position: rem.position };
      if (prior.done !== rem.done) {
        update.done = rem.done;
        update.completed_at = rem.done ? new Date().toISOString() : null;
      }
      await supabase.from("reminders").update(update).eq("id", rem.id);
    }
  }

  const orphans = (existing ?? []).filter((r) => !seen.has(r.id)).map((r) => r.id);
  if (orphans.length) {
    await supabase.from("reminders").delete().in("id", orphans);
  }
}

export async function createNote(content_md: string): Promise<{ id: string }> {
  const trimmed = content_md.trim();
  if (!trimmed) throw new Error("note is empty");
  const { supabase, user } = await requireUser();
  const normalized = normalizeTaskMarkdown(trimmed);
  const tags = extractHashtags(normalized);

  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: user.id, content_md: normalized, tags })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("failed to insert note");

  await syncTasksForNote(supabase, user.id, data.id, normalized);
  await syncRemindersForNote(supabase, user.id, data.id, normalized);
  revalidatePath("/notes");
  revalidatePath("/tasks");
  return { id: data.id };
}

export async function updateNote(id: string, content_md: string) {
  const trimmed = content_md.trim();
  if (!trimmed) throw new Error("note is empty");
  const { supabase, user } = await requireUser();
  const normalized = normalizeTaskMarkdown(trimmed);
  const tags = extractHashtags(normalized);

  const { error } = await supabase
    .from("notes")
    .update({ content_md: normalized, tags })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;

  await syncTasksForNote(supabase, user.id, id, normalized);
  await syncRemindersForNote(supabase, user.id, id, normalized);
  revalidatePath("/notes");
  revalidatePath("/tasks");
}

export async function deleteNote(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/notes");
  revalidatePath("/tasks");
}

export async function archiveNote(id: string) {
  const { supabase, user } = await requireUser();
  // Strip tags on archive: the note keeps appearing in the timeline but
  // disappears from the tag sidebar / tag filter / search.
  const { error } = await supabase
    .from("notes")
    .update({ archived_at: new Date().toISOString(), tags: [] })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/notes");
  revalidatePath("/tasks");
}

export async function unarchiveNote(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notes")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/notes");
  revalidatePath("/tasks");
}
