import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { format, parseISO } from "date-fns";
import { z } from "zod";
import { AI_MODEL, getAnthropic } from "./client";
import { stripNoteMarkers } from "@/lib/markdown";

export interface DigestNote {
  content_md: string;
  created_at: string;
}

export interface Digest {
  /** Short push-notification title. */
  headline: string;
  /** 1–3 plain sentences — the notification body. */
  body: string;
}

const DIGEST_TOOL: Anthropic.Tool = {
  name: "digest",
  description: "Return a short weekly digest of the user's notes.",
  input_schema: {
    type: "object",
    properties: {
      headline: {
        type: "string",
        description: "A short, warm push-notification title — about 4 to 7 words.",
      },
      body: {
        type: "string",
        description:
          "One to three plain sentences: the week's themes, wins, and any open threads. Warm and specific to the notes.",
      },
    },
    required: ["headline", "body"],
    additionalProperties: false,
  },
};

const DigestSchema = z.object({ headline: z.string(), body: z.string() });

/** Generate a weekly digest from a user's recent notes. Throws on AI errors. */
export async function generateDigest(notes: DigestNote[]): Promise<Digest> {
  const client = getAnthropic();
  if (!client) throw new Error("Ask Pisi is not configured");

  const lines = notes
    .slice(0, 200)
    .map((n) => `(${format(parseISO(n.created_at), "EEE MMM d")}) ${stripNoteMarkers(n.content_md)}`)
    .filter((l) => l.trim().length > 8);

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 600,
    system:
      "You are Pisi, the friendly cat inside the user's note-taking app. Write a brief, warm weekly digest of what they wrote this week — surface the themes, the wins, and anything still open or unresolved. Be specific to their actual notes, never generic. Plain text, no Markdown. It arrives as a phone notification, so keep it short and human.",
    messages: [
      { role: "user", content: `Here are my notes from the past week:\n\n${lines.join("\n")}` },
    ],
    tools: [DIGEST_TOOL],
    tool_choice: { type: "tool", name: "digest" },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Digest: no structured result");
  }
  const parsed = DigestSchema.safeParse(toolUse.input);
  if (!parsed.success) throw new Error("Digest: unparseable result");
  return { headline: parsed.data.headline.trim(), body: parsed.data.body.trim() };
}
