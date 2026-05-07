"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface NoteTimelineProps {
  children: React.ReactNode;
  /** When this changes, scroll to the bottom (used after a new note is created). */
  scrollKey?: string | number;
}

export function NoteTimeline({ children, scrollKey }: NoteTimelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    // Highlight a target note from the URL hash and re-scroll into view.
    if (typeof window !== "undefined" && window.location.hash.startsWith("#note-")) {
      const target = document.getElementById(window.location.hash.slice(1));
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [scrollKey]);

  // Refresh after focus (when returning from /tasks etc.) so optimistic state stays fresh.
  useEffect(() => {
    function onFocus() {
      router.refresh();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);

  return (
    <div ref={ref} className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">{children}</div>
    </div>
  );
}
