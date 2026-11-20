import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://quiet-upsell.brettsschmidt.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Quiet Upsell",
  description:
    "One image URL for your email that shows a different picture every time someone opens it. Upload a set of images, pick in-order or random, paste the link.",
  applicationName: "Quiet Upsell",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Quiet Upsell",
    title: "Quiet Upsell: a new image on every email open",
    description:
      "One image URL for your email that shows a different picture every time someone opens it.",
  },
  twitter: {
    card: "summary",
    title: "Quiet Upsell",
    description: "A new image on every email open.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f8a74",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Inline so the dark class is applied before paint, avoiding a flash.
const themeBootstrap = `
(function(){try{var t=localStorage.getItem('minmi-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
