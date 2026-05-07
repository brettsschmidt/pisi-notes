import Link from "next/link";
import { Hash, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TagSidebarProps {
  tags: { tag: string; count: number }[];
  activeTags: string[];
  openTaskCount: number;
}

export function TagSidebar({ tags, activeTags, openTaskCount }: TagSidebarProps) {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-background p-3">
      <nav className="flex flex-col gap-1">
        <Link
          href="/notes"
          className={cn(
            "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary",
            activeTags.length === 0 && "bg-secondary font-medium",
          )}
        >
          <span>All notes</span>
        </Link>
        <Link
          href="/tasks"
          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
        >
          <span className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Tasks
          </span>
          {openTaskCount > 0 && (
            <Badge variant="task" className="px-1.5 py-0 text-[10px]">{openTaskCount}</Badge>
          )}
        </Link>
      </nav>
      <Separator className="my-3" />
      <div className="flex items-center gap-1.5 px-2 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
        <Hash className="h-3 w-3" /> tags
      </div>
      <ul className="flex flex-col gap-0.5">
        {tags.length === 0 ? (
          <li className="px-2 py-1 text-xs text-muted-foreground">no tags yet</li>
        ) : (
          tags.map(({ tag, count }) => {
            const active = activeTags.includes(tag);
            const next = active
              ? activeTags.filter((t) => t !== tag)
              : [...activeTags, tag];
            const usp = new URLSearchParams();
            for (const t of next) usp.append("tag", t);
            const href = `/notes${usp.toString() ? "?" + usp.toString() : ""}`;
            return (
              <li key={tag}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-secondary",
                    active && "bg-secondary font-medium text-primary",
                  )}
                >
                  <span>#{tag}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
