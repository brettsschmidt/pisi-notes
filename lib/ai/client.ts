import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Ask Pisi is optional — the feature degrades to a clear "not enabled" state
 * when ANTHROPIC_API_KEY is absent, so the app runs fine without it.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Model used for Ask Pisi. Defaults to Claude Opus 4.7 — the most capable
 * model — and is overridable via ANTHROPIC_MODEL for operators who want to
 * trade some quality for lower cost (e.g. claude-haiku-4-5).
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

let cached: Anthropic | null = null;

/** The Anthropic client, or null when ANTHROPIC_API_KEY is not configured. */
export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!cached) cached = new Anthropic({ apiKey });
  return cached;
}
