"use client";

import { useState, useTransition } from "react";
import { AlarmClock, AlarmClockCheck, Check } from "lucide-react";
import { format, isPast } from "date-fns";
import { setReminderTime, toggleReminder } from "@/lib/actions/tasks";
import { ReminderPicker } from "@/components/tasks/reminder-picker";
import { renderInlineText } from "@/lib/inline-text";
import { cn } from "@/lib/utils";

interface InlineReminderProps {
  id: string;
  text: string;
  done: boolean;
  remind_at: string | null;
  reminded_at: string | null;
}

export function InlineReminder({ id, text, done, remind_at, reminded_at }: InlineReminderProps) {
  const [optimistic, setOptimistic] = useState(done);
  const [remindAt, setRemindAt] = useState(remind_at);
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);

  function onToggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(async () => {
      try {
        await toggleReminder(id, next);
      } catch {
        setOptimistic(!next);
      }
    });
  }

  const remindDate = remindAt ? new Date(remindAt) : null;
  const overdue = !!remindDate && isPast(remindDate) && !reminded_at;

  return (
    <div className="pisi-task-line flex items-start gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={optimistic}
        aria-label={optimistic ? "mark reminder as not done" : "dismiss reminder"}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-task-border bg-background transition-colors",
          optimistic && "bg-primary text-primary-foreground",
        )}
      >
        {optimistic && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="flex-1">
        <span className={cn("text-sm leading-5", optimistic && "text-muted-foreground line-through")}>
          {renderInlineText(text)}
        </span>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={cn(
            "ml-2 inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-secondary",
            remindDate && "text-primary",
            overdue && "border-destructive text-destructive",
          )}
          aria-label={remindDate ? "change reminder time" : "set reminder time"}
        >
          {reminded_at ? (
            <AlarmClockCheck className="h-3 w-3" />
          ) : (
            <AlarmClock className="h-3 w-3" />
          )}
          {remindDate ? format(remindDate, "MMM d, h:mm a") : "set time"}
        </button>
      </div>
      <ReminderPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Reminder"
        description="We'll ping your phone with a push notification at this time."
        initialIso={remindAt}
        onSave={async (iso) => {
          const prev = remindAt;
          setRemindAt(iso);
          try {
            await setReminderTime(id, iso);
          } catch (e) {
            setRemindAt(prev);
            throw e;
          }
        }}
      />
    </div>
  );
}
