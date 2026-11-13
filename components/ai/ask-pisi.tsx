"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowUp, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askPisi } from "@/lib/actions/ai";
import { FREE_AI_CREDITS, type Entitlements } from "@/lib/billing/plans";
import type { AskSource, AskTurn } from "@/lib/ai/types";

interface AskPisiProps {
  entitlements: Entitlements;
  aiConfigured: boolean;
}

type Turn =
  | { id: number; kind: "question"; text: string }
  | { id: number; kind: "answer"; text: string; sources: AskSource[] }
  | { id: number; kind: "error"; text: string };

const EXAMPLES = [
  "What did I decide this week?",
  "What tasks do I still have open?",
  "Summarize my most recent notes",
  "What was I worried about lately?",
];

export function AskPisi({ entitlements, aiConfigured }: AskPisiProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(
    entitlements.isPro ? null : entitlements.aiCreditsRemaining,
  );
  const nextId = useRef(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, pending]);

  const outOfCredits = !entitlements.isPro && (creditsRemaining ?? 0) <= 0;
  const canAsk = aiConfigured && !outOfCredits;

  async function ask(question: string) {
    const q = question.trim();
    if (!q || pending || !canAsk) return;

    // Build follow-up history from the answered turns so far.
    const history: AskTurn[] = [];
    for (const t of turns) {
      if (t.kind === "question") history.push({ role: "user", text: t.text });
      else if (t.kind === "answer") history.push({ role: "pisi", text: t.text });
    }

    setInput("");
    setTurns((prev) => [...prev, { id: nextId.current++, kind: "question", text: q }]);
    setPending(true);
    try {
      const res = await askPisi({ question: q, history });
      if (res.ok) {
        setTurns((prev) => [
          ...prev,
          { id: nextId.current++, kind: "answer", text: res.answer, sources: res.sources },
        ]);
        if (res.creditsRemaining !== null) setCreditsRemaining(res.creditsRemaining);
      } else {
        setTurns((prev) => [
          ...prev,
          { id: nextId.current++, kind: "error", text: res.message },
        ]);
        if (res.reason === "limit") setCreditsRemaining(0);
      }
    } catch {
      setTurns((prev) => [
        ...prev,
        {
          id: nextId.current++,
          kind: "error",
          text: "Something went wrong reaching Pisi. Please try again.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h1 className="text-base font-semibold">Ask Pisi</h1>
        </div>
        {entitlements.isPro ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            <Sparkles className="h-3 w-3" /> Pro · unlimited
          </span>
        ) : (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
            {Math.max(0, creditsRemaining ?? 0)} of {FREE_AI_CREDITS} free questions left
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
          {turns.length === 0 && <EmptyState onPick={ask} disabled={!canAsk} />}

          {turns.map((turn) => {
            if (turn.kind === "question") {
              return (
                <div key={turn.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                    {turn.text}
                  </p>
                </div>
              );
            }
            if (turn.kind === "answer") {
              return <AnswerBubble key={turn.id} text={turn.text} sources={turn.sources} />;
            }
            return (
              <div key={turn.id} className="flex items-start gap-2">
                <PisiAvatar />
                <p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-sm text-destructive">
                  {turn.text}
                </p>
              </div>
            );
          })}

          {pending && (
            <div className="flex items-center gap-2">
              <PisiAvatar />
              <p className="rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground">
                Pisi is reading your notes
                <span className="pisi-ellipsis" />
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <Composer
        aiConfigured={aiConfigured}
        outOfCredits={outOfCredits}
        pending={pending}
        input={input}
        onInput={setInput}
        onSubmit={() => ask(input)}
      />
    </div>
  );
}

function PisiAvatar() {
  return (
    <Image
      src="/mascot/cat-south.png"
      alt=""
      width={28}
      height={28}
      unoptimized
      className="mt-0.5 h-7 w-7 shrink-0 [image-rendering:pixelated]"
    />
  );
}

function AnswerBubble({ text, sources }: { text: string; sources: AskSource[] }) {
  return (
    <div className="flex items-start gap-2">
      <PisiAvatar />
      <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        {sources.length > 0 && (
          <div className="mt-2.5 border-t border-border pt-2">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              From your notes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s) => (
                <Link
                  key={s.id}
                  href={`/notes#note-${s.id}`}
                  className="inline-flex max-w-[15rem] items-center gap-1 rounded-md border border-border bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">{s.snippet || "note"}</span>
                  <span className="shrink-0 opacity-70">· {format(parseISO(s.date), "MMM d")}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="my-auto flex flex-col items-center gap-4 py-10 text-center">
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
        <h2 className="text-lg font-semibold">Ask me anything about your notes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          I answer from everything you’ve written — and show you the notes I used.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onPick(q)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function Composer({
  aiConfigured,
  outOfCredits,
  pending,
  input,
  onInput,
  onSubmit,
}: {
  aiConfigured: boolean;
  outOfCredits: boolean;
  pending: boolean;
  input: string;
  onInput: (v: string) => void;
  onSubmit: () => void;
}) {
  if (!aiConfigured) {
    return (
      <div className="border-t border-border p-4 safe-bottom">
        <p className="mx-auto max-w-2xl rounded-md border border-border bg-secondary/40 p-3 text-center text-sm text-muted-foreground">
          Ask Pisi isn’t enabled on this deployment yet.
        </p>
      </div>
    );
  }

  if (outOfCredits) {
    return (
      <div className="border-t border-border p-4 safe-bottom">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="text-sm font-medium">You’ve used all your free Ask Pisi questions.</p>
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro for unlimited answers grounded in your notes.
          </p>
          <Button asChild size="sm" className="mt-1">
            <Link href="/pricing">
              <Sparkles className="h-4 w-4" /> Upgrade to Pro
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border p-3 safe-bottom">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={1}
          placeholder="Ask Pisi about your notes…"
          aria-label="Ask Pisi a question"
          className="max-h-40 min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="button"
          size="icon"
          onClick={onSubmit}
          disabled={pending || !input.trim()}
          aria-label="Ask Pisi (Enter)"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
      <p className="mx-auto mt-1.5 max-w-2xl text-center text-xs text-muted-foreground">
        Pisi answers only from your notes. Enter to send, Shift+Enter for a new line.
      </p>
    </div>
  );
}
