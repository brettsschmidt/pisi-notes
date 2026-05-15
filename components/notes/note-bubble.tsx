import { format, formatDistanceToNow } from "date-fns";
import { AlarmClock, Archive, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { renderProseHtml, splitMarkdown } from "@/lib/markdown";
import { InlineTask } from "@/components/tasks/inline-task";
import { InlineReminder } from "@/components/reminders/inline-reminder";
import { NoteActions } from "@/components/notes/note-actions";
import type { TaskRow } from "@/lib/queries/tasks";
import type { ReminderRow } from "@/lib/queries/reminders";
import { cn } from "@/lib/utils";

interface NoteBubbleProps {
  id: string;
  content_md: string;
  created_at: string;
  archived_at?: string | null;
  tasks: TaskRow[];
  reminders: ReminderRow[];
}

export async function NoteBubble({
  id,
  content_md,
  created_at,
  archived_at,
  tasks,
  reminders,
}: NoteBubbleProps) {
  const { prose } = splitMarkdown(content_md);
  const proseHtml = await renderProseHtml(prose);
  const sortedTasks = tasks.slice().sort((a, b) => a.position - b.position);
  const sortedReminders = reminders.slice().sort((a, b) => a.position - b.position);
  const archived = !!archived_at;
  const openReminders = sortedReminders.filter((r) => !r.done).length;

  return (
    <article
      id={`note-${id}`}
      className={cn(
        "pisi-bubble target:ring-2 target:ring-primary target:ring-offset-2",
        archived && "opacity-75 ring-1 ring-muted-foreground/20",
      )}
    >
      <header className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <time dateTime={created_at} title={format(new Date(created_at), "PPpp")}>
            {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
          </time>
          {archived && (
            <Badge variant="outline" className="gap-1 border-dashed">
              <Archive className="h-3 w-3" />
              archived
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {sortedTasks.length > 0 && (
            <Badge variant="task" className="gap-1">
              <ListChecks className="h-3 w-3" />
              <span>{sortedTasks.filter((t) => !t.done).length}/{sortedTasks.length} task{sortedTasks.length === 1 ? "" : "s"}</span>
            </Badge>
          )}
          {sortedReminders.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <AlarmClock className="h-3 w-3" />
              <span>{openReminders}/{sortedReminders.length} reminder{sortedReminders.length === 1 ? "" : "s"}</span>
            </Badge>
          )}
          <NoteActions noteId={id} initialMarkdown={content_md} archived={archived} />
        </div>
      </header>
      {proseHtml && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-1 hover:[&_a]:decoration-2 [&_a]:break-words"
          dangerouslySetInnerHTML={{ __html: proseHtml }}
        />
      )}
      {sortedTasks.length > 0 && (
        <div className="mt-2 space-y-1">
          {sortedTasks.map((t) => (
            <InlineTask key={t.id} id={t.id} text={t.text} done={t.done} />
          ))}
        </div>
      )}
      {sortedReminders.length > 0 && (
        <div className="mt-2 space-y-1">
          {sortedReminders.map((r) => (
            <InlineReminder
              key={r.id}
              id={r.id}
              text={r.text}
              done={r.done}
              remind_at={r.remind_at}
              reminded_at={r.reminded_at}
            />
          ))}
        </div>
      )}
    </article>
  );
}
