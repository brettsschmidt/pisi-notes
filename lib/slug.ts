export function slugify(text: string, maxLen = 40): string {
  const trimmed = text
    .replace(/<!--task:[a-f0-9-]+-->/gi, " ")
    .replace(/[#`*_>\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const slug = trimmed
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
  return slug || "note";
}
