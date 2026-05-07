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
 * Strip task lines (we render them separately as interactive checkboxes) and
 * everything between them while preserving leading/trailing prose.
 *
 * Returns:
 *   - `prose`: markdown with task lines removed
 *   - `taskOrder`: ids in document order (so the bubble can interleave them)
 */
export function splitMarkdown(md: string): { prose: string; taskOrder: string[] } {
  const lines = md.split(/\r?\n/);
  const prose: string[] = [];
  const taskOrder: string[] = [];
  for (const line of lines) {
    const m = line.match(/<!--task:([a-f0-9-]+)-->/);
    if (m) {
      taskOrder.push(m[1]);
    } else {
      prose.push(line);
    }
  }
  return { prose: prose.join("\n").replace(/\n{3,}/g, "\n\n").trim(), taskOrder };
}

export async function renderProseHtml(md: string): Promise<string> {
  if (!md.trim()) return "";
  const file = await processor.process(md);
  let html = String(file);
  // Highlight #hashtags inside text nodes (run on raw HTML — sanitizer already
  // ran, and we only inject a span).
  html = html.replace(HASHTAG_HTML_RE, (_full, prefix: string, tag: string) => {
    return `${prefix}<span class="pisi-hashtag">#${tag}</span>`;
  });
  return html;
}
