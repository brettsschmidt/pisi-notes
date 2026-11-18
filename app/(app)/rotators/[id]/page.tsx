import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SignedInShell } from "@/components/nav/signed-in-shell";
import { CopyField } from "@/components/rotators/copy-field";
import { ImageManager } from "@/components/rotators/image-manager";
import { RotatorSettings } from "@/components/rotators/rotator-settings";
import { getEntitlements } from "@/lib/billing/subscription";
import { getRotator } from "@/lib/queries/rotators";
import { emailImgSnippet, imageSrc, rotatorImageUrl } from "@/lib/rotators/urls";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Image link · Minmi Email Helper" };

export default async function RotatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    found,
    entitlements,
  ] = await Promise.all([supabase.auth.getUser(), getRotator(id), getEntitlements()]);
  if (!found || !user) notFound();
  const { rotator, images } = found;

  const url = rotatorImageUrl(rotator.slug);
  // For in-order rotation, the next open shows image #(open_count mod n).
  const nextIndex =
    rotator.mode === "sequential" && images.length > 0 ? rotator.open_count % images.length : null;

  return (
    <SignedInShell>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6">
        <div>
          <Link
            href="/rotators"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All image links
          </Link>
        </div>

        <RotatorSettings
          id={rotator.id}
          name={rotator.name}
          mode={rotator.mode}
          active={rotator.active}
          openCount={rotator.open_count}
          lastOpenedAt={rotator.last_opened_at}
        />

        {created && images.length === 0 && (
          <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
            Your link is ready. Add two or more images below, then paste the URL into your email.
          </p>
        )}

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-medium">Put this in your email</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Use the URL wherever your email tool asks for an image URL, or paste the HTML into a
              custom-code block. Opening the URL yourself counts as an open and moves the rotation
              forward.
            </p>
          </div>
          <CopyField label="Image URL" value={url} />
          <CopyField label="HTML snippet" value={emailImgSnippet(url, rotator.name)} multiline />
          <p className="text-xs text-muted-foreground">
            Does your email tool want a file extension? <span className="font-mono">{url}.png</span>{" "}
            works too.
          </p>
        </section>

        <ImageManager
          rotatorId={rotator.id}
          userId={user.id}
          maxImages={entitlements.maxImagesPerRotator}
          isPro={entitlements.isPro}
          nextIndex={nextIndex}
          images={images.map((img) => ({
            id: img.id,
            src: imageSrc(img),
            label: img.label,
            external: !img.storage_path,
            serveCount: img.serve_count,
          }))}
        />
      </div>
    </SignedInShell>
  );
}
