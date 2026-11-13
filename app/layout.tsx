import type { Metadata, Viewport } from "next";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pisi-notes.brettsschmidt.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "pisi-notes",
  description:
    "A chat-style notebook that turns quick thoughts into tagged, searchable Markdown — with tasks, reminders, a calendar, and an AI that has read your notes.",
  applicationName: "pisi-notes",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "pisi",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "pisi-notes",
    title: "pisi-notes — write it like a text, keep it like Markdown",
    description:
      "A chat-style notebook with tasks, reminders, a calendar, and an AI that has read your notes.",
  },
  twitter: {
    card: "summary",
    title: "pisi-notes",
    description: "Write it like a text. Keep it like Markdown.",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3a1d5a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Inline so the dark class is applied before paint, avoiding a flash.
const themeBootstrap = `
(function(){try{var t=localStorage.getItem('pisi-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
