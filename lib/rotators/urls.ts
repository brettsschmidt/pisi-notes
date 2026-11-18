// URL helpers shared by server and client code.

export const IMAGE_BUCKET = "minmi-images";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** The public, rotating image URL a user pastes into their email. */
export function rotatorImageUrl(slug: string): string {
  return `${siteUrl()}/i/${slug}`;
}

/** Public URL of a file in the minmi-images storage bucket. */
export function storagePublicUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${IMAGE_BUCKET}/${encoded}`;
}

/** What the dashboard shows for an image: its stored file or its external URL. */
export function imageSrc(img: { storage_path: string | null; external_url: string | null }): string {
  return img.storage_path ? storagePublicUrl(img.storage_path) : (img.external_url ?? "");
}

/** Ready-to-paste HTML for an email builder's "custom HTML" block. */
export function emailImgSnippet(url: string, alt: string): string {
  const safeAlt = alt.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<img src="${url}" alt="${safeAlt}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />`;
}
