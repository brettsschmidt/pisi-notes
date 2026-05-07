import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { format } from "date-fns";
import { authedClient } from "./supabase.js";
import { slugify } from "../../lib/slug.js";

interface NoteRecord {
  id: string;
  content_md: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SyncOptions {
  dir: string;
  since?: string;
  pageSize?: number;
}

export async function sync(options: SyncOptions): Promise<{ wrote: number; skipped: number; total: number }> {
  const target = resolve(options.dir);
  await mkdir(target, { recursive: true });
  const supa = await authedClient();

  // Index existing files by note id (parsed from frontmatter).
  const existingById = new Map<string, { path: string; updated_at: string }>();
  for (const entry of await readdir(target).catch(() => [])) {
    if (!entry.endsWith(".md")) continue;
    const path = join(target, entry);
    const text = await readFile(path, "utf8").catch(() => "");
    const fm = parseFrontmatter(text);
    if (fm?.id) existingById.set(fm.id, { path, updated_at: fm.updated_at ?? "" });
  }

  let wrote = 0;
  let skipped = 0;
  let total = 0;
  const pageSize = options.pageSize ?? 1000;
  let from = 0;

  while (true) {
    let q = supa
      .from("notes")
      .select("id, content_md, tags, created_at, updated_at")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (options.since) q = q.gte("updated_at", options.since);

    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    total += data.length;

    for (const note of data as NoteRecord[]) {
      const prior = existingById.get(note.id);
      if (prior && prior.updated_at && prior.updated_at >= note.updated_at) {
        skipped++;
        continue;
      }
      const filename = filenameFor(note);
      const path = prior?.path ?? join(target, filename);
      await writeFile(path, render(note), "utf8");
      wrote++;
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return { wrote, skipped, total };
}

function filenameFor(note: NoteRecord): string {
  const stamp = format(new Date(note.created_at), "yyyy-MM-dd-HHmm");
  const slug = slugify(note.content_md);
  return `${stamp}-${slug}-${note.id.slice(0, 6)}.md`;
}

function render(note: NoteRecord): string {
  const fm = [
    "---",
    `id: ${note.id}`,
    `created_at: ${note.created_at}`,
    `updated_at: ${note.updated_at}`,
    `tags: [${note.tags.map((t) => JSON.stringify(t)).join(", ")}]`,
    "---",
    "",
  ].join("\n");
  return `${fm}${note.content_md}\n`;
}

interface Frontmatter {
  id?: string;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
}

function parseFrontmatter(raw: string): Frontmatter | null {
  if (!raw.startsWith("---\n")) return null;
  const end = raw.indexOf("\n---", 4);
  if (end === -1) return null;
  const block = raw.slice(4, end);
  const out: Frontmatter = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (!m) continue;
    const [, key, val] = m;
    if (key === "tags") {
      try {
        out.tags = JSON.parse(val.replace(/^\[/, "[").replace(/\]$/, "]"));
      } catch {
        out.tags = [];
      }
    } else if (key === "id" || key === "created_at" || key === "updated_at") {
      out[key] = val.trim();
    }
  }
  return out;
}
