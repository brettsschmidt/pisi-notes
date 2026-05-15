import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema, type Options as SanitizeOptions } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

const schema: SanitizeOptions = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), ["className"]],
    a: [...(defaultSchema.attributes?.a ?? []), ["target"], ["rel"]],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

const HASHTAG_HTML_RE = /(^|[^&\w])#([\p{L}0-9_-]{1,64})/gu;

/**
 * Strip task / reminder lines (we render them separately as interactive
 * widgets) and everything between them while preserving leading/trailing
 * prose.
 *
 * Returns:
 *   - `prose`: markdown with task and reminder lines removed
 *   - `taskOrder`: task ids in document order
 *   - `reminderOrder`: reminder ids in document order
 */
export function splitMarkdown(md: string): {
  prose: string;
  taskOrder: string[];
  reminderOrder: string[];
} {
  const lines = md.split(/\r?\n/);
  const prose: string[] = [];
  const taskOrder: string[] = [];
  const reminderOrder: string[] = [];
  for (const line of lines) {
    const t = line.match(/<!--task:([a-f0-9-]+)-->/);
    if (t) {
      taskOrder.push(t[1]);
      continue;
    }
    // Reminder marker may carry an optional `@ISO` time suffix.
    const r = line.match(/<!--reminder:([a-f0-9-]+)(?:@[^>]+)?-->/);
    if (r) {
      reminderOrder.push(r[1]);
      continue;
    }
    prose.push(line);
  }
  return {
    prose: prose.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    taskOrder,
    reminderOrder,
  };
}

export async function renderProseHtml(md: string): Promise<string> {
  if (!md.trim()) return "";
  const file = await processor.process(md);
  let html = String(file);
  // Open links in a new tab; sanitizer already ran, just augment attrs.
  html = html.replace(/<a (?![^>]*\btarget=)/g, '<a target="_blank" rel="noopener noreferrer" ');
  // Highlight #hashtags inside text nodes (run on raw HTML — sanitizer already
  // ran, and we only inject a span).
  html = html.replace(HASHTAG_HTML_RE, (_full, prefix: string, tag: string) => {
    return `${prefix}<span class="pisi-hashtag">#${tag}</span>`;
  });
  return html;
}
