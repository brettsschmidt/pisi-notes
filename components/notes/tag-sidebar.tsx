"use client";

import Link from "next/link";
import { useTransition } from "react";
import { format, parseISO } from "date-fns";
import { AlarmClock, CalendarDays, Hash, ListChecks, Settings, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { hideSidebarReminderDate, hideSidebarTag } from "@/lib/actions/prefs";
import type { TagCount } from "@/lib/queries/notes";
import type { UpcomingReminderDate } from "@/lib/queries/reminders";
import type { HiddenReminderDate, HiddenTag } from "@/lib/queries/prefs";

interface TagSidebarProps {
  tags: TagCount[];
  activeTags: string[];
  openTaskCount: number;
  view?: "notes" | "tasks" | "calendar";
  reminders?: UpcomingReminderDate[];
  activeRemindDate?: string;
  showRemindersInSidebar?: boolean;
  hiddenTags?: HiddenTag[];
  hiddenReminderDates?: HiddenReminderDate[];
}

/**
 * Hidden entries reappear automatically when there's newer matching content
 * (`latestAt > hiddenAt`). The settings page lets the user surface anything
 * that's still hidden because nothing fresh has shown up.
 */
function isStillHidden(latestAt: string, hiddenAt: string): boolean {
  return hiddenAt >= latestAt;
}

export function TagSidebar({
  tags,
  activeTags,
  openTaskCount,
  view = "notes",
  reminders = [],
  activeRemindDate,
  showRemindersInSidebar = false,
  hiddenTags = [],
  hiddenReminderDates = [],
}: TagSidebarProps) {
  const notesActive = view === "notes" && activeTags.length === 0 && !activeRemindDate;
  const tasksActive = view === "tasks";
  const calendarActive = view === "calendar";

  const hiddenTagMap = new Map(hiddenTags.map((h) => [h.tag, h.hiddenAt]));
  const hiddenDateMap = new Map(hiddenReminderDates.map((h) => [h.date, h.hiddenAt]));

  const visibleTags = tags.filter((t) => {
    const hiddenAt = hiddenTagMap.get(t.tag);
    return !hiddenAt || !isStillHidden(t.latestAt, hiddenAt);
  });
  const visibleReminders = reminders.filter((r) => {
    const hiddenAt = hiddenDateMap.get(r.date);
    return !hiddenAt || !isStillHidden(r.latestAt, hiddenAt);
  });

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-background p-3">
      <nav className="flex flex-col gap-1">
        <Link
          href="/notes"
          aria-current={notesActive ? "page" : undefined}
          className={cn(
            "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary",
            notesActive && "bg-secondary font-medium",
          )}
        >
          <span>All notes</span>
        </Link>
        <Link
          href="/tasks"
          aria-current={tasksActive ? "page" : undefined}
          className={cn(
            "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary",
            tasksActive && "bg-secondary font-medium",
          )}
        >
          <span className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Tasks
          </span>
          {openTaskCount > 0 && (
            <Badge variant="task" className="px-1.5 py-0 text-[10px]">{openTaskCount}</Badge>
          )}
        </Link>
        <Link
          href="/calendar"
          aria-current={calendarActive ? "page" : undefined}
          className={cn(
            "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary",
            calendarActive && "bg-secondary font-medium",
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Calendar
          </span>
        </Link>
      </nav>

      <Separator className="my-3" />

      <div className="flex items-center gap-1.5 px-2 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
        <Hash className="h-3 w-3" /> tags
      </div>
      <ul className="flex flex-col gap-0.5">
        {visibleTags.length === 0 ? (
          <li className="px-2 py-1 text-xs text-muted-foreground">
            {tags.length === 0 ? "no tags yet" : "all hidden"}
          </li>
        ) : (
          visibleTags.map(({ tag, count }) => {
            const active = activeTags.includes(tag);
            const next = active
              ? activeTags.filter((t) => t !== tag)
              : [...activeTags, tag];
            const usp = new URLSearchParams();
            for (const t of next) usp.append("tag", t);
            const href = `/notes${usp.toString() ? "?" + usp.toString() : ""}`;
            return (
              <SidebarRow
                key={tag}
                href={href}
                active={active}
                label={`#${tag}`}
                count={count}
                onHide={() => hideSidebarTag(tag)}
                hideLabel={`hide #${tag}`}
              />
            );
          })
        )}
      </ul>

      {showRemindersInSidebar && (
        <>
          <Separator className="my-3" />
          <div className="flex items-center gap-1.5 px-2 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
            <AlarmClock className="h-3 w-3" /> reminders
          </div>
          <ul className="flex flex-col gap-0.5">
            {visibleReminders.length === 0 ? (
              <li className="px-2 py-1 text-xs text-muted-foreground">
                {reminders.length === 0 ? "nothing upcoming" : "all hidden"}
              </li>
            ) : (
              visibleReminders.map(({ date, count }) => {
                const active = activeRemindDate === date;
                const label = format(parseISO(`${date}T12:00`), "EEE M/d");
                const href = active ? "/notes" : `/notes?remind=${date}`;
                return (
                  <SidebarRow
                    key={date}
                    href={href}
                    active={active}
                    label={label}
                    count={count}
                    onHide={() => hideSidebarReminderDate(date)}
                    hideLabel={`hide reminders for ${label}`}
                  />
                );
              })
            )}
          </ul>
        </>
      )}

      <div className="mt-auto pt-3">
        <Separator className="mb-2" />
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Settings className="h-3.5 w-3.5" /> Settings
        </Link>
      </div>
    </aside>
  );
}

interface SidebarRowProps {
  href: string;
  active: boolean;
  label: string;
  count: number;
  onHide: () => Promise<void>;
  hideLabel: string;
}

function SidebarRow({ href, active, label, count, onHide, hideLabel }: SidebarRowProps) {
  const [pending, startTransition] = useTransition();

  function handleHide(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(() => {
      void onHide();
    });
  }

  return (
    <li className="group/sidebar-row">
      <Link
        href={href}
        className={cn(
          "flex items-center justify-between gap-1 rounded-md px-2 py-1 text-sm hover:bg-secondary",
          active && "bg-secondary font-medium text-primary",
          pending && "opacity-50",
        )}
      >
        <span className="truncate">{label}</span>
        <span className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{count}</span>
          <button
            type="button"
            onClick={handleHide}
            aria-label={hideLabel}
            className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus:opacity-100 group-hover/sidebar-row:opacity-100"
            disabled={pending}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      </Link>
    </li>
  );
}
