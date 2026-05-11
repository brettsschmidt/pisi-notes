import { AppShell } from "@/components/nav/app-shell";
import { TagSidebar } from "@/components/notes/tag-sidebar";
import { TasksShell } from "@/components/tasks/tasks-shell";
import { listTasks } from "@/lib/queries/tasks";
import { getTagCounts, getOpenTaskCount } from "@/lib/queries/notes";

export default async function TasksPage() {
  const [openTasks, doneTasks, tagCounts, openTaskCount] = await Promise.all([
    listTasks({ done: false }),
    listTasks({ done: true }),
    getTagCounts(),
    getOpenTaskCount(),
  ]);

  return (
    <AppShell sidebar={<TagSidebar tags={tagCounts} activeTags={[]} openTaskCount={openTaskCount} view="tasks" />}>
      <TasksShell openTasks={openTasks} doneTasks={doneTasks} />
    </AppShell>
  );
}
