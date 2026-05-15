"use client";

import { useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Hash, RotateCcw, AlarmClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  setUserPref,
  unhideSidebarReminderDate,
  unhideSidebarTag,
} from "@/lib/actions/prefs";
import type { HiddenReminderDate, HiddenTag } from "@/lib/queries/prefs";

interface SettingsFormProps {
  showRemindersInSidebar: boolean;
  hiddenTags: HiddenTag[];
  hiddenReminderDates: HiddenReminderDate[];
}

export function SettingsForm({
  showRemindersInSidebar,
  hiddenTags,
  hiddenReminderDates,
}: SettingsFormProps) {
  const [pending, startTransition] = useTransition();

  function togglePref(value: boolean) {
    startTransition(() => {
      void setUserPref("show_reminders_in_sidebar", value);
    });
  }

  function restoreTag(tag: string) {
    startTransition(() => {
      void unhideSidebarTag(tag);
    });
  }

  function restoreDate(date: string) {
    startTransition(() => {
      void unhideSidebarReminderDate(date);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-medium">Sidebar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tweak what shows up next to your notes.
        </p>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Show upcoming reminders</p>
            <p className="text-xs text-muted-foreground">
              Adds a section beneath tags with one row per date that has a reminder.
              Click a date to filter notes to that day&apos;s reminders.
            </p>
          </div>
          <Toggle
            checked={showRemindersInSidebar}
            onChange={togglePref}
            disabled={pending}
            label="show upcoming reminders in sidebar"
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-medium">Hidden tags</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Click <RotateCcw className="inline h-3 w-3" /> to bring a tag back to the sidebar.
          Hidden tags also reappear automatically once you add a new note with that hashtag.
        </p>
        {hiddenTags.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">nothing hidden</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5">
            {hiddenTags.map((h) => (
              <li
                key={h.tag}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{h.tag}</span>
                  <span className="text-xs text-muted-foreground">
                    hidden {format(parseISO(h.hiddenAt), "MMM d")}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => restoreTag(h.tag)}
                  disabled={pending}
                >
                  <RotateCcw className="mr-1 h-3 w-3" /> Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-medium">Hidden reminder dates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hidden dates reappear automatically when a fresh reminder lands on them.
        </p>
        {hiddenReminderDates.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">nothing hidden</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5">
            {hiddenReminderDates.map((h) => (
              <li
                key={h.date}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <AlarmClock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(parseISO(`${h.date}T12:00`), "EEE, MMM d")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    hidden {format(parseISO(h.hiddenAt), "MMM d")}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => restoreDate(h.date)}
                  disabled={pending}
                >
                  <RotateCcw className="mr-1 h-3 w-3" /> Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors " +
        (checked ? "bg-primary" : "bg-secondary") +
        (disabled ? " opacity-50" : "")
      }
    >
      <span
        className={
          "inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform " +
          (checked ? "translate-x-5" : "translate-x-0.5")
        }
      />
    </button>
  );
}
