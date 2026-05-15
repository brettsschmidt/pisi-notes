"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rdp-pisi p-2", className)}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-2",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous:
          "absolute left-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent hover:bg-secondary",
        button_next:
          "absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent hover:bg-secondary",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-[0.7rem] font-medium text-muted-foreground",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0",
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-md font-normal hover:bg-secondary focus:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring",
        today: "font-semibold text-primary",
        selected:
          "[&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:hover:bg-primary/90 [&_button]:hover:text-primary-foreground",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30 pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
