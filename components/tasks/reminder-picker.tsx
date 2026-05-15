"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReminderPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  initialIso: string | null;
  onSave: (iso: string | null) => Promise<void> | void;
  mode?: "datetime" | "date";
}

function toLocalInputValue(iso: string | null, mode: "datetime" | "date"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return mode === "date"
    ? format(d, "yyyy-MM-dd")
    : format(d, "yyyy-MM-dd'T'HH:mm");
}

function fromLocalInputValue(value: string, mode: "datetime" | "date"): string | null {
  if (!value) return null;
  // datetime-local & date inputs return wall-clock strings — interpret as local
  // and convert to ISO/UTC for storage.
  const d = mode === "date" ? new Date(`${value}T09:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function ReminderPicker({
  open,
  onOpenChange,
  title = "Set reminder",
  description = "We'll send a push notification to your phone when this is due.",
  initialIso,
  onSave,
  mode = "datetime",
}: ReminderPickerProps) {
  const [value, setValue] = useState(() => toLocalInputValue(initialIso, mode));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Reset the input each time the dialog opens.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(toLocalInputValue(initialIso, mode));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
    }
  }, [open, initialIso, mode]);

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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reminder-picker-input" className="text-sm">
            {mode === "date" ? "Date" : "Date & time"}
          </Label>
          <Input
            id="reminder-picker-input"
            type={mode === "date" ? "date" : "datetime-local"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min={mode === "date" ? format(new Date(), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            {initialIso ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => save(null)}
                disabled={pending}
              >
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
                onClick={() => save(fromLocalInputValue(value, mode))}
                disabled={pending || !value}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
