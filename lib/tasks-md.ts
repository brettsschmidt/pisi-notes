import { v4 as uuid } from "uuid";

export interface ParsedTask {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface ParsedReminder {
  id: string;
  text: string;
  done: boolean;
  position: number;
  remindAt: string | null;
}

const TASK_LINE_RE = /^(\s*)(?:[-*+]\s+)?\[([ xX])\]\s*(?:<!--task:([a-f0-9-]+)-->\s*)?(.*)$/;
const DO_COLON_RE = /^(\s*)(?:do|todo):\s+(.*)$/i;

// Reminder line: `( ) <!--reminder:UUID@ISO--> body`. Parens mirror the GFM
// task-list shape; the optional `@ISO` after the UUID carries the picked
// remind_at time so the markdown stays the single source of truth.
const ISO_RE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/;
const REMINDER_LINE_RE = new RegExp(
  `^(\\s*)\\(([ xX])\\)\\s*(?:<!--reminder:([a-f0-9-]+)(?:@(${ISO_RE.source}))?-->\\s*)?(.*)$`,
);
const REMIND_COLON_RE = /^(\s*)remind:\s+(.*)$/i;
// `[@ISO] body` — produced by the editor's reminder shortcuts (e.g. `monday:`)
// and by the composer's time picker. Both bracket characters may arrive
// backslash-escaped because tiptap-markdown escapes `[` and `]` when it
// serializes the editor document to markdown. We accept either form so the
// token is always folded into the canonical `<!--reminder:UUID@ISO-->` comment.
const TIME_TOKEN_RE = new RegExp(`\\\\?\\[@(${ISO_RE.source})\\\\?\\]\\s*`);

/**
 * Rewrites loose task/reminder syntax into canonical lines and ensures every
 * checkbox has a stable id encoded as an HTML comment. Idempotent.
 *
 *   `do: buy milk`                       →  `- [ ] <!--task:UUID--> buy milk`
 *   `- [x] foo`                          →  `- [x] <!--task:UUID--> foo`
 *   `remind: call mom`                   →  `( ) <!--reminder:UUID--> call mom`
 *   `( ) [@2026-05-15T18:00Z] call mom`  →  `( ) <!--reminder:UUID@2026-05-15T18:00Z--> call mom`
 *   `( ) <!--reminder:abc--> bar` (untouched, id preserved)
 */
export function normalizeTaskMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const out = lines.map((line) => {
    const remindColon = line.match(REMIND_COLON_RE);
    if (remindColon) {
      const [, indent, rest] = remindColon;
      const { time, body } = extractTimeToken(rest);
      const suffix = time ? `@${time}` : "";
      return `${indent}( ) <!--reminder:${uuid()}${suffix}--> ${body}`;
    }
    const remindLine = line.match(REMINDER_LINE_RE);
    if (remindLine) {
      const [, indent, mark, existingId, existingTime, rest] = remindLine;
      const id = existingId ?? uuid();
      const checked = mark.toLowerCase() === "x" ? "x" : " ";
      // Pull a time out of the visible body if the user typed one inline
      // after a previous edit; otherwise keep whatever the comment already had.
      const { time: bodyTime, body } = extractTimeToken(rest);
      const time = bodyTime ?? existingTime ?? null;
      const suffix = time ? `@${time}` : "";
      return `${indent}(${checked}) <!--reminder:${id}${suffix}--> ${body}`.trimEnd();
    }
    const doMatch = line.match(DO_COLON_RE);
    if (doMatch) {
      const [, indent, body] = doMatch;
      return `${indent}- [ ] <!--task:${uuid()}--> ${body}`;
    }
    const taskMatch = line.match(TASK_LINE_RE);
    if (taskMatch) {
      const [, indent, mark, existingId, body] = taskMatch;
      const id = existingId ?? uuid();
      const checked = mark.toLowerCase() === "x" ? "x" : " ";
      return `${indent}- [${checked}] <!--task:${id}--> ${body}`.trimEnd();
    }
    return line;
  });
  return out.join("\n");
}

/**
 * Extract tasks from already-normalized markdown. Returns them in document
 * order so `position` is stable.
 */
export function parseTasksFromMarkdown(md: string): ParsedTask[] {
  const lines = md.split(/\r?\n/);
  const out: ParsedTask[] = [];
  lines.forEach((line) => {
    if (REMINDER_LINE_RE.test(line)) return; // skip reminder lines
    const m = line.match(TASK_LINE_RE);
    if (!m) return;
    const [, , mark, id, body] = m;
    if (!id) return; // unnormalized — ignore (the caller should normalize first)
    out.push({
      id,
      text: body.trim(),
      done: mark.toLowerCase() === "x",
      position: out.length,
    });
  });
  return out;
}

export function parseRemindersFromMarkdown(md: string): ParsedReminder[] {
  const lines = md.split(/\r?\n/);
  const out: ParsedReminder[] = [];
  lines.forEach((line) => {
    const m = line.match(REMINDER_LINE_RE);
    if (!m) return;
    const [, , mark, id, time, rest] = m;
    if (!id) return;
    const { body } = extractTimeToken(rest);
    out.push({
      id,
      text: body.trim(),
      done: mark.toLowerCase() === "x",
      position: out.length,
      remindAt: time ?? null,
    });
  });
  return out;
}

// Strip a leading `[@ISO]` token from a reminder body, returning the time
// and the cleaned body. Used by both normalize and parse so the user never
// sees raw ISO timestamps in the rendered note.
function extractTimeToken(text: string): { time: string | null; body: string } {
  const m = text.match(TIME_TOKEN_RE);
  if (!m) return { time: null, body: text };
  const time = m[1];
  const body = text.replace(TIME_TOKEN_RE, "").trim();
  return { time, body };
}

/**
 * Flip [ ] ↔ [x] in the markdown for a given task id. Returns the original
 * string if the id isn't found.
 */
export function setTaskDoneInMarkdown(md: string, taskId: string, done: boolean): string {
  const re = new RegExp(`\\[[ xX]\\](\\s*<!--task:${escapeRegex(taskId)}-->)`, "g");
  return md.replace(re, `${done ? "[x]" : "[ ]"}$1`);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
