"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNote } from "@/lib/actions/notes";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  return { supabase, user };
}

export async function toggleTask(taskId: string, done: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("toggle_task", { p_id: taskId, p_done: done });
  if (error) throw error;
  revalidatePath("/notes");
  revalidatePath("/tasks");
}

export async function setTaskDueDate(taskId: string, dueAt: string | null) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").update({ due_at: dueAt }).eq("id", taskId);
  if (error) throw error;
  revalidatePath("/notes");
  revalidatePath("/tasks");
}

export async function setTaskReminder(taskId: string, remindAt: string | null) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .update({ remind_at: remindAt })
    .eq("id", taskId);
  if (error) throw error;
  revalidatePath("/notes");
  revalidatePath("/tasks");
}

export async function toggleReminder(reminderId: string, done: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("toggle_reminder", { p_id: reminderId, p_done: done });
  if (error) throw error;
  revalidatePath("/notes");
  revalidatePath("/tasks");
}

export async function setReminderTime(reminderId: string, remindAt: string | null) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("reminders")
    .update({ remind_at: remindAt })
    .eq("id", reminderId);
  if (error) throw error;
  revalidatePath("/notes");
  revalidatePath("/tasks");
}

export interface CompletionNoteOptions {
  taskId: string;
  content_md: string;
  alsoMarkDone?: boolean;
}

export async function createCompletionNote({ taskId, content_md, alsoMarkDone = true }: CompletionNoteOptions) {
  const { supabase } = await requireUser();
  const { id: noteId } = await createNote(content_md);

  const { error } = await supabase.from("tasks").update({ completion_note_id: noteId }).eq("id", taskId);
  if (error) throw error;

  if (alsoMarkDone) {
    await supabase.rpc("toggle_task", { p_id: taskId, p_done: true });
  }
  revalidatePath("/notes");
  revalidatePath("/tasks");
  return { noteId };
}
