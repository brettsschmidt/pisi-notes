"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "./task-list";
import { buildCompletionPrefill } from "@/lib/completion-prefill";
import type { TaskRow as TaskRowData } from "@/lib/queries/tasks";

interface TasksShellProps {
  openTasks: TaskRowData[];
  doneTasks: TaskRowData[];
}

export function TasksShell({ openTasks, doneTasks }: TasksShellProps) {
  const [tab, setTab] = useState<"open" | "done">("open");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mirror the /notes timeline: oldest at the top, newest at the bottom,
  // and pin scroll to the bottom on mount and when switching tabs.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [tab, openTasks.length, doneTasks.length]);

  // Pre-compute completion prefills so TaskList stays a simple presenter.
  const openWithPrefill = openTasks.map((t) => ({ task: t, prefill: buildCompletionPrefill(t.text, t.note.created_at) }));
  const doneWithPrefill = doneTasks.map((t) => ({ task: t, prefill: buildCompletionPrefill(t.text, t.note.created_at) }));

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl p-4">
        <h1 className="mb-4 text-lg font-semibold">Tasks</h1>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "open" | "done")}>
          <TabsList>
            <TabsTrigger value="open">Open ({openTasks.length})</TabsTrigger>
            <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open">
            <TaskList tasks={openWithPrefill.map((x) => x.task)} emptyMessage="No open tasks. Nice." />
          </TabsContent>
          <TabsContent value="done">
            <TaskList tasks={doneWithPrefill.map((x) => x.task)} emptyMessage="No completed tasks yet." />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
