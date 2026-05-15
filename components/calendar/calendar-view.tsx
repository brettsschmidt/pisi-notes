"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  format,
  isSameDay,
  isToday,
  isPast,
  startOfDay,
} from "date-fns";
import { AlarmClock, CheckSquare, Hash } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { ScheduledItem } from "@/lib/queries/calendar";

interface CalendarViewProps {
  items: ScheduledItem[];
}

export function CalendarView({ items }: CalendarViewProps) {
  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()));

  // Pre-bucket by day key so the day cell + selected-day list are O(1) reads.
  const byDay = useMemo(() => {
    const map = new Map<string, ScheduledItem[]>();
    for (const it of items) {
      const key = format(new Date(it.scheduled_at), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(it);
      map.set(key, list);
    }
    return map;
  }, [items]);

  const selectedKey = format(selected, "yyyy-MM-dd");
  const dayItems = byDay.get(selectedKey) ?? [];

  // Day modifiers feed `react-day-picker` so it knows which cells have
  // content. We expose: scheduled (any open), allDone, overdue.
  const modifiers = useMemo(() => {
    const scheduled: Date[] = [];
    const allDone: Date[] = [];
    const overdue: Date[] = [];
    const today = startOfDay(new Date());
    for (const [key, list] of byDay) {
      const d = new Date(`${key}T12:00`);
      const hasOpen = list.some((i) => !i.done);
      if (!hasOpen) {
        allDone.push(d);
        continue;
      }
      scheduled.push(d);
      const ov = list.some((i) => !i.done && new Date(i.scheduled_at) < today);
      if (ov) overdue.push(d);
    }
    return { scheduled, allDone, overdue };
  }, [byDay]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto p-4">
      <h1 className="text-lg font-semibold">Calendar</h1>
      <div className="rounded-lg border border-border bg-card p-2">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => d && setSelected(d)}
          required
          modifiers={modifiers}
          modifiersClassNames={{
            scheduled: "pisi-cal-day-scheduled",
            allDone: "pisi-cal-day-done",
            overdue: "pisi-cal-day-overdue",
          }}
          classNames={{
            day: "h-11 w-11 text-center text-sm p-0",
            day_button:
              "inline-flex h-11 w-11 items-center justify-center rounded-md font-normal hover:bg-secondary focus:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring",
          }}
        />
      </div>

      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-medium">
          {format(selected, "EEEE, MMM d")}
          {isToday(selected) && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">today</span>
          )}
        </h2>
        <span className="text-xs text-muted-foreground">
          {dayItems.length} item{dayItems.length === 1 ? "" : "s"}
        </span>
      </div>

      {dayItems.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nothing scheduled. Pisi gets to nap.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dayItems
            .slice()
            .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
            .map((item) => (
              <ScheduledRow key={`${item.kind}-${item.id}`} item={item} dayDate={selected} />
            ))}
        </ul>
      )}
    </div>
  );
}

function ScheduledRow({ item, dayDate }: { item: ScheduledItem; dayDate: Date }) {
  const when = new Date(item.scheduled_at);
  const sameDayTime = isSameDay(when, dayDate) ? format(when, "h:mm a") : format(when, "MMM d, h:mm a");
  const overdue = !item.done && isPast(when);
  const Icon = item.kind === "task" ? CheckSquare : AlarmClock;

  return (
    <li
      className={cn(
        "rounded-md border border-border bg-card p-3 transition-colors",
        item.done && "opacity-60",
        overdue && !item.done && "border-destructive/40",
      )}
    >
      <Link href={`/notes#note-${item.note_id}`} className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            item.done ? "text-muted-foreground" : overdue ? "text-destructive" : "text-primary",
          )}
        />
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm leading-5",
              item.done && "text-muted-foreground line-through",
            )}
          >
            {item.text || <span className="italic text-muted-foreground">(no body)</span>}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className={cn(overdue && !item.done && "text-destructive font-medium")}>{sameDayTime}</span>
            <span aria-hidden>·</span>
            <span className="uppercase tracking-wide">{item.kind}</span>
            {item.note_snippet && (
              <>
                <span aria-hidden>·</span>
                <span className="flex items-center gap-1 truncate">
                  <Hash className="h-3 w-3" />
                  <span className="truncate">{item.note_snippet}</span>
                </span>
              </>
            )}
          </p>
        </div>
      </Link>
    </li>
  );
}
