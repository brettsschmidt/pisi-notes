import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://minmi-email-helper.brettsschmidt.workers.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Rotating image URLs and API routes aren't pages.
      disallow: ["/api/", "/i/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
