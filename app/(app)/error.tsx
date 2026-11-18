"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Error boundary for the signed-in routes: lets users retry or get back to their links. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          We couldn&apos;t load this page. Your image links keep working — try again, or head
          back to your links.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => reset()}>
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/rotators">Back to image links</Link>
        </Button>
      </div>
    </div>
  );
}
