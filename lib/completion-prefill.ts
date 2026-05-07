import { format } from "date-fns";

/**
 * Builds the pre-fill markdown shown in the completion-note composer. The
 * blockquote is plain Markdown so it renders identically in any viewer.
 */
export function buildCompletionPrefill(taskText: string, sourceCreatedAt: string): string {
  const when = format(new Date(sourceCreatedAt), "yyyy-MM-dd HH:mm");
  return `> ↳ from task: ${taskText}  (note: ${when})\n\n`;
}
