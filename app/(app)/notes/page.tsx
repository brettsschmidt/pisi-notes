import { Pin } from "lucide-react";
import { AppShell } from "@/components/nav/app-shell";
import { TagSidebar } from "@/components/notes/tag-sidebar";
import { SearchBar } from "@/components/notes/search-bar";
import { NoteTimeline } from "@/components/notes/note-timeline";
import { NoteBubble } from "@/components/notes/note-bubble";
import { NoteComposer } from "@/components/notes/note-composer";
import { NotesWelcome } from "@/components/notes/notes-welcome";
import { getRecentNotes, getTagCounts, getOpenTaskCount } from "@/lib/queries/notes";
import { getTasksForNotes } from "@/lib/queries/tasks";
import { getRemindersForNotes, getUpcomingReminderDates } from "@/lib/queries/reminders";
import { getUserPrefs } from "@/lib/queries/prefs";

interface PageProps {
  searchParams: Promise<{ tag?: string | string[]; q?: string; remind?: string }>;
}

export default async function NotesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTags = Array.isArray(params.tag) ? params.tag : params.tag ? [params.tag] : [];
  const search = params.q?.trim() ?? "";
  const remindDate = params.remind?.trim() || undefined;

  const [notes, tagCounts, openTaskCount, upcomingReminders, prefs] = await Promise.all([
    getRecentNotes({ tags: activeTags, search, remindDate }),
    getTagCounts(),
    getOpenTaskCount(),
    getUpcomingReminderDates(),
    getUserPrefs(),
  ]);
  const noteIds = notes.map((n) => n.id);
  const [tasksByNote, remindersByNote] = await Promise.all([
    getTasksForNotes(noteIds),
    getRemindersForNotes(noteIds),
  ]);

  // Pinned notes lift into their own always-visible band at the top, most
  // recently pinned first; the rest stay in the chat-style timeline.
  const pinned = notes
    .filter((n) => n.pinned_at)
    .sort((a, b) => (b.pinned_at ?? "").localeCompare(a.pinned_at ?? ""));
  const timeline = notes.filter((n) => !n.pinned_at);

  function bubble(n: (typeof notes)[number]) {
    return (
      <NoteBubble
        key={n.id}
        id={n.id}
        content_md={n.content_md}
        created_at={n.created_at}
        archived_at={n.archived_at}
        pinned_at={n.pinned_at}
        share_token={n.share_token}
        highlight={search}
        tasks={tasksByNote.get(n.id) ?? []}
        reminders={remindersByNote.get(n.id) ?? []}
      />
    );
  }

  return (
    <AppShell
      sidebar={
        <TagSidebar
          tags={tagCounts}
          activeTags={activeTags}
          openTaskCount={openTaskCount}
          reminders={upcomingReminders}
          activeRemindDate={remindDate}
          showRemindersInSidebar={prefs.showRemindersInSidebar}
          hiddenTags={prefs.hiddenTags}
          hiddenReminderDates={prefs.hiddenReminderDates}
        />
      }
      topbar={<SearchBar />}
    >
      {pinned.length > 0 && (
        <section aria-label="pinned notes" className="border-b border-border bg-secondary/30">
          <div className="mx-auto max-h-[38dvh] w-full max-w-3xl overflow-y-auto p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Pin className="h-3 w-3" /> pinned
            </div>
            <div className="flex flex-col gap-3">{pinned.map(bubble)}</div>
          </div>
        </section>
      )}
      <NoteTimeline scrollKey={`${timeline.length}-${pinned.length}`}>
        {notes.length === 0 ? (
          <NotesWelcome />
        ) : timeline.length === 0 ? (
          <div className="my-auto rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            everything here is pinned — write another note below
          </div>
        ) : (
          timeline.map(bubble)
        )}
      </NoteTimeline>
      <NoteComposer />
    </AppShell>
  );
}
