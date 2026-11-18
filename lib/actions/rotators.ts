"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getEntitlements } from "@/lib/billing/subscription";
import { IMAGE_BUCKET } from "@/lib/rotators/urls";
import { generateSlug } from "@/lib/rotators/slug";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;

const idSchema = z.string().uuid();
const nameSchema = z.string().trim().min(1, "Give it a name.").max(80, "Keep the name under 80 characters.");
const modeSchema = z.enum(["sequential", "random"]);

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function revalidateRotator(id?: string) {
  revalidatePath("/rotators");
  if (id) revalidatePath(`/rotators/${id}`);
}

/** Form action: create a rotator and open it. */
export async function createRotator(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const name = nameSchema.safeParse(formData.get("name") ?? "");
  const mode = modeSchema.safeParse(formData.get("mode") ?? "sequential");
  if (!name.success) redirect(`/rotators?error=${encodeURIComponent(name.error.issues[0].message)}`);

  const entitlements = await getEntitlements();
  const { count } = await supabase.from("rotators").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= entitlements.maxRotators) {
    redirect("/rotators?error=limit");
  }

  // Slugs are random; retry on the (astronomically unlikely) collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("rotators")
      .insert({
        user_id: user.id,
        name: name.data,
        mode: mode.success ? mode.data : "sequential",
        slug: generateSlug(),
      })
      .select("id")
      .single();
    if (!error && data) {
      revalidateRotator();
      redirect(`/rotators/${data.id}?created=1`);
    }
    if (error && error.code !== "23505") {
      console.error("create rotator failed", error);
      break;
    }
  }
  redirect(`/rotators?error=${encodeURIComponent("Couldn't create that link. Please try again.")}`);
}

const updateSchema = z.object({
  name: nameSchema.optional(),
  mode: modeSchema.optional(),
  active: z.boolean().optional(),
});

export async function updateRotator(
  id: string,
  patch: z.input<typeof updateSchema>,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!idSchema.safeParse(id).success) return { error: "Unknown link." };
  const parsed = updateSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("rotators").update(parsed.data).eq("id", id);
  if (error) return { error: "Couldn't save that change." };
  revalidateRotator(id);
  return {};
}

/** Delete a rotator, its images, and their stored files. */
export async function deleteRotator(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!idSchema.safeParse(id).success) return { error: "Unknown link." };

  const { data: images } = await supabase
    .from("rotator_images")
    .select("storage_path")
    .eq("rotator_id", id);
  const paths = (images ?? []).map((i) => i.storage_path).filter((p): p is string => !!p);

  const { error } = await supabase.from("rotators").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Couldn't delete that link." };
  if (paths.length) await supabase.storage.from(IMAGE_BUCKET).remove(paths);

  revalidateRotator();
  redirect("/rotators");
}

/** How many more images this rotator can take on the user's plan. */
async function slotsLeft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rotatorId: string,
): Promise<{ left: number; nextPosition: number } | null> {
  const { data: rotator } = await supabase
    .from("rotators")
    .select("id")
    .eq("id", rotatorId)
    .maybeSingle();
  if (!rotator) return null;

  const [{ maxImagesPerRotator }, { data: images }] = await Promise.all([
    getEntitlements(),
    supabase.from("rotator_images").select("position").eq("rotator_id", rotatorId),
  ]);
  const existing = images ?? [];
  const nextPosition = existing.reduce((m, i) => Math.max(m, i.position + 1), 0);
  return { left: Math.max(0, maxImagesPerRotator - existing.length), nextPosition };
}

function limitMessage(): string {
  return "You've hit your plan's image limit for this link. Upgrade to Pro for more.";
}

/** Add an image the user hosts elsewhere, by https URL. */
export async function addImageUrl(
  rotatorId: string,
  rawUrl: string,
  label?: string,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!idSchema.safeParse(rotatorId).success) return { error: "Unknown link." };

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { error: "That doesn't look like a URL." };
  }
  if (url.protocol !== "https:") return { error: "Image URLs must start with https://" };
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[::1\])/i.test(url.hostname)) {
    return { error: "That address isn't publicly reachable." };
  }

  const slots = await slotsLeft(supabase, rotatorId);
  if (!slots) return { error: "Unknown link." };
  if (slots.left < 1) return { error: limitMessage() };

  const { error } = await supabase.from("rotator_images").insert({
    rotator_id: rotatorId,
    user_id: user.id,
    external_url: url.toString(),
    label: label?.trim().slice(0, 120) || null,
    position: slots.nextPosition,
  });
  if (error) return { error: "Couldn't add that image." };
  revalidateRotator(rotatorId);
  return {};
}

