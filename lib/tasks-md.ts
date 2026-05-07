import { v4 as uuid } from "uuid";

export interface ParsedTask {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

const TASK_LINE_RE = /^(\s*)(?:[-*+]\s+)?\[([ xX])\]\s*(?:<!--task:([a-f0-9-]+)-->\s*)?(.*)$/;
const DO_COLON_RE = /^(\s*)(?:do|todo):\s+(.*)$/i;

/**
 * Rewrites loose task syntax into canonical GFM task lines and ensures every
 * checkbox has a stable id encoded as an HTML comment. Idempotent.
 *
 *   `do: buy milk`          →  `- [ ] <!--task:UUID--> buy milk`
 *   `- [x] foo`             →  `- [x] <!--task:UUID--> foo`
 *   `- [ ] <!--task:abc--> bar` (untouched, id preserved)
 */
export function normalizeTaskMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const out = lines.map((line) => {
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
