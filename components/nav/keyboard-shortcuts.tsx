"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["/"], description: "Focus search" },
  { keys: ["c"], description: "Jump to the note composer" },
  { keys: ["g", "n"], description: "Go to Notes" },
  { keys: ["g", "t"], description: "Go to Tasks" },
  { keys: ["g", "a"], description: "Go to Calendar" },
  { keys: ["g", "s"], description: "Go to Settings" },
  { keys: ["?"], description: "Show this help" },
  { keys: ["Esc"], description: "Close dialogs / blur inputs" },
];

const CHORD_TIMEOUT_MS = 900;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingGRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitingG = useRef(false);

  const focusBySelector = useCallback((selector: string) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      el.focus();
      if (el instanceof HTMLInputElement) el.select();
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    function clearChord() {
      awaitingG.current = false;
      if (pendingGRef.current) {
        clearTimeout(pendingGRef.current);
        pendingGRef.current = null;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      // Escape always works, even from inside an input — blur the field.
      if (e.key === "Escape" && isTypingTarget(e.target)) {
        (e.target as HTMLElement).blur();
        return;
      }
      // Don't hijack keys while the user is writing.
      if (isTypingTarget(e.target)) return;
      // Leave browser/OS combos alone.
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Second key of a `g _` chord.
      if (awaitingG.current) {
        const dest: Record<string, string> = {
          n: "/notes",
          t: "/tasks",
          a: "/calendar",
          s: "/settings",
        };
        const target = dest[e.key.toLowerCase()];
        clearChord();
        if (target) {
          e.preventDefault();
          router.push(target);
        }
        return;
      }

      if (e.key === "g") {
        e.preventDefault();
        awaitingG.current = true;
        pendingGRef.current = setTimeout(clearChord, CHORD_TIMEOUT_MS);
        return;
      }

      if (e.key === "/") {
        if (focusBySelector('input[aria-label="search"]')) e.preventDefault();
        return;
      }

      if (e.key === "c") {
        if (focusBySelector('[aria-label="note composer"]')) e.preventDefault();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((v) => !v);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearChord();
    };
  }, [router, focusBySelector]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move fast. Pisi approves.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5">
          {SHORTCUTS.map((s) => (
            <li key={s.description} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{s.description}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-secondary-foreground"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
