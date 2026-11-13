"use client";

import { useState } from "react";
import { Check, Hash, ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { noteAiAction } from "@/lib/actions/ai";
import { updateNote } from "@/lib/actions/notes";
import type { NoteAiAction } from "@/lib/ai/types";

interface NoteAiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  noteMarkdown: string;
}

type Result =
  | { kind: "summary"; text: string }
  | { kind: "items"; items: string[] }
  | { kind: "tags"; tags: string[] }
  | { kind: "error"; message: string };

const ACTIONS: { action: NoteAiAction; label: string; busy: string }[] = [
  { action: "summarize", label: "Summarize", busy: "Summarizing…" },
  { action: "action_items", label: "Action items", busy: "Reading…" },
  { action: "suggest_tags", label: "Suggest tags", busy: "Thinking…" },
];

export function NoteAiDialog({ open, onOpenChange, noteId, noteMarkdown }: NoteAiDialogProps) {
  const [pending, setPending] = useState<NoteAiAction | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  function reset() {
    setPending(null);
    setResult(null);
    setApplying(false);
    setApplied(false);
  }

  async function run(action: NoteAiAction) {
    if (pending) return;
    setPending(action);
    setResult(null);
    setApplied(false);
    try {
      const res = await noteAiAction({ noteId, action });
      if (!res.ok) {
        setResult({ kind: "error", message: res.message });
      } else if (res.action === "summarize") {
        setResult({ kind: "summary", text: res.summary });
      } else if (res.action === "action_items") {
        setResult({ kind: "items", items: res.items });
      } else {
        setResult({ kind: "tags", tags: res.tags });
      }
    } catch {
      setResult({ kind: "error", message: "Something went wrong reaching Pisi." });
    } finally {
      setPending(null);
    }
  }

  async function applyToNote(addition: string) {
    if (applying) return;
    setApplying(true);
    try {
      await updateNote(noteId, `${noteMarkdown.trimEnd()}\n${addition}`);
      setApplied(true);
    } catch {
      setResult({ kind: "error", message: "Couldn’t update the note. Please try again." });
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Pisi &amp; this note
          </DialogTitle>
          <DialogDescription>
            Summarize this note, pull out its action items, or get tag ideas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map(({ action, label, busy }) => (
            <Button
              key={action}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => run(action)}
              disabled={pending !== null}
            >
              {pending === action ? busy : label}
            </Button>
          ))}
        </div>

        {result?.kind === "error" && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {result.message}
          </p>
        )}

        {result?.kind === "summary" && (
          <p className="rounded-md border border-border bg-card p-3 text-sm leading-relaxed">
            {result.text}
          </p>
        )}

        {result?.kind === "items" && (
          <div className="rounded-md border border-border bg-card p-3">
            {result.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Pisi didn’t find any action items in this note.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-1.5">
                  {result.items.map((item, i) => (
                    <li key={`${i}-${item}`} className="flex items-start gap-2 text-sm">
                      <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3"
                  onClick={() => applyToNote(result.items.map((i) => `do: ${i}`).join("\n"))}
                  disabled={applying || applied}
                >
                  {applied ? (
                    <>
                      <Check className="h-4 w-4" /> Added to note
                    </>
                  ) : applying ? (
                    "Adding…"
                  ) : (
                    `Add ${result.items.length} task${result.items.length === 1 ? "" : "s"} to this note`
                  )}
                </Button>
              </>
            )}
          </div>
        )}

        {result?.kind === "tags" && (
          <div className="rounded-md border border-border bg-card p-3">
            {result.tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Pisi didn’t have a tag to suggest for this note.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {result.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-sm font-medium text-primary"
                    >
                      <Hash className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3"
                  onClick={() => applyToNote(result.tags.map((t) => `#${t}`).join(" "))}
                  disabled={applying || applied}
                >
                  {applied ? (
                    <>
                      <Check className="h-4 w-4" /> Added to note
                    </>
                  ) : applying ? (
                    "Adding…"
                  ) : (
                    `Add ${result.tags.length} tag${result.tags.length === 1 ? "" : "s"} to this note`
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
