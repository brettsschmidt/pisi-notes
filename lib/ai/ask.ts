import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { format, parseISO } from "date-fns";
import { z } from "zod";
import { AI_MODEL, getAnthropic } from "./client";
import type { AskResult, AskSource, AskTurn } from "./types";
import type { NoteForAi } from "@/lib/queries/notes";

// The notes corpus is trimmed to this many characters before it's sent. Well
// within the model's context window, and the cacheable prefix means repeated
// questions in one session mostly read from cache rather than reprocessing.
const MAX_CORPUS_CHARS = 180_000;
const MAX_HISTORY_TURNS = 8;
const MAX_ANSWER_TOKENS = 2048;

// Structured output via forced tool use: the model must call this tool, and
// its arguments are the answer. Validated with Zod before we trust them.
const ANSWER_TOOL: Anthropic.Tool = {
  name: "answer",
  description: "Return the answer to the user's question about their notes.",
  input_schema: {
    type: "object",
    properties: {
      answer: {
        type: "string",
        description: "The answer in plain, friendly prose — no Markdown.",
      },
      sources: {
        type: "array",
        items: { type: "number" },
        description: "The [number] of every note used to answer. Empty when none was used.",
      },
    },
    required: ["answer", "sources"],
    additionalProperties: false,
  },
};

const AnswerSchema = z.object({
  answer: z.string(),
  sources: z.array(z.number()).optional(),
});

/** Strip pisi's internal markers so the model sees clean, readable note text. */
function stripForAi(md: string): string {
  return md
    .replace(/<!--task:[a-f0-9-]+-->/gi, "")
    .replace(/<!--reminder:[^>]*-->/gi, "")
    .replace(/\[@[^\]]*\]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function snippetOf(md: string): string {
  return stripForAi(md)
    .replace(/[#*_>`[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

function systemInstructions(today: string): string {
  return [
    "You are Pisi — the calm, friendly cat who lives inside pisi-notes, the user's personal note-taking app. The user is asking a question about their own notes.",
    "",
    "How to answer:",
    "- Use ONLY the content of the user's notes provided below. Treat those notes as the single source of truth.",
    "- Never use outside knowledge and never invent details. If the notes don't contain enough to answer, say so plainly — and, if useful, suggest what the user could jot down.",
    "- Be concise, warm, and direct. A sentence or a short paragraph is usually enough. Write in plain prose — no Markdown, headings, or bullet characters.",
    "- Paraphrase faithfully; don't overstate what a note says.",
    "- Call the `answer` tool exactly once. In `sources`, list the [number] of every note you drew from; if you used none, pass an empty list.",
    "",
    `Each note below is labelled with a [number] and the date it was written. Today is ${today}.`,
  ].join("\n");
}

/**
 * Answer a question grounded in the user's notes. The notes corpus is sent as
 * a cached system block so follow-up questions in the same session are cheap.
 * Throws on configuration or API errors — the caller maps that to a friendly
 * response.
 */
export async function runAskPisi(
  notes: NoteForAi[],
  question: string,
  history: AskTurn[],
): Promise<AskResult> {
  const client = getAnthropic();
  if (!client) throw new Error("Ask Pisi is not configured");

  // Build the numbered corpus, newest first, within the character budget.
  const included: NoteForAi[] = [];
  const entries: string[] = [];
  let chars = 0;
  for (const note of notes) {
    const body = stripForAi(note.content_md);
    if (!body) continue;
    const entry = `[${included.length + 1}] (written ${format(
      parseISO(note.created_at),
      "MMM d, yyyy",
    )})\n${body}`;
    if (chars + entry.length > MAX_CORPUS_CHARS) break;
    entries.push(entry);
    included.push(note);
    chars += entry.length + 2;
  }

  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: systemInstructions(format(new Date(), "MMMM d, yyyy")) },
    {
      type: "text",
      text: `The user's notes (newest first):\n\n${entries.join("\n\n")}`,
      // Stable across questions in a session → cached prefix, cheap follow-ups.
      cache_control: { type: "ephemeral" },
    },
  ];

  const messages: Anthropic.MessageParam[] = [];
  for (const turn of history.slice(-MAX_HISTORY_TURNS)) {
    messages.push({
      role: turn.role === "pisi" ? "assistant" : "user",
      content: turn.text,
    });
  }
  messages.push({ role: "user", content: question });

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: MAX_ANSWER_TOKENS,
    system,
    messages,
    tools: [ANSWER_TOOL],
    tool_choice: { type: "tool", name: "answer" },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Pisi did not return a structured answer");
  }
  const parsed = AnswerSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error("Pisi returned an answer that could not be parsed");
  }

  // Map the model's [number] citations back to real notes, clamped + de-duped.
  const sources: AskSource[] = [];
  const seen = new Set<number>();
  for (const n of parsed.data.sources ?? []) {
    if (!Number.isInteger(n) || n < 1 || n > included.length || seen.has(n)) continue;
    seen.add(n);
    const note = included[n - 1];
    sources.push({ id: note.id, date: note.created_at, snippet: snippetOf(note.content_md) });
  }

  return { answer: parsed.data.answer.trim(), sources };
}
