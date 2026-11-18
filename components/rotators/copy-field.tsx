"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyFieldProps {
  value: string;
  label: string;
  multiline?: boolean;
  className?: string;
}

/** A read-only value with a one-click copy button. */
export function CopyField({ value, label, multiline, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the field is still selectable */
    }
  }

  const fieldClass =
    "w-full min-w-0 rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className={cn("flex items-start gap-2", className)}>
      {multiline ? (
        <textarea
          readOnly
          aria-label={label}
          value={value}
          rows={3}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(fieldClass, "resize-none")}
        />
      ) : (
        <input
          readOnly
          aria-label={label}
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(fieldClass, "h-9")}
        />
      )}
      <Button type="button" variant="outline" size="sm" onClick={copy} className="h-9 shrink-0">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
