import { createPublicClient } from "@/lib/supabase/public";
import { SLUG_PATTERN } from "@/lib/rotators/slug";
import { storagePublicUrl } from "@/lib/rotators/urls";

// GET /i/<slug> — the URL users put in an email's <img src>. Each request is
// one "open": it advances the rotator and streams back that open's image.
//
// We proxy the bytes instead of redirecting so the URL itself is the image:
// image proxies (Gmail, Outlook) see a plain image response, and the
// no-cache headers ask them to come back on every open instead of reusing
// the first image they fetched.

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "cache-control": "no-store, no-cache, must-revalidate, max-age=0, private",
  pragma: "no-cache",
  expires: "0",
  "x-content-type-options": "nosniff",
};

// 1×1 transparent GIF, served instead of a broken-image icon when a link is
// unknown, paused, empty, or its image can't be fetched.
const PIXEL = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
  (c) => c.charCodeAt(0),
);

function pixel(reason: string): Response {
  return new Response(PIXEL, {
    status: 200,
    headers: { ...NO_CACHE, "content-type": "image/gif", "x-minmi": reason },
  });
}

/** Accept /i/<slug> and also /i/<slug>.png etc. for tools that want an extension. */
function parseSlug(raw: string): string | null {
  const slug = decodeURIComponent(raw).replace(/\.(png|jpe?g|gif|webp)$/i, "");
  return SLUG_PATTERN.test(slug) ? slug : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const slug = parseSlug((await params).slug);
  if (!slug) return pixel("not-found");

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("next_rotator_image", { p_slug: slug });
  if (error) {
    console.error("next_rotator_image failed", error);
    return pixel("error");
  }
  const image = data?.[0];
  if (!image) return pixel("empty");

  const src = image.storage_path ? storagePublicUrl(image.storage_path) : image.external_url;
  if (!src) return pixel("empty");

  let upstream: Response;
  try {
    upstream = await fetch(src, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error("rotator image fetch failed", src, err);
    return pixel("upstream-error");
  }

  const contentType = upstream.headers.get("content-type") ?? image.content_type ?? "";
  if (!upstream.ok || !upstream.body || !contentType.startsWith("image/")) {
    upstream.body?.cancel();
    return pixel("upstream-error");
  }

  const headers: Record<string, string> = { ...NO_CACHE, "content-type": contentType };
  const length = upstream.headers.get("content-length");
  if (length) headers["content-length"] = length;
  return new Response(upstream.body, { status: 200, headers });
}

// Link checkers and some proxies send HEAD first. Answer without counting an
// open, so a HEAD never advances the rotation.
export async function HEAD(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: NO_CACHE,
  });
}
