import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  FileCode2,
  Hash,
  ListChecks,
  MessagesSquare,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppPreview } from "@/components/marketing/app-preview";
import { PricingCards } from "@/components/marketing/pricing-cards";

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "A chat-style timeline",
    body: "Capture at the speed of texting — newest at the bottom, composer always in reach. Cmd+Enter sends. Drafts survive refreshes, crashes, and closed tabs.",
  },
  {
    icon: Hash,
    title: "Hashtags that file themselves",
    body: "Type #work and the category builds itself. Your sidebar fills with tags ranked by how often you reach for them — click to filter.",
  },
  {
    icon: ListChecks,
    title: "Tasks from a single word",
    body: "Start a line with do: and it becomes a tracked task — checkable, linkable, with its own view. The underlying Markdown stays perfectly in sync.",
  },
  {
    icon: BellRing,
    title: "Reminders that reach your pocket",
    body: "Write “remind: call mom” or “fri: ship it” — pisi parses the time and fires a real web-push notification the moment it's due.",
  },
  {
    icon: CalendarDays,
    title: "A calendar for everything scheduled",
    body: "Every reminder and task due date, dotted onto a month grid. Tap any day to see exactly what's coming up.",
  },
  {
    icon: FileCode2,
    title: "Plain Markdown, always yours",
    body: "Every note is portable Markdown. The pisi CLI syncs your whole archive to a folder of .md files. No lock-in, not ever.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Type the thought",
    body: "Open the composer and write like you'd text a friend. Hashtags, do:, remind: — it's all just text.",
  },
  {
    n: "2",
    title: "pisi sorts it out",
    body: "Tags become categories. do: lines become tasks. Times become reminders. Automatically, as you write.",
  },
  {
    n: "3",
    title: "Find it forever",
    body: "Search, filter by tag, scan the calendar — or just ask Pisi a question in plain English.",
  },
];

export function Landing() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-[480px]"
          style={{
            background:
              "radial-gradient(55% 60% at 50% 0%, oklch(0.6 0.18 295 / 0.22), transparent 72%)",
          }}
        />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              New — Ask Pisi, the AI that’s read your notes
            </span>
            <h1 className="text-4xl font-bold leading-[1.07] tracking-tight sm:text-5xl">
              Write it like a text.
              <br />
              Keep it like{" "}
              <span className="bg-gradient-to-r from-primary to-[oklch(0.7_0.16_330)] bg-clip-text text-transparent">
                Markdown.
              </span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              pisi-notes is a chat-style notebook that turns quick thoughts into a
              tagged, searchable archive — hashtags file themselves, <code className="rounded bg-secondary px-1 py-0.5 text-[0.85em]">do:</code>{" "}
              lines become tasks, and Ask Pisi answers questions from everything
              you’ve ever written.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11 px-6 text-sm">
                <Link href="/signup">
                  Start writing — free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-6 text-sm">
                <Link href="#features">Explore features</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Free forever for the core app · No credit card · Installs like a native app
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <section id="features" className="scroll-mt-20 border-t border-border bg-secondary/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading
            eyebrow="Features"
            title="Everything a thought needs — the second you have it"
            subtitle="No folders to set up. No templates to pick. Just write, and pisi does the filing."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- How it works */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading
            eyebrow="How it works"
            title="Type it. Tag it. Find it forever."
            subtitle="The whole loop takes one line of text — pisi handles the rest."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative flex flex-col gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {s.n}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-9 top-4 hidden h-px w-[calc(100%-1.5rem)] bg-border md:block"
                  />
                )}
                <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Ask Pisi AI */}
      <section
        id="ask-pisi"
        className="scroll-mt-20 border-t border-border bg-secondary/20"
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Ask Pisi
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              An AI that has actually read your notes
            </h2>
            <p className="text-muted-foreground">
              Ask a question in plain English and Pisi answers from your timeline —
              not the open internet. Every answer points back to the exact notes it
              came from, so you can trust it and dig in.
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                "Answers grounded in your own writing",
                "Every reply cites the notes it used",
                "Summaries & action-item extraction on any note",
                "10 questions free — unlimited on Pro",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-1 h-11 px-6 text-sm">
              <Link href="/signup">
                Try Ask Pisi <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <AskPisiDemo />
        </div>
      </section>

      {/* --------------------------------------------------------------- Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free. Upgrade when Pisi earns it."
            subtitle="The whole note-taking app is free, forever. Pro unlocks unlimited AI — and you can switch from inside the app any time."
          />
          <div className="mt-14">
            <PricingCards
              actions={{
                free: (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/signup">Start writing — free</Link>
                  </Button>
                ),
                pro: (
                  <Button asChild className="w-full">
                    <Link href="/signup">Get started</Link>
                  </Button>
                ),
              }}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Final CTA */}
      <section className="border-t border-border bg-secondary/20">
        <div className="relative mx-auto w-full max-w-6xl overflow-hidden px-4 py-24 text-center sm:px-6">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(50% 80% at 50% 100%, oklch(0.6 0.18 295 / 0.2), transparent 75%)",
            }}
          />
          <div className="mx-auto mb-6 flex justify-center">
            <div className="pisi-mascot-frame">
              <span aria-hidden className="pisi-mascot-haze" />
              <span aria-hidden className="pisi-mascot-moon" />
              <Image
                src="/mascot/cat-south.png"
                alt="Pisi the cat"
                width={56}
                height={56}
                unoptimized
                className="pisi-mascot-cat relative h-14 w-14 [image-rendering:pixelated]"
              />
            </div>
          </div>
          <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            Your next thought deserves a better home.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Join pisi-notes and turn the things you’d have forgotten into an archive
            that answers back.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-sm">
              <Link href="/signup">
                Start writing — free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 text-sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/** A static recreation of an Ask Pisi exchange for the marketing section. */
function AskPisiDemo() {
  return (
    <div className="relative w-full">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
          <Search className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Ask Pisi</span>
        </div>

        {/* the question */}
        <div className="mb-3 flex justify-end">
          <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
            what did I decide about the q3 roadmap?
          </p>
        </div>

        {/* the answer */}
        <div className="flex items-start gap-2">
          <Image
            src="/mascot/cat-south.png"
            alt=""
            width={28}
            height={28}
            unoptimized
            className="mt-0.5 h-7 w-7 shrink-0 [image-rendering:pixelated]"
          />
          <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2">
            <p className="text-sm leading-relaxed">
              On <strong>May 18</strong> you finalized the Q3 roadmap with the team —
              the priorities were the pricing page, Ask Pisi, and public note sharing.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Citation>finalized the q3 roadmap · May 18</Citation>
              <Citation>#planning standup · May 12</Citation>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Citation({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
      <FileCode2 className="h-3 w-3" />
      {children}
    </span>
  );
}
