"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addDays,
  addHours,
  format,
  formatDistanceToNow,
  setHours,
  setMinutes,
  setSeconds,
  startOfHour,
} from "date-fns";
import { AlarmClock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ReminderPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  initialIso: string | null;
  onSave: (iso: string | null) => Promise<void> | void;
  mode?: "datetime" | "date";
}

interface QuickPick {
  label: string;
  build: (from: Date) => Date;
}

const QUICK_PICKS: QuickPick[] = [
  { label: "in 1 hour",     build: (n) => addHours(startOfHour(n), 1) },
  { label: "in 3 hours",    build: (n) => addHours(startOfHour(n), 3) },
  { label: "tonight 8pm",   build: (n) => setSeconds(setMinutes(setHours(n, 20), 0), 0) },
  { label: "tomorrow 9am",  build: (n) => setSeconds(setMinutes(setHours(addDays(n, 1), 9), 0), 0) },
  { label: "in a week",     build: (n) => setSeconds(setMinutes(setHours(addDays(n, 7), 9), 0), 0) },
];

function combineDateAndTime(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((n) => Number.parseInt(n, 10));
  const d = new Date(date);
  d.setHours(Number.isFinite(h) ? h : 9);
  d.setMinutes(Number.isFinite(m) ? m : 0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

export function ReminderPicker({
  open,
  onOpenChange,
  title = "Set reminder",
  description = "Pisi will ping your phone when the time hits.",
  initialIso,
  onSave,
  mode = "datetime",
}: ReminderPickerProps) {
  const initialDate = useMemo(
    () => (initialIso ? new Date(initialIso) : addHours(startOfHour(new Date()), 1)),
    [initialIso],
  );
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState<string>(() => format(initialDate, "HH:mm"));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const seed = initialIso ? new Date(initialIso) : addHours(startOfHour(new Date()), 1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(seed);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(format(seed, "HH:mm"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
  }, [open, initialIso]);

  const composed = useMemo(() => {
    if (!date) return null;
    return mode === "date"
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0)
      : combineDateAndTime(date, time);
  }, [date, time, mode]);

  function applyQuick(pick: QuickPick) {
    const d = pick.build(new Date());
    setDate(d);
    setTime(format(d, "HH:mm"));
  }

  function save(iso: string | null) {
    setError(null);
    startTransition(async () => {
      try {
        await onSave(iso);
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed to save");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_PICKS.map((q) => {
            const target = q.build(new Date());
            const active = composed && Math.abs(composed.getTime() - target.getTime()) < 60_000;
            return (
              <button
                key={q.label}
                type="button"
                onClick={() => applyQuick(q)}
                className={cn(
                  "rounded-full border border-border px-2.5 py-1 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-secondary",
                )}
              >
                {q.label}
              </button>
            );
          })}
        </div>

        <div className="flex justify-center rounded-md border border-border bg-background">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
            required
          />
        </div>

        {mode !== "date" && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2">
            <label htmlFor="reminder-time" className="text-sm font-medium">
              Time
            </label>
            <input
              id="reminder-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        <div className="rounded-md bg-secondary px-3 py-2 text-sm">
          {composed ? (
            <div className="flex items-center gap-2 text-secondary-foreground">
              <AlarmClock className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <div className="font-medium">{format(composed, "EEEE, MMM d 'at' h:mm a")}</div>
                <div className="text-xs text-muted-foreground">{formatDistanceToNow(composed, { addSuffix: true })}</div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">pick a date to continue</span>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <DialogFooter>
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            {initialIso ? (
              <Button variant="ghost" size="sm" onClick={() => save(null)} disabled={pending}>
                Clear
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <Button
                onClick={() => save(composed ? composed.toISOString() : null)}
                disabled={pending || !composed}
              >
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
