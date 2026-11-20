import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Not found · Quiet Upsell",
  robots: { index: false, follow: true },
};

/** Branded 404 for unknown URLs. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-secondary/20">
      <header className="border-b border-border bg-background/80 backdrop-blur safe-top">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark className="h-7 w-7" />
            <span className="text-base font-semibold tracking-tight">Quiet Upsell</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <BrandMark className="h-14 w-14 opacity-80" />
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">404</p>
          <h1 className="text-2xl font-bold tracking-tight">This page isn&apos;t here</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The link may be mistyped, or the image link it pointed to was deleted.
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
              Start your own, free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
