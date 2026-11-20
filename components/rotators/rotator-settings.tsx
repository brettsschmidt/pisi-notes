"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Pause, Pencil, Play, Shuffle, ListOrdered, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteRotator, updateRotator } from "@/lib/actions/rotators";
import { cn } from "@/lib/utils";
import type { RotationMode } from "@/types/supabase";

interface RotatorSettingsProps {
  id: string;
  name: string;
  mode: RotationMode;
  active: boolean;
  openCount: number;
  lastOpenedAt: string | null;
}

/** Header of a rotator's page: name, stats, rotation mode, pause, delete. */
export function RotatorSettings({ id, name, mode, active, openCount, lastOpenedAt }: RotatorSettingsProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
    });
  }

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      const res = await updateRotator(id, { name: draft });
      if (!res.error) setEditing(false);
      return res;
    });
  }

  function confirmDelete() {
    if (!window.confirm(`Delete “${name}”? Emails already sent with this link will show a blank image.`)) return;
    run(() => deleteRotator(id));
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-64">
          {editing ? (
            <form onSubmit={saveName} className="flex max-w-md items-center gap-2">
              <Input
                aria-label="Link name"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={80}
                autoFocus
              />
              <Button type="submit" size="sm" disabled={pending}>
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(name);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight">{name}</h1>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Rename"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {openCount.toLocaleString()} open{openCount === 1 ? "" : "s"}
            {lastOpenedAt && <> · last opened {formatDistanceToNow(parseISO(lastOpenedAt), { addSuffix: true })}</>}
            {!active && <> · <span className="font-medium text-foreground">paused</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run(() => updateRotator(id, { active: !active }))}
          >
            {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {active ? "Pause" : "Resume"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={confirmDelete}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Rotation">
        <span className="text-sm text-muted-foreground">Rotation:</span>
        {(
          [
            { value: "sequential", label: "In order", icon: ListOrdered, hint: "1, 2, 3, then back to 1" },
            { value: "random", label: "Random", icon: Shuffle, hint: "A random image on each open" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={mode === opt.value}
            aria-label={opt.label}
            title={opt.hint}
            disabled={pending}
            onClick={() => mode !== opt.value && run(() => updateRotator(id, { mode: opt.value }))}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
              mode === opt.value
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <opt.icon className="h-3.5 w-3.5" /> {opt.label}
          </button>
        ))}
      </div>

      {!active && (
        <p className="rounded-md border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">
          This link is paused. Emails that use it show a blank (transparent) image until you resume it.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
