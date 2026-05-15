"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlarmClock, ArrowRight, CalendarClock, Check } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { setTaskDueDate, setTaskReminder, toggleTask } from "@/lib/actions/tasks";
import { CompletionNoteModal } from "./completion-note-modal";
import { ReminderPicker } from "./reminder-picker";
import { speak } from "@/lib/mascot/bus";
import { renderInlineText } from "@/lib/inline-text";
import type { TaskRow as TaskRowData } from "@/lib/queries/tasks";

interface TaskRowProps {
  task: TaskRowData;
  prefill: string;
}

export function TaskRow({ task, prefill }: TaskRowProps) {
  const [optimistic, setOptimistic] = useState(task.done);
  const [remindAt, setRemindAt] = useState(task.remind_at);
  const [dueAt, setDueAt] = useState(task.due_at);
  const [pending, startTransition] = useTransition();
  const [reminderOpen, setReminderOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);

  function onToggle() {
    const next = !optimistic;
    setOptimistic(next);
    speak(next ? "taskDone" : "taskUndone");
    startTransition(async () => {
      try {
        await toggleTask(task.id, next);
      } catch {
        setOptimistic(!next);
      }
    });
  }

  const completedAt = task.completed_at ? new Date(task.completed_at) : null;
  const dueDate = dueAt ? new Date(dueAt) : null;
  const remindDate = remindAt ? new Date(remindAt) : null;
  const overdue = !!dueDate && !optimistic && isPast(dueDate);

  return (
    <li className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={optimistic}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-task-border bg-background transition-colors",
          optimistic && "bg-primary text-primary-foreground",
        )}
      >
        {optimistic && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="flex-1">
        <p className={cn("text-sm leading-5", optimistic && "text-muted-foreground line-through")}>
          {renderInlineText(task.text)}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href={`/notes#note-${task.note_id}`} className="inline-flex items-center gap-1 hover:underline">
            in note from {formatDistanceToNow(new Date(task.note.created_at), { addSuffix: true })}
            <ArrowRight className="h-3 w-3" />
          </Link>
          {task.note.snippet && <span className="truncate text-muted-foreground/70">— {task.note.snippet}</span>}
          {completedAt && <span>· checked off {formatDistanceToNow(completedAt, { addSuffix: true })}</span>}
          {task.completion_note_id && (
            <Link
              href={`/notes#note-${task.completion_note_id}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              completion note <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </p>
        {(dueDate || remindDate) && (
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueOpen(true)}
                className={cn(
                  "inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5",
                  overdue && "border-destructive text-destructive",
                )}
                aria-label="change due date"
              >
                <CalendarClock className="h-3 w-3" />
                due {format(dueDate, "MMM d")}
              </button>
            )}
            {remindDate && (
              <button
                type="button"
                onClick={() => setReminderOpen(true)}
                className="inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5"
                aria-label="change reminder"
              >
                <AlarmClock className="h-3 w-3" />
                remind {format(remindDate, "MMM d, h:mm a")}
              </button>
            )}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => setDueOpen(true)}
          className={cn(
            "rounded p-1.5 text-muted-foreground hover:bg-secondary",
            dueAt && "text-primary",
          )}
          aria-label={dueAt ? "edit due date" : "set due date"}
          title={dueAt ? `Due ${format(new Date(dueAt), "PPp")}` : "Set due date"}
        >
          <CalendarClock className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setReminderOpen(true)}
          className={cn(
            "rounded p-1.5 text-muted-foreground hover:bg-secondary",
            remindAt && "text-primary",
          )}
          aria-label={remindAt ? "edit reminder" : "set reminder"}
          title={remindAt ? `Reminder ${format(new Date(remindAt), "PPp")}` : "Set reminder"}
        >
          <AlarmClock className="h-4 w-4" />
        </button>
        <CompletionNoteModal
          taskId={task.id}
          taskText={task.text}
          prefill={prefill}
          taskAlreadyDone={optimistic}
        />
      </div>
      <ReminderPicker
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        title="Task reminder"
        description="We'll ping your phone with a push notification at this time."
        initialIso={remindAt}
        onSave={async (iso) => {
          const prev = remindAt;
          setRemindAt(iso);
          try {
            await setTaskReminder(task.id, iso);
          } catch (e) {
            setRemindAt(prev);
            throw e;
          }
        }}
      />
      <ReminderPicker
        open={dueOpen}
        onOpenChange={setDueOpen}
        title="Due date"
        description="When does this task need to be done?"
        initialIso={dueAt}
        mode="date"
        onSave={async (iso) => {
          const prev = dueAt;
          setDueAt(iso);
          try {
            await setTaskDueDate(task.id, iso);
          } catch (e) {
            setDueAt(prev);
            throw e;
          }
        }}
      />
    </li>
  );
}
