"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toggleTask } from "@/lib/actions/tasks";
import { CompletionNoteModal } from "./completion-note-modal";
import type { TaskRow as TaskRowData } from "@/lib/queries/tasks";

interface TaskRowProps {
  task: TaskRowData;
  prefill: string;
}

export function TaskRow({ task, prefill }: TaskRowProps) {
  const [optimistic, setOptimistic] = useState(task.done);
  const [pending, startTransition] = useTransition();

  function onToggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(async () => {
      try {
        await toggleTask(task.id, next);
      } catch {
        setOptimistic(!next);
      }
    });
  }

  const completedAt = task.completed_at ? new Date(task.completed_at) : null;

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
        <p className={cn("text-sm leading-5", optimistic && "text-muted-foreground line-through")}>{task.text}</p>
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
      </div>
      <CompletionNoteModal
        taskId={task.id}
        taskText={task.text}
        prefill={prefill}
        taskAlreadyDone={optimistic}
      />
    </li>
  );
}
