import { AppShell } from "@/components/nav/app-shell";
import { TagSidebar } from "@/components/notes/tag-sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskList } from "@/components/tasks/task-list";
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
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-4">
        <h1 className="mb-4 text-lg font-semibold">Tasks</h1>
        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open ({openTasks.length})</TabsTrigger>
            <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open">
            <TaskList tasks={openTasks} emptyMessage="No open tasks. Nice." />
          </TabsContent>
          <TabsContent value="done">
            <TaskList tasks={doneTasks} emptyMessage="No completed tasks yet." />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
