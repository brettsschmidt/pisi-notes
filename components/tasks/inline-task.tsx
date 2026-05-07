"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";

interface InlineTaskProps {
  id: string;
  text: string;
  done: boolean;
}

export function InlineTask({ id, text, done }: InlineTaskProps) {
  const [optimistic, setOptimistic] = useState(done);
  const [pending, startTransition] = useTransition();

  function onToggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(async () => {
      try {
        await toggleTask(id, next);
      } catch {
        setOptimistic(!next);
      }
    });
  }

  return (
    <div className="pisi-task-line">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={optimistic}
        aria-label={optimistic ? "mark as not done" : "mark as done"}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-task-border bg-background transition-colors",
          optimistic && "bg-primary text-primary-foreground",
        )}
      >
        {optimistic && <Check className="h-3.5 w-3.5" />}
      </button>
      <span className={cn("flex-1 text-sm leading-5", optimistic && "text-muted-foreground line-through")}>{text}</span>
    </div>
  );
}