const uploadedSchema = z
  .array(
    z.object({
      path: z.string().min(1).max(300),
      contentType: z.enum(ALLOWED_TYPES),
      label: z.string().max(120).optional(),
    }),
  )
  .min(1)
  .max(50);

/**
 * Record files the browser already uploaded to storage. Paths must sit inside
 * the user's own <user_id>/<rotator_id>/ folder. Anything past the plan limit
 * is removed from storage again.
 */
export async function registerUploadedImages(
  rotatorId: string,
  files: z.input<typeof uploadedSchema>,
): Promise<ActionResult & { added?: number }> {
  const { supabase, user } = await requireUser();
  if (!idSchema.safeParse(rotatorId).success) return { error: "Unknown link." };
  const parsed = uploadedSchema.safeParse(files);
  if (!parsed.success) return { error: "Only PNG, JPEG, GIF, or WebP images can be added." };

  const prefix = `${user.id}/${rotatorId}/`;
  if (parsed.data.some((f) => !f.path.startsWith(prefix) || f.path.includes(".."))) {
    return { error: "Upload path mismatch." };
  }

  const slots = await slotsLeft(supabase, rotatorId);
  if (!slots) return { error: "Unknown link." };

  const accepted = parsed.data.slice(0, slots.left);
  const rejected = parsed.data.slice(slots.left);
  if (rejected.length) {
    await supabase.storage.from(IMAGE_BUCKET).remove(rejected.map((f) => f.path));
  }

  if (accepted.length) {
    const { error } = await supabase.from("rotator_images").insert(
      accepted.map((f, i) => ({
        rotator_id: rotatorId,
        user_id: user.id,
        storage_path: f.path,
        content_type: f.contentType,
        label: f.label?.trim() || null,
        position: slots.nextPosition + i,
      })),
    );
    if (error) {
      await supabase.storage.from(IMAGE_BUCKET).remove(accepted.map((f) => f.path));
      return { error: "Couldn't save those images." };
    }
  }

  revalidateRotator(rotatorId);
  if (rejected.length) {
    return {
      added: accepted.length,
      error: `${rejected.length} image${rejected.length === 1 ? "" : "s"} skipped. ${limitMessage()}`,
    };
  }
  return { added: accepted.length };
}

export async function deleteImage(imageId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!idSchema.safeParse(imageId).success) return { error: "Unknown image." };

  const { data: image } = await supabase
    .from("rotator_images")
    .select("rotator_id, storage_path")
    .eq("id", imageId)
    .maybeSingle();
  if (!image) return { error: "Unknown image." };

  const { error } = await supabase.from("rotator_images").delete().eq("id", imageId);
  if (error) return { error: "Couldn't remove that image." };
  if (image.storage_path) await supabase.storage.from(IMAGE_BUCKET).remove([image.storage_path]);

  revalidateRotator(image.rotator_id);
  return {};
}

/** Move an image one step earlier or later in the rotation order. */
export async function moveImage(imageId: string, direction: "up" | "down"): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!idSchema.safeParse(imageId).success) return { error: "Unknown image." };

  const { data: target } = await supabase
    .from("rotator_images")
    .select("rotator_id")
    .eq("id", imageId)
    .maybeSingle();
  if (!target) return { error: "Unknown image." };

  const { data: images } = await supabase
    .from("rotator_images")
    .select("id, position")
    .eq("rotator_id", target.rotator_id)
    .order("position")
    .order("created_at")
    .order("id");
  const order = (images ?? []).map((i) => i.id);
  const from = order.indexOf(imageId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= order.length) return {};
  [order[from], order[to]] = [order[to], order[from]];

  // Rewrite positions densely (0..n-1), touching only rows that changed.
  const current = new Map((images ?? []).map((i) => [i.id, i.position]));
  const updates = order
    .map((id, position) => ({ id, position }))
    .filter(({ id, position }) => current.get(id) !== position);
  for (const { id, position } of updates) {
    const { error } = await supabase.from("rotator_images").update({ position }).eq("id", id);
    if (error) return { error: "Couldn't reorder images." };
  }

  revalidateRotator(target.rotator_id);
  return {};
}
