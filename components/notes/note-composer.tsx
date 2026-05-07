"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TiptapEditor, type TiptapHandle } from "@/components/editor/tiptap-editor";
import { createNote } from "@/lib/actions/notes";

interface NoteComposerProps {
  onCreated?: () => void;
}

export function NoteComposer({ onCreated }: NoteComposerProps) {
  const ref = useRef<TiptapHandle>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(md?: string) {
    const text = (md ?? ref.current?.getMarkdown() ?? "").trim();
    if (!text || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        await createNote(text);
        ref.current?.clear();
        ref.current?.focus();
        onCreated?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed to save");
      }
    });
  }

  return (
    <div className="border-t border-border bg-background safe-bottom">
      <div className="mx-auto flex max-w-3xl items-end gap-2 p-3">
        <TiptapEditor
          ref={ref}
          ariaLabel="note composer"
          className="flex-1"
          onSubmit={(md) => submit(md)}
        />
        <Button
          type="button"
          size="icon"
          onClick={() => submit()}
          disabled={pending}
          aria-label="send note (Cmd+Enter)"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="mx-auto max-w-3xl px-3 pb-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
