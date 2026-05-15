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
}

const TASK_LINE_RE = /^(\s*)(?:[-*+]\s+)?\[([ xX])\]\s*(?:<!--task:([a-f0-9-]+)-->\s*)?(.*)$/;
const DO_COLON_RE = /^(\s*)(?:do|todo):\s+(.*)$/i;

// Reminder line: `(  ) <!--reminder:UUID--> body`. Parens mirror the GFM
// task-list shape so reminders feel like a sibling concept to tasks.
const REMINDER_LINE_RE = /^(\s*)\(([ xX])\)\s*(?:<!--reminder:([a-f0-9-]+)-->\s*)?(.*)$/;
const REMIND_COLON_RE = /^(\s*)(?::?remind|remind:)\s+(.*)$/i;

/**
 * Rewrites loose task/reminder syntax into canonical lines and ensures every
 * checkbox has a stable id encoded as an HTML comment. Idempotent.
 *
 *   `do: buy milk`               →  `- [ ] <!--task:UUID--> buy milk`
 *   `- [x] foo`                  →  `- [x] <!--task:UUID--> foo`
 *   `:remind call mom`           →  `( ) <!--reminder:UUID--> call mom`
 *   `remind: call mom`           →  `( ) <!--reminder:UUID--> call mom`
 *   `( ) <!--reminder:abc--> bar` (untouched, id preserved)
 */
export function normalizeTaskMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const out = lines.map((line) => {
    const remindColon = line.match(REMIND_COLON_RE);
    if (remindColon) {
      const [, indent, body] = remindColon;
      return `${indent}( ) <!--reminder:${uuid()}--> ${body}`;
    }
    const remindLine = line.match(REMINDER_LINE_RE);
    if (remindLine) {
      const [, indent, mark, existingId, body] = remindLine;
      const id = existingId ?? uuid();
      const checked = mark.toLowerCase() === "x" ? "x" : " ";
      return `${indent}(${checked}) <!--reminder:${id}--> ${body}`.trimEnd();
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
    const [, , mark, id, body] = m;
    if (!id) return;
    out.push({
      id,
      text: body.trim(),
      done: mark.toLowerCase() === "x",
      position: out.length,
    });
  });
  return out;
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
