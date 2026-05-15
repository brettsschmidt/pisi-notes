"use client";

import { useRef, useState, useTransition } from "react";
import { AlarmClock, Send, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { TiptapEditor, type TiptapHandle } from "@/components/editor/tiptap-editor";
import { ReminderPicker } from "@/components/tasks/reminder-picker";
import { createNote } from "@/lib/actions/notes";
import { speak } from "@/lib/mascot/bus";

interface NoteComposerProps {
  onCreated?: () => void;
}

export function NoteComposer({ onCreated }: NoteComposerProps) {
  const ref = useRef<TiptapHandle>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [remindAt, setRemindAt] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function submit(md?: string) {
    const text = (md ?? ref.current?.getMarkdown() ?? "").trim();
    if ((!text && !remindAt) || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        // If the user set a reminder time via the clock button, prepend a
        // reminder line with the time encoded as `[@ISO]`. The server-side
        // normalizer folds that into the canonical `<!--reminder:UUID@ISO-->`
        // comment marker and writes `remind_at` to the DB row.
        const finalMd = remindAt
          ? `( ) [@${remindAt}] ${text}`.trim()
          : text;
        await createNote(finalMd);
        const hasTask = /\[[ xX]\]/.test(finalMd);
        const long = finalMd.length > 280;
        const short = finalMd.length <= 28;
        speak(hasTask ? "taskAdded" : long ? "noteSavedLong" : short ? "noteSavedShort" : "noteSaved");
        ref.current?.clear();
        ref.current?.focus();
        setRemindAt(null);
        onCreated?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed to save");
      }
    });
  }

  const remindDate = remindAt ? new Date(remindAt) : null;

  return (
    <div className="border-t border-border bg-background safe-bottom">
      {remindDate && (
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 pt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            <AlarmClock className="h-3 w-3" />
            <span>
              reminder set for {format(remindDate, "EEE MMM d, h:mm a")}
              <span className="ml-1 text-primary/70">({formatDistanceToNow(remindDate, { addSuffix: true })})</span>
            </span>
            <button
              type="button"
              onClick={() => setRemindAt(null)}
              aria-label="clear reminder time"
              className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}
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
          variant={remindAt ? "default" : "outline"}
          onClick={() => setPickerOpen(true)}
          aria-label={remindAt ? "change reminder time" : "set reminder time for this note"}
        >
          <AlarmClock className="h-4 w-4" />
        </Button>
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
      <ReminderPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Reminder for this note"
        description="We'll send a push notification when this time comes."
        initialIso={remindAt}
        onSave={(iso) => setRemindAt(iso)}
      />
    </div>
  );
}
