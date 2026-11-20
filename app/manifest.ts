import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quiet Upsell",
    short_name: "Quiet Upsell",
    description: "A new image on every email open.",
    start_url: "/rotators",
    scope: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#2563eb",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
