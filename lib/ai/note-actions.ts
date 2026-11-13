import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AI_MODEL, getAnthropic } from "./client";
import { stripNoteMarkers } from "@/lib/markdown";
import type { NoteAiAction, NoteAiResult } from "./types";

const MAX_NOTE_CHARS = 12_000;

const SUMMARY_TOOL: Anthropic.Tool = {
  name: "summary",
  description: "Return a short summary of the note.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "A one or two sentence summary, plain prose." },
    },
    required: ["summary"],
    additionalProperties: false,
  },
};

const ACTION_ITEMS_TOOL: Anthropic.Tool = {
  name: "action_items",
  description: "Return the concrete action items found in the note.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: { type: "string" },
        description:
          "Each actionable to-do as a short imperative phrase. Empty list when the note has none.",
      },
    },
    required: ["items"],
    additionalProperties: false,
  },
};

const SUGGEST_TAGS_TOOL: Anthropic.Tool = {
  name: "suggest_tags",
  description: "Suggest hashtag-style category tags for the note.",
  input_schema: {
    type: "object",
    properties: {
      tags: {
        type: "array",
        items: { type: "string" },
        description:
          "2 to 5 short lowercase category tags (one or two words, no '#'). Reusable themes, not specifics. Skip tags already present in the note.",
      },
    },
    required: ["tags"],
    additionalProperties: false,
  },
};

const ACTION_SPEC: Record<NoteAiAction, { tool: Anthropic.Tool; instruction: string }> = {
  summarize: {
    tool: SUMMARY_TOOL,
    instruction:
      "Summarize this note in one or two plain sentences. Capture the gist, not every detail.",
  },
  action_items: {
    tool: ACTION_ITEMS_TOOL,
    instruction:
      "Find every concrete action item or task in this note — things the user intends or needs to do. Phrase each as a short imperative. Return an empty list if there are none, and never invent items the note doesn't support.",
  },
  suggest_tags: {
    tool: SUGGEST_TAGS_TOOL,
    instruction:
      "Suggest 2 to 5 short, lowercase, hashtag-style category tags that capture this note's topics. Prefer reusable themes over specifics, and don't repeat any #tag already written in the note.",
  },
};

const SummarySchema = z.object({ summary: z.string() });
const ActionItemsSchema = z.object({ items: z.array(z.string()) });
const TagsSchema = z.object({ tags: z.array(z.string()) });

/** Normalize an AI-suggested tag to the app's hashtag charset. */
function cleanTag(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

/**
 * Run a one-shot AI action against a single note. Throws on configuration or
 * API errors — the caller maps that to a friendly response.
 */
export async function runNoteAi(
  noteContent: string,
  action: NoteAiAction,
): Promise<NoteAiResult> {
  const client = getAnthropic();
  if (!client) throw new Error("Ask Pisi is not configured");

  const note = stripNoteMarkers(noteContent).slice(0, MAX_NOTE_CHARS);
  const { tool, instruction } = ACTION_SPEC[action];

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system:
      "You are Pisi, a careful assistant working with a single note from the user's notebook. Work only from the note's text — never invent details.",
    messages: [{ role: "user", content: `${instruction}\n\n--- NOTE ---\n${note}` }],
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Pisi returned no structured result");
  }

  if (action === "summarize") {
    const parsed = SummarySchema.safeParse(toolUse.input);
    if (!parsed.success) throw new Error("Pisi returned an unparseable summary");
    return { action: "summarize", summary: parsed.data.summary.trim() };
  }

  if (action === "action_items") {
    const parsed = ActionItemsSchema.safeParse(toolUse.input);
    if (!parsed.success) throw new Error("Pisi returned unparseable action items");
    return {
      action: "action_items",
      items: parsed.data.items.map((s) => s.trim()).filter(Boolean),
    };
  }

  const parsed = TagsSchema.safeParse(toolUse.input);
  if (!parsed.success) throw new Error("Pisi returned unparseable tags");
  const tags = [...new Set(parsed.data.tags.map(cleanTag).filter(Boolean))].slice(0, 5);
  return { action: "suggest_tags", tags };
}
