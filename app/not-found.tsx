import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Not found · pisi-notes",
  robots: { index: false, follow: true },
};

/** Branded 404 for unknown URLs and dead share links (app/n/[token] calls notFound()). */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-secondary/20">
      <header className="border-b border-border bg-background/80 backdrop-blur safe-top">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-4 px-4">
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
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <div className="pisi-mascot-frame">
          <span aria-hidden className="pisi-mascot-haze" />
          <span aria-hidden className="pisi-mascot-moon" />
          <Image
            src="/mascot/cat-south.png"
            alt="Pisi the cat"
            width={48}
            height={48}
            unoptimized
            className="pisi-mascot-cat relative h-12 w-12 [image-rendering:pixelated]"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            404
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            This page or note isn&apos;t here
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The link may be mistyped — or, if someone shared a note with you, they may
            have unshared it.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="h-4 w-4" /> Go home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup">
              Start your own — free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
