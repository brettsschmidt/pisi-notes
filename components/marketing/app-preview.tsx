import Image from "next/image";
import { AlarmClock, Send } from "lucide-react";

/**
 * A faux pisi-notes window for the marketing hero — a small, static recreation
 * of the chat-style timeline built from the app's own design tokens, so it
 * tracks light/dark mode and always looks like the real product.
 */
export function AppPreview() {
  return (
    <div className="relative w-full max-w-md">
      {/* soft glow behind the window */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-2xl"
        style={{
          background:
            "radial-gradient(60% 60% at 60% 30%, oklch(0.6 0.18 295 / 0.45), transparent 75%)",
        }}
      />
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl ring-1 ring-black/5">
        {/* window chrome */}
        <div className="flex items-center gap-1.5 border-b border-border bg-secondary/50 px-3 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
          <span className="ml-2 text-xs font-medium text-muted-foreground">pisi-notes</span>
        </div>

        {/* timeline */}
        <div className="relative flex flex-col gap-2.5 bg-secondary/20 px-3.5 py-4">
          <Bubble time="9:02 AM">
            finalized the q3 roadmap with the team{" "}
            <Tag>#work</Tag> <Tag>#planning</Tag>
          </Bubble>

          <Bubble time="9:14 AM">
            <span className="mb-1.5 block">weekend list</span>
            <TaskLine done>book the dentist</TaskLine>
            <TaskLine>oat milk + good coffee</TaskLine>
          </Bubble>

          <Bubble time="9:31 AM">
            <Tag>#idea</Tag> what if a reminder could nudge twice
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.7rem] font-medium text-primary-foreground">
              <AlarmClock className="h-3 w-3" /> Fri 9:00 AM
            </span>
          </Bubble>

          {/* composer */}
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
              write a note…
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Send className="h-4 w-4" />
            </div>
          </div>

          {/* mascot tucked in the corner, like the real app */}
          <div className="pointer-events-none absolute -bottom-3 -right-2">
            <div className="pisi-mascot-frame !h-16 !w-16">
              <span aria-hidden className="pisi-mascot-haze" />
              <span aria-hidden className="pisi-mascot-moon" />
              <Image
                src="/mascot/cat-south.png"
                alt=""
                width={48}
                height={48}
                unoptimized
                className="pisi-mascot-cat relative h-12 w-12 [image-rendering:pixelated]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <div className="max-w-[88%] rounded-xl rounded-bl-sm border border-border bg-card px-3 py-2 text-sm leading-snug shadow-sm">
      <div className="text-card-foreground">{children}</div>
      <div className="mt-1 text-[0.65rem] text-muted-foreground">{time}</div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-primary">{children}</span>;
}

function TaskLine({ children, done }: { children: React.ReactNode; done?: boolean }) {
  return (
    <span className="my-1 flex items-center gap-2 rounded-md border border-task-border bg-task-tint px-2 py-1 text-[0.8rem]">
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
          done ? "border-primary bg-primary text-primary-foreground" : "border-task-border"
        }`}
      >
        {done && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
            <path
              d="M2.5 6.5l2.5 2.5 4.5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={done ? "text-muted-foreground line-through" : ""}>{children}</span>
    </span>
  );
}
