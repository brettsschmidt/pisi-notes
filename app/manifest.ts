import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Minmi Email Helper",
    short_name: "Minmi",
    description: "A new image on every email open.",
    start_url: "/rotators",
    scope: "/",
    display: "standalone",
    background_color: "#0c1f1b",
    theme_color: "#0f8a74",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
