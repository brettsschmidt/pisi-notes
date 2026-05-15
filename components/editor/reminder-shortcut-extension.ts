import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

// `monday: `, `mon: `, etc. — full names and 3-letter abbreviations.
const DAY_PATTERNS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const DAY_RE = new RegExp(
  `^(${Object.keys(DAY_PATTERNS).join("|")}):\\s$`,
  "i",
);
// `5/25: ` or `5/25/26: ` or `5/25/2026: `
const DATE_RE = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?:\s$/;

function nextDayAt9am(weekday: number): Date {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
  if (target.getDay() === weekday && target.getTime() > now.getTime()) {
    return target;
  }
  let daysAhead = (weekday - target.getDay() + 7) % 7;
  if (daysAhead === 0) daysAhead = 7;
  return new Date(target.getTime() + daysAhead * 86_400_000);
}

function dateAt9am(month: number, day: number, year: number | undefined): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const now = new Date();
  const resolvedYear = year ?? now.getFullYear();
  const d = new Date(resolvedYear, month - 1, day, 9, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  // If the user omitted the year and the implied date has already passed,
  // roll forward to next year.
  if (year === undefined && d.getTime() < now.getTime()) {
    return new Date(resolvedYear + 1, month - 1, day, 9, 0, 0, 0);
  }
  return d;
}

function parseShortcut(line: string): Date | null {
  const dayMatch = line.match(DAY_RE);
  if (dayMatch) {
    const weekday = DAY_PATTERNS[dayMatch[1].toLowerCase()];
    if (weekday !== undefined) return nextDayAt9am(weekday);
  }
  const dateMatch = line.match(DATE_RE);
  if (dateMatch) {
    const month = Number.parseInt(dateMatch[1], 10);
    const day = Number.parseInt(dateMatch[2], 10);
    let year: number | undefined;
    if (dateMatch[3]) {
      year = Number.parseInt(dateMatch[3], 10);
      if (year < 100) year += 2000;
    }
    return dateAt9am(month, day, year);
  }
  return null;
}

/**
 * When the user types `<weekday>: ` or `M/D: ` (or `M/D/YYYY: `) at the start
 * of an empty paragraph, swap it for a canonical reminder line with the
 * computed time baked in: `( ) [@<ISO>] `. The remind-token decoration
 * renders the `[@<ISO>]` portion as a friendly chip so the editor stays
 * readable. Days default to 9am local; dates default to 9am on that day in
 * the user's local timezone.
 */
export const ReminderShortcutExtension = Extension.create({
  name: "reminderShortcut",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("reminderShortcutInputRule"),
        props: {
          handleTextInput(view, from, _to, text) {
            if (text !== " ") return false;
            const { state } = view;
            const { $from } = state.selection;
            if ($from.node($from.depth).type.name !== "paragraph") return false;
            const lineStart = $from.start();
            const before = state.doc.textBetween(lineStart, from, "\n", "\n") + text;
            const when = parseShortcut(before);
            if (!when) return false;

            const replacement = `( ) [@${when.toISOString()}] `;
            const tr = state.tr
              .delete(lineStart, from)
              .insertText(replacement, lineStart);
            const cursorPos = lineStart + replacement.length;
            tr.setSelection(TextSelection.near(tr.doc.resolve(cursorPos)));
            view.dispatch(tr);
            return true;
          },
        },
      }),
    ];
  },
});

// Re-exported for unit-test reuse; the editor itself only needs the extension.
export const __testing = { parseShortcut, DAY_NAMES };
