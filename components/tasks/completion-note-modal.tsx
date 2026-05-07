"use client";

import { useRef, useState, useTransition } from "react";
import { MessageSquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TiptapEditor, type TiptapHandle } from "@/components/editor/tiptap-editor";
import { createCompletionNote } from "@/lib/actions/tasks";

interface CompletionNoteModalProps {
  taskId: string;
  taskText: string;
  prefill: string;
  taskAlreadyDone: boolean;
}

export function CompletionNoteModal({ taskId, taskText, prefill, taskAlreadyDone }: CompletionNoteModalProps) {
  const ref = useRef<TiptapHandle>(null);
  const [open, setOpen] = useState(false);
  const [alsoMarkDone, setAlsoMarkDone] = useState(!taskAlreadyDone);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const md = (ref.current?.getMarkdown() ?? "").trim();
    if (!md || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        await createCompletionNote({ taskId, content_md: md, alsoMarkDone });
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed to save");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`add completion note for ${taskText}`}>
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Completion note</DialogTitle>
          <DialogDescription>
            This will save as a regular note in your timeline, with a reference back to the task.
          </DialogDescription>
        </DialogHeader>
        <TiptapEditor
          ref={ref}
          initialMarkdown={prefill}
          ariaLabel="completion note editor"
          placeholder="What's the context for completing this task?"
          onSubmit={() => submit()}
          className="min-h-[10rem]"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={alsoMarkDone}
              onChange={(e) => setAlsoMarkDone(e.target.checked)}
              className="h-4 w-4"
              disabled={taskAlreadyDone}
            />
            also mark task done
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending}>
              Save note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
