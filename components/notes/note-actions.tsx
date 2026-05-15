"use client";

import { useRef, useState, useTransition } from "react";
import { AlarmClock, Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TiptapEditor, type TiptapHandle } from "@/components/editor/tiptap-editor";
import { ReminderPicker } from "@/components/tasks/reminder-picker";
import { addReminderToNote, archiveNote, deleteNote, unarchiveNote, updateNote } from "@/lib/actions/notes";
import { speak } from "@/lib/mascot/bus";

interface NoteActionsProps {
  noteId: string;
  initialMarkdown: string;
  archived: boolean;
}

export function NoteActions({ noteId, initialMarkdown, archived }: NoteActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const editorRef = useRef<TiptapHandle>(null);

  function onSaveEdit() {
    const md = (editorRef.current?.getMarkdown() ?? "").trim();
    if (!md) return;
    startTransition(async () => {
      try {
        await updateNote(noteId, md);
        speak("noteEdited");
        setEditOpen(false);
      } catch {
        // toast/log handled by the page reload — keep dialog open so the user retries
      }
    });
  }

  function onConfirmDelete() {
    startTransition(async () => {
      try {
        await deleteNote(noteId);
        speak("noteDeleted");
        setDeleteOpen(false);
      } catch {
        setDeleteOpen(false);
      }
    });
  }

  function onArchiveToggle() {
    startTransition(async () => {
      try {
        if (archived) {
          await unarchiveNote(noteId);
          speak("noteUnarchived");
        } else {
          await archiveNote(noteId);
          speak("noteArchived");
        }
      } catch {
        /* ignore */
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="note actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setReminderOpen(true)}>
            <AlarmClock className="mr-2 h-4 w-4" /> Add reminder
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onArchiveToggle}>
            {archived ? (
              <>
                <ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" /> Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
            <DialogDescription>Tweak it. Tags and tasks rebuild from the markdown.</DialogDescription>
          </DialogHeader>
          <TiptapEditor
            ref={editorRef}
            initialMarkdown={initialMarkdown}
            ariaLabel="edit note"
            onSubmit={onSaveEdit}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" type="button">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={onSaveEdit} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReminderPicker
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        title="Add a reminder to this note"
        description="Pisi will ping you when the time hits. The reminder text is set to the note's first line — edit it from the note any time."
        initialIso={null}
        onSave={async (iso) => {
          if (!iso) return;
          await addReminderToNote(noteId, iso);
          speak("noteEdited");
        }}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this note?</DialogTitle>
            <DialogDescription>
              Pisi the cat will be sad. This wipes the note and any tasks attached to it. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" type="button">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              onClick={onConfirmDelete}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
