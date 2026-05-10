import { AppShell } from "@/components/nav/app-shell";
import { TagSidebar } from "@/components/notes/tag-sidebar";
import { SearchBar } from "@/components/notes/search-bar";
import { NoteTimeline } from "@/components/notes/note-timeline";
import { NoteBubble } from "@/components/notes/note-bubble";
import { NoteComposer } from "@/components/notes/note-composer";
import { getRecentNotes, getTagCounts, getOpenTaskCount } from "@/lib/queries/notes";
import { getTasksForNotes } from "@/lib/queries/tasks";

interface PageProps {
  searchParams: Promise<{ tag?: string | string[]; q?: string }>;
}

export default async function NotesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTags = Array.isArray(params.tag) ? params.tag : params.tag ? [params.tag] : [];
  const search = params.q?.trim() ?? "";

  const [notes, tagCounts, openTaskCount] = await Promise.all([
    getRecentNotes({ tags: activeTags, search }),
    getTagCounts(),
    getOpenTaskCount(),
  ]);
  const tasksByNote = await getTasksForNotes(notes.map((n) => n.id));

  return (
    <AppShell
      sidebar={<TagSidebar tags={tagCounts} activeTags={activeTags} openTaskCount={openTaskCount} />}
      topbar={<SearchBar />}
    >
      <NoteTimeline scrollKey={notes.length}>
        {notes.length === 0 ? (
          <div className="my-auto rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            no notes yet — write your first one below
          </div>
        ) : (
          notes.map((n) => (
            <NoteBubble
              key={n.id}
              id={n.id}
              content_md={n.content_md}
              created_at={n.created_at}
              archived_at={n.archived_at}
              tasks={tasksByNote.get(n.id) ?? []}
            />
          ))
        )}
      </NoteTimeline>
      <NoteComposer />
    </AppShell>
  );
}
