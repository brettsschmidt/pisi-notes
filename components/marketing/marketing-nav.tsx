import { MinmiMark } from "@/components/brand/minmi-mark";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SECTION_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
];

/**
 * Sticky top nav for the public marketing pages. Section links collapse on
 * mobile; the right-hand CTA adapts to whether the visitor is signed in.
 */
export function MarketingNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur safe-top">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Minmi Email Helper home">
          <MinmiMark className="h-7 w-7" />
          <span className="text-base font-semibold tracking-tight">Minmi Email Helper</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {SECTION_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {signedIn ? (
            <Button asChild size="sm">
              <Link href="/rotators">Open Minmi</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
