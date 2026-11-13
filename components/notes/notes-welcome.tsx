import Image from "next/image";
import { BellRing, Hash, ListChecks } from "lucide-react";

// Shown on /notes only when the account has zero notes — the first-run moment.
// It teaches the three "magic" syntaxes so the first note lands the core loop.
const TIPS = [
  {
    icon: Hash,
    syntax: "#idea",
    body: "Add a #hashtag — it becomes a category in your sidebar.",
  },
  {
    icon: ListChecks,
    syntax: "do: …",
    body: "Start a line with do: and it becomes a checkable task.",
  },
  {
    icon: BellRing,
    syntax: "remind: …",
    body: "Write remind: call mom or fri: ship it — Pisi pings your phone.",
  },
];

export function NotesWelcome() {
  return (
    <div className="my-auto flex flex-col items-center gap-5 py-6 text-center">
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
        <h2 className="text-lg font-semibold">Welcome to pisi-notes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Write anything in the box below — Pisi files it for you. A few things it
          watches for:
        </p>
      </div>
      <div className="grid w-full max-w-md gap-2 sm:grid-cols-3">
        {TIPS.map((tip) => (
          <div
            key={tip.syntax}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <tip.icon className="h-4 w-4" />
            </span>
            <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium">
              {tip.syntax}
            </code>
            <p className="text-xs leading-snug text-muted-foreground">{tip.body}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Once you’ve written a few, open{" "}
        <span className="font-medium text-foreground">Ask Pisi</span> to chat with
        your notes.
      </p>
    </div>
  );
}
