import { TaskRow } from "./task-row";
import { buildCompletionPrefill } from "@/lib/completion-prefill";
import type { TaskRow as TaskRowData } from "@/lib/queries/tasks";

interface TaskListProps {
  tasks: TaskRowData[];
  emptyMessage: string;
}

export function TaskList({ tasks, emptyMessage }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} prefill={buildCompletionPrefill(task.text, task.note.created_at)} />
      ))}
    </ul>
  );
}
