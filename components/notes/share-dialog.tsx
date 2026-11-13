"use client";

import { useState } from "react";
import { Check, Copy, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { shareNote, unshareNote } from "@/lib/actions/notes";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  initialToken: string | null;
}

/** Create / revoke a public read-only link for a note. */
export function ShareDialog({ open, onOpenChange, noteId, initialToken }: ShareDialogProps) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const url =
    token && typeof window !== "undefined" ? `${window.location.origin}/n/${token}` : "";

  async function createLink() {
    setPending(true);
    try {
      const res = await shareNote(noteId);
      setToken(res.token);
    } finally {
      setPending(false);
    }
  }

  async function stopSharing() {
    setPending(true);
    try {
      await unshareNote(noteId);
      setToken(null);
      setCopied(false);
    } finally {
      setPending(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the field is selectable as a fallback */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share this note</DialogTitle>
          <DialogDescription>
            {token
              ? "Anyone with this link can read this note — no account needed."
              : "Create a public, read-only link to this note. You can stop sharing any time."}
          </DialogDescription>
        </DialogHeader>

        {token ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                readOnly
                value={url}
                aria-label="public note link"
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
              />
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy
                  </>
                )}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={stopSharing}
              disabled={pending}
              className="self-start text-destructive hover:text-destructive focus-visible:text-destructive"
            >
              {pending ? "Working…" : "Stop sharing"}
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={createLink} disabled={pending}>
            <Globe className="h-4 w-4" /> {pending ? "Creating…" : "Create public link"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
