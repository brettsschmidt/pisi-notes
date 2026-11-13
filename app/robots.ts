import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pisi-notes.brettsschmidt.workers.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Shared notes are public-by-link, not public-to-search; keep API
      // routes out of the index too.
      disallow: ["/api/", "/n/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
