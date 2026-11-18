import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type RotatorRow = Database["minmi"]["Tables"]["rotators"]["Row"];
export type RotatorImageRow = Database["minmi"]["Tables"]["rotator_images"]["Row"];

export interface RotatorSummary extends RotatorRow {
  imageCount: number;
  /** First image in rotation order, for the list thumbnail. */
  cover: Pick<RotatorImageRow, "storage_path" | "external_url"> | null;
}

/** The signed-in user's rotators, newest first, with image counts. */
export async function listRotators(): Promise<RotatorSummary[]> {
  const supabase = await createClient();
  const [{ data: rotators, error }, { data: images }] = await Promise.all([
    supabase.from("rotators").select("*").order("created_at", { ascending: false }),
    supabase
      .from("rotator_images")
      .select("rotator_id, storage_path, external_url, position, created_at")
      .order("position")
      .order("created_at"),
  ]);
  if (error) throw error;

  const byRotator = new Map<string, NonNullable<typeof images>>();
  for (const img of images ?? []) {
    const list = byRotator.get(img.rotator_id) ?? [];
    list.push(img);
    byRotator.set(img.rotator_id, list);
  }

  return (rotators ?? []).map((r) => {
    const imgs = byRotator.get(r.id) ?? [];
    return {
      ...r,
      imageCount: imgs.length,
      cover: imgs[0] ? { storage_path: imgs[0].storage_path, external_url: imgs[0].external_url } : null,
    };
  });
}

export async function countRotators(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("rotators").select("id", { count: "exact", head: true });
  return count ?? 0;
}

/** One rotator plus its images in rotation order, or null if not the user's. */
export async function getRotator(
  id: string,
): Promise<{ rotator: RotatorRow; images: RotatorImageRow[] } | null> {
  const supabase = await createClient();
  const { data: rotator } = await supabase.from("rotators").select("*").eq("id", id).maybeSingle();
  if (!rotator) return null;
  const { data: images, error } = await supabase
    .from("rotator_images")
    .select("*")
    .eq("rotator_id", id)
    .order("position")
    .order("created_at")
    .order("id");
  if (error) throw error;
  return { rotator, images: images ?? [] };
}
