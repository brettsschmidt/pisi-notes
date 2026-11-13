import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderProseHtml, stripNoteMarkers } from "@/lib/markdown";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface SharedNote {
  id: string;
  content_md: string;
  tags: string[];
  created_at: string;
}

/** Fetch a shared note by token via the public SECURITY DEFINER RPC. */
async function loadSharedNote(token: string): Promise<SharedNote | null> {
  // Tokens are 32 hex chars — reject anything else without a DB round-trip.
  if (!/^[a-f0-9]{16,64}$/i.test(token)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_note", { p_token: token });
  return Array.isArray(data) && data.length > 0 ? (data[0] as SharedNote) : null;
}

function plainText(md: string): string {
  return stripNoteMarkers(md)
    .replace(/[#*_>`[\]()~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const note = await loadSharedNote(token);
  if (!note) return { title: "Note not found · pisi-notes" };
  const text = plainText(note.content_md);
  const title = text.slice(0, 70) || "A shared note";
  const description = text.slice(0, 200) || "A note shared from pisi-notes.";
  return {
    title: `${title} · pisi-notes`,
    description,
    // Public-by-link, not public-to-search — don't index individual notes.
    robots: { index: false, follow: true },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SharedNotePage({ params }: PageProps) {
  const { token } = await params;
  const note = await loadSharedNote(token);
  if (!note) notFound();

  const html = await renderProseHtml(stripNoteMarkers(note.content_md));

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/20">
      <header className="border-b border-border bg-background/80 backdrop-blur safe-top">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/mascot/cat-south.png"
              alt=""
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 [image-rendering:pixelated]"
            />
            <span className="text-base font-semibold tracking-tight">pisi-notes</span>
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Shared note
        </p>
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <time
            dateTime={note.created_at}
            className="text-xs text-muted-foreground"
          >
            {format(new Date(note.created_at), "MMMM d, yyyy")}
          </time>
          <div
            className="prose prose-sm mt-3 max-w-none dark:prose-invert [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:font-semibold [&_input]:mr-1.5 [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul[class*='contains-task-list']]:list-none [&_ul[class*='contains-task-list']]:pl-0"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {note.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
              {note.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium text-primary">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-12 text-center">
          <div className="pisi-mascot-frame">
            <span aria-hidden className="pisi-mascot-haze" />
            <span aria-hidden className="pisi-mascot-moon" />
            <Image
              src="/mascot/cat-south.png"
              alt="Pisi the cat"
              width={48}
              height={48}
              unoptimized
              className="pisi-mascot-cat relative h-12 w-12 [image-rendering:pixelated]"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              This note lives in pisi-notes
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
              A chat-style notebook that turns quick thoughts into tagged, searchable
              Markdown — with tasks, reminders, and an AI that has read your notes.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link href="/signup">
                Start your own — free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#features">
                <Sparkles className="h-4 w-4" /> See what it does
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
