import { cn } from "@/lib/utils";

/** The Minmi mark: two stacked image cards with a rotation arrow. */
export function MinmiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("shrink-0", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <rect x="9" y="7" width="15" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-primary-foreground opacity-50" />
      <rect x="6" y="11" width="15" height="12" rx="2" className="fill-primary-foreground" />
      <path d="M8.5 20.5l3.2-3.6 2.3 2.4 1.8-1.8 2.7 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className="text-primary" />
      <path d="M26 17.5a5 5 0 0 1-4.6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-primary-foreground" />
      <path d="M20 21.8l1.6 1.8-1.9 1.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
    </svg>
  );
}
