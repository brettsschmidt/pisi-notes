"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addImageUrl, deleteImage, moveImage, registerUploadedImages } from "@/lib/actions/rotators";
import { LIMITS, MAX_IMAGE_BYTES } from "@/lib/billing/plans";
import { IMAGE_BUCKET } from "@/lib/rotators/urls";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
type AcceptedType = (typeof ACCEPTED)[number];
const EXT: Record<AcceptedType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export interface ManagedImage {
  id: string;
  src: string;
  label: string | null;
  external: boolean;
  serveCount: number;
}

interface ImageManagerProps {
  rotatorId: string;
  userId: string;
  maxImages: number;
  isPro: boolean;
  /** Index of the image the next open will show (in-order rotation only). */
  nextIndex: number | null;
  images: ManagedImage[];
}

export function ImageManager({ rotatorId, userId, maxImages, isPro, nextIndex, images }: ImageManagerProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const slotsLeft = Math.max(0, maxImages - images.length);
  const busy = uploading || pending;

  async function upload(fileList: FileList | File[]) {
    setError(null);
    const files = Array.from(fileList);
    if (!files.length) return;

    const bad = files.find((f) => !ACCEPTED.includes(f.type as AcceptedType));
    if (bad) return setError(`“${bad.name}” isn't a PNG, JPEG, GIF, or WebP image.`);
    const big = files.find((f) => f.size > MAX_IMAGE_BYTES);
    if (big) return setError(`“${big.name}” is over ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
    if (files.length > slotsLeft) {
      return setError(
        slotsLeft === 0
          ? "This link is full on your plan."
          : `You can add ${slotsLeft} more image${slotsLeft === 1 ? "" : "s"} to this link on your plan.`,
      );
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const uploaded: { path: string; contentType: AcceptedType; label: string }[] = [];
      for (const file of files) {
        const type = file.type as AcceptedType;
        const path = `${userId}/${rotatorId}/${crypto.randomUUID()}.${EXT[type]}`;
        const { error: upErr } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(path, file, { contentType: type, cacheControl: "31536000", upsert: false });
        if (upErr) {
          if (uploaded.length) await supabase.storage.from(IMAGE_BUCKET).remove(uploaded.map((u) => u.path));
          setError(`Upload failed for “${file.name}”: ${upErr.message}`);
          return;
        }
        uploaded.push({ path, contentType: type, label: file.name.replace(/\.[^.]+$/, "").slice(0, 120) });
      }
      const res = await registerUploadedImages(rotatorId, uploaded);
      if (res.error) setError(res.error);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addByUrl(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addImageUrl(rotatorId, url);
      if (res.error) setError(res.error);
      else setUrl("");
    });
  }

  function act(fn: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
    });
  }

  return (
    <section className="relative flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">Images in rotation</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {images.length} of {maxImages}
          {!isPro && (
            <>
              {" "}
              ·{" "}
              <Link href="/pricing" className="text-primary hover:underline">
                Pro allows more
              </Link>
            </>
          )}
        </span>
      </div>

      {images.length === 1 && (
        <p className="text-sm text-muted-foreground">Add at least one more image so there&apos;s something to rotate.</p>
      )}

      {images.length > 0 && (
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li
              key={img.id}
              className={cn(
                "flex flex-col overflow-hidden rounded-lg border bg-background",
                nextIndex === i ? "border-primary ring-1 ring-primary/40" : "border-border",
              )}
            >
              <div className="minmi-checker relative flex aspect-[4/3] items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.label ?? `Image ${i + 1}`} className="max-h-full max-w-full object-contain" />
                <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold tabular-nums shadow-sm">
                  {i + 1}
                </span>
                {nextIndex === i && (
                  <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
                    Up next
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 border-t border-border p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{img.label || (img.external ? "Linked image" : "Uploaded image")}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    shown {img.serveCount.toLocaleString()}×{img.external && " · external URL"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Move image ${i + 1} earlier`}
                  disabled={busy || i === 0}
                  onClick={() => act(() => moveImage(img.id, "up"))}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Move image ${i + 1} later`}
                  disabled={busy || i === images.length - 1}
                  onClick={() => act(() => moveImage(img.id, "down"))}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  aria-label={`Remove image ${i + 1}`}
                  disabled={busy}
                  onClick={() => act(() => deleteImage(img.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {slotsLeft > 0 ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void upload(e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              busy && "opacity-60",
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{uploading ? "Uploading…" : "Drop images here or click to upload"}</span>
            <span className="text-xs text-muted-foreground">
              PNG, JPEG, GIF, or WebP · up to {MAX_IMAGE_BYTES / 1024 / 1024} MB each · use the same size for every image
            </span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-label="Upload images"
            onChange={(e) => e.target.files && void upload(e.target.files)}
          />

          <form onSubmit={addByUrl} className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                aria-label="Image URL to add"
                placeholder="…or add an image by https:// URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-8"
                required
              />
            </div>
            <Button type="submit" variant="outline" disabled={busy || !url}>
              Add
            </Button>
          </form>
        </div>
      ) : (
        <p className="rounded-md border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">
          This link has the most images your plan allows ({maxImages}).{" "}
          {!isPro && (
            <Link href="/pricing" className="font-medium text-primary hover:underline">
              Upgrade to Pro for up to {LIMITS.pro.imagesPerRotator}.
            </Link>
          )}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
