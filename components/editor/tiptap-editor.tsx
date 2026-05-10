"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import { useEffect, useImperativeHandle, forwardRef } from "react";
import { HashtagExtension } from "./hashtag-extension";
import { DoColonExtension } from "./do-colon-extension";
import { cn } from "@/lib/utils";

export interface TiptapHandle {
  getMarkdown: () => string;
  clear: () => void;
  focus: () => void;
  editor: Editor | null;
}

export interface TiptapEditorProps {
  initialMarkdown?: string;
  placeholder?: string;
  onSubmit?: (md: string) => void;
  className?: string;
  ariaLabel?: string;
}

export const TiptapEditor = forwardRef<TiptapHandle, TiptapEditorProps>(function TiptapEditor(
  { initialMarkdown = "", placeholder = "Write a note… use `do:` or `- [ ]` to make a task. #hashtags work too.", onSubmit, className, ariaLabel },
  ref,
) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Markdown.configure({ html: false, linkify: true, breaks: true, transformPastedText: true }),
      HashtagExtension,
      DoColonExtension,
    ],
    content: initialMarkdown ? { type: "doc", content: [] } : "",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[2.5rem]",
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      },
      handleKeyDown(_view, event) {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          if (onSubmit && editorRef.current) {
            const md = (editorRef.current as Editor).storage.markdown.getMarkdown();
            onSubmit(md);
          }
          return true;
        }
        return false;
      },
    },
  });

  // Hold a stable ref so handleKeyDown above can read the latest editor.
  const editorRef = { current: editor } as { current: Editor | null };
  useEffect(() => {
    editorRef.current = editor;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    if (editor && initialMarkdown) {
      editor.commands.setContent(initialMarkdown, false);
    }
    // Only on initial-content change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useImperativeHandle(ref, () => ({
    getMarkdown: () => (editor ? editor.storage.markdown.getMarkdown() : ""),
    clear: () => editor?.commands.clearContent(true),
    focus: () => editor?.commands.focus(),
    editor: editor,
  }));

  return (
    <EditorContent
      editor={editor}
      className={cn(
        "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
    />
  );
});
