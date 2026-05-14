import * as React from "react";

// Match either a markdown link `[label](url)` or a bare http(s)/mailto URL.
// Used to render task text (which is plain string in the DB) with clickable
// anchors. Lightweight on purpose — the full markdown renderer lives in
// lib/markdown.ts and runs only on note prose.
const TOKEN_RE = /\[([^\]\n]+)\]\(([^()\s]+)\)|(https?:\/\/[^\s<>)]+|mailto:[^\s<>)]+)/g;

export function renderInlineText(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, label, url, bare] = m;
    const href = url ?? bare;
    const display = label ?? bare;
    if (href) {
      out.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="pisi-link"
          onClick={(e) => e.stopPropagation()}
        >
          {display}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
