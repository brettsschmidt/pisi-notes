import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon, Plus } from "lucide-react";
import { SignedInShell } from "@/components/nav/signed-in-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRotator } from "@/lib/actions/rotators";
import { getEntitlements } from "@/lib/billing/subscription";
import { listRotators } from "@/lib/queries/rotators";
import { imageSrc, rotatorImageUrl } from "@/lib/rotators/urls";

export const metadata: Metadata = { title: "Image links · Minmi Email Helper" };

function errorText(code: string | undefined, max: number): string | null {
  if (!code) return null;
  if (code === "limit") {
    return `The free plan includes ${max} image links. Upgrade to Pro for unlimited links.`;
  }
  return code;
}

export default async function RotatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [rotators, entitlements] = await Promise.all([listRotators(), getEntitlements()]);
  const atLimit = rotators.length >= entitlements.maxRotators;
  const message = errorText(error, entitlements.maxRotators);

  return (
    <SignedInShell>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6">
        <header>
          <h1 className="text-xl font-semibold tracking-tight">Image links</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each link is one image URL for your email. Every time someone opens the email, it
            shows the next image in the set.
          </p>
        </header>

        {message && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {message}{" "}
            {error === "limit" && (
              <Link href="/pricing" className="font-medium underline">
                See plans
              </Link>
            )}
          </p>
        )}

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium">New image link</h2>
          {atLimit && !entitlements.isPro ? (
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;re using all {entitlements.maxRotators} free image links.{" "}
              <Link href="/pricing" className="font-medium text-primary hover:underline">
                Upgrade to Pro
              </Link>{" "}
              for unlimited links, or delete one you no longer use.
            </p>
          ) : (
            <form action={createRotator} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required maxLength={80} placeholder="e.g. Spring newsletter header" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mode">Rotation</Label>
                <select
                  id="mode"
                  name="mode"
                  defaultValue="sequential"
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="sequential">In order</option>
                  <option value="random">Random</option>
                </select>
              </div>
              <Button type="submit">
                <Plus className="h-4 w-4" /> Create link
              </Button>
            </form>
          )}
        </section>

        {rotators.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No image links yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create one above, add a few images, then paste its URL into your email wherever an
              image goes.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {rotators.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/rotators/${r.id}`}
                  className="flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50"
                >
                  <div className="minmi-checker flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border">
                    {r.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageSrc(r.cover)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{r.name}</span>
                      {!r.active && (
                        <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          Paused
                        </span>
                      )}
                    </div>
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {rotatorImageUrl(r.slug)}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {r.imageCount} image{r.imageCount === 1 ? "" : "s"} ·{" "}
                      {r.mode === "random" ? "random" : "in order"} · {r.open_count.toLocaleString()} open
                      {r.open_count === 1 ? "" : "s"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SignedInShell>
  );
}
