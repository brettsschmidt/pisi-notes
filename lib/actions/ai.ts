"use server";

import { createClient } from "@/lib/supabase/server";
import { entitlementsFor, FREE_AI_CREDITS } from "@/lib/billing/plans";
import { getSubscription } from "@/lib/billing/subscription";
import { isAiConfigured } from "@/lib/ai/client";
import { runAskPisi } from "@/lib/ai/ask";
import { runNoteAi } from "@/lib/ai/note-actions";
import { getNotesForAi } from "@/lib/queries/notes";
import type {
  AskPisiResponse,
  AskResult,
  AskTurn,
  NoteAiAction,
  NoteAiResponse,
  NoteAiResult,
} from "@/lib/ai/types";

const MAX_QUESTION_LEN = 1000;

/**
 * Answer a question with Ask Pisi. Enforces auth, AI configuration, and the
 * plan's AI entitlement, then meters one credit per successful answer.
 */
export async function askPisi(input: {
  question: string;
  history: AskTurn[];
}): Promise<AskPisiResponse> {
  const question = (input?.question ?? "").trim().slice(0, MAX_QUESTION_LEN);
  if (!question) {
    return { ok: false, reason: "error", message: "Type a question for Pisi first." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: "auth", message: "Please sign in to use Ask Pisi." };
  }

  if (!isAiConfigured()) {
    return {
      ok: false,
      reason: "unconfigured",
      message: "Ask Pisi isn’t enabled on this deployment yet.",
    };
  }

  const entitlements = entitlementsFor(await getSubscription());
  if (!entitlements.canUseAi) {
    return {
      ok: false,
      reason: "limit",
      message: `You’ve used all ${FREE_AI_CREDITS} free Ask Pisi questions. Upgrade to Pro for unlimited answers.`,
    };
  }

  const notes = await getNotesForAi();
  if (notes.length === 0) {
    return {
      ok: false,
      reason: "empty",
      message: "You haven’t written any notes yet — jot a few down and ask me again.",
    };
  }

  let result: AskResult;
  try {
    result = await runAskPisi(notes, question, Array.isArray(input.history) ? input.history : []);
  } catch (err) {
    console.error("askPisi failed", err);
    return {
      ok: false,
      reason: "error",
      message: "Pisi couldn’t answer that just now. Please try again in a moment.",
    };
  }

  // Meter the question only after a successful answer, so failed attempts are
  // free. Pro stays unlimited; the counter still advances so the free trial is
  // honoured if the account ever returns to the free plan.
  let creditsRemaining: number | null = null;
  const { data: used } = await supabase.rpc("consume_ai_credit");
  if (!entitlements.isPro && typeof used === "number") {
    creditsRemaining = Math.max(0, FREE_AI_CREDITS - used);
  }

  return { ok: true, answer: result.answer, sources: result.sources, creditsRemaining };
}

/**
 * Run a one-shot AI action (summarize / extract action items) against a single
 * note. Same auth, configuration, entitlement, and metering rules as askPisi.
 */
export async function noteAiAction(input: {
  noteId: string;
  action: NoteAiAction;
}): Promise<NoteAiResponse> {
  const requested = input?.action;
  const action: NoteAiAction =
    requested === "action_items" || requested === "suggest_tags" ? requested : "summarize";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "auth", message: "Please sign in to use Ask Pisi." };

  if (!isAiConfigured()) {
    return {
      ok: false,
      reason: "unconfigured",
      message: "Ask Pisi isn’t enabled on this deployment yet.",
    };
  }

  const entitlements = entitlementsFor(await getSubscription());
  if (!entitlements.canUseAi) {
    return {
      ok: false,
      reason: "limit",
      message: `You’ve used all ${FREE_AI_CREDITS} free AI questions. Upgrade to Pro for unlimited.`,
    };
  }

  const { data: note } = await supabase
    .from("notes")
    .select("content_md")
    .eq("id", input?.noteId ?? "")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!note) {
    return { ok: false, reason: "error", message: "That note couldn’t be found." };
  }

  let result: NoteAiResult;
  try {
    result = await runNoteAi(note.content_md, action);
  } catch (err) {
    console.error("noteAiAction failed", err);
    return {
      ok: false,
      reason: "error",
      message: "Pisi couldn’t do that just now. Please try again in a moment.",
    };
  }

  let creditsRemaining: number | null = null;
  const { data: used } = await supabase.rpc("consume_ai_credit");
  if (!entitlements.isPro && typeof used === "number") {
    creditsRemaining = Math.max(0, FREE_AI_CREDITS - used);
  }

  return { ok: true, creditsRemaining, ...result };
}
