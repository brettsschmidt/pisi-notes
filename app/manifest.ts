import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "pisi-notes",
    short_name: "pisi",
    description: "Notes that travel as Markdown. With a spooky cat.",
    start_url: "/notes",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a0e2b",
    theme_color: "#3a1d5a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
