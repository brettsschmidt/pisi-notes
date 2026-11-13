import Image from "next/image";
import Link from "next/link";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#ask-pisi", label: "Ask Pisi" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { href: "/signup", label: "Create an account" },
      { href: "/login", label: "Sign in" },
      { href: "/notes", label: "Open the app" },
    ],
  },
  {
    heading: "More",
    links: [
      { href: "https://github.com/brettsschmidt/pisi-notes", label: "Source on GitHub" },
      { href: "/#ask-pisi", label: "The pisi CLI" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/mascot/cat-south.png"
              alt=""
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 [image-rendering:pixelated]"
            />
            <span className="text-base font-semibold tracking-tight">pisi-notes</span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            A chat-style notebook that turns quick thoughts into tagged, searchable
            Markdown — with an AI that has actually read your notes.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading} className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {col.heading}
            </h3>
            {col.links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} pisi-notes · MIT licensed</p>
          <p>Made with 🖤 and a spooky cat.</p>
        </div>
      </div>
    </footer>
  );
}
