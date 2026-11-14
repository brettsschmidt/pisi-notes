import { cn } from "@/lib/utils";

// Route-level loading skeletons for the signed-in pages. They mirror the
// AppShell frame (header, tag sidebar, main column) without its client-side
// state, so they render instantly while a page's Supabase queries run.

function Block({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-muted", className)} />;
}

function SkeletonFrame({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="flex h-dvh flex-col">
      <span className="sr-only">Loading…</span>
      <div aria-hidden className="flex h-dvh animate-pulse flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 safe-top sm:px-4">
          <Block className="h-6 w-24" />
          <div className="flex flex-1 justify-center px-2">
            <Block className="h-8 w-full max-w-md" />
          </div>
          <div className="flex gap-1">
            <Block className="h-8 w-8" />
            <Block className="h-8 w-8" />
            <Block className="h-8 w-8" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="hidden w-56 shrink-0 flex-col gap-2 border-r border-border bg-background p-3 md:flex">
            <Block className="h-7 w-full" />
            <Block className="h-7 w-full" />
            <Block className="h-7 w-full" />
            <Block className="h-7 w-full" />
            <div className="my-2 border-t border-border" />
            <Block className="h-5 w-3/4" />
            <Block className="h-5 w-2/3" />
            <Block className="h-5 w-1/2" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function NotesSkeleton() {
  return (
    <SkeletonFrame>
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
          {["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-2/5"].map((w, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg bg-secondary p-3">
              <Block className={cn("h-4", w)} />
              <Block className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border bg-background safe-bottom">
        <div className="mx-auto flex max-w-3xl items-center gap-2 p-3">
          <Block className="h-10 flex-1" />
          <Block className="h-10 w-10" />
        </div>
      </div>
    </SkeletonFrame>
  );
}

export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <SkeletonFrame>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 p-4">
        <Block className="mb-2 h-8 w-48" />
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
            <Block className="h-4 w-4 shrink-0" />
            <Block className={cn("h-4", i % 2 === 0 ? "w-2/3" : "w-1/2")} />
          </div>
        ))}
      </div>
    </SkeletonFrame>
  );
}

export function CalendarSkeleton() {
  return (
    <SkeletonFrame>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <Block className="h-7 w-40" />
          <Block className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => (
            <Block key={i} className="aspect-square bg-secondary" />
          ))}
        </div>
      </div>
    </SkeletonFrame>
  );
}

export function AskSkeleton() {
  return (
    <SkeletonFrame>
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
          <Block className="h-6 w-40" />
          <Block className="h-4 w-2/3" />
          <div className="flex flex-col gap-2 rounded-lg bg-secondary p-3">
            <Block className="h-4 w-5/6" />
            <Block className="h-4 w-1/2" />
          </div>
        </div>
      </div>
      <div className="border-t border-border bg-background safe-bottom">
        <div className="mx-auto flex max-w-3xl items-center gap-2 p-3">
          <Block className="h-10 flex-1" />
          <Block className="h-10 w-20" />
        </div>
      </div>
    </SkeletonFrame>
  );
}
