// Shared, runtime-free types for the Ask Pisi feature — safe to import from
// both server modules and client components.

export interface AskSource {
  /** The source note's id, for deep-linking to /notes#note-<id>. */
  id: string;
  /** The note's created_at timestamp (ISO). */
  date: string;
  /** A short preview of the note's content. */
  snippet: string;
}

export interface AskTurn {
  role: "user" | "pisi";
  text: string;
}

export interface AskResult {
  answer: string;
  sources: AskSource[];
}

export type AskPisiResponse =
  | {
      ok: true;
      answer: string;
      sources: AskSource[];
      /** Free-trial questions left after this one; null for Pro (unlimited). */
      creditsRemaining: number | null;
    }
  | {
      ok: false;
      reason: "auth" | "unconfigured" | "limit" | "empty" | "error";
      message: string;
    };

// --- Per-note AI actions (Summarize / Find action items) -------------------

export type NoteAiAction = "summarize" | "action_items" | "suggest_tags";

export type NoteAiResult =
  | { action: "summarize"; summary: string }
  | { action: "action_items"; items: string[] }
  | { action: "suggest_tags"; tags: string[] };

export type NoteAiResponse =
  | ({ ok: true; creditsRemaining: number | null } & NoteAiResult)
  | {
      ok: false;
      reason: "auth" | "unconfigured" | "limit" | "error";
      message: string;
    };
