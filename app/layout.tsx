import type { Metadata, Viewport } from "next";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import "./globals.css";

export const metadata: Metadata = {
  title: "pisi-notes",
  description: "Rich text notes that travel as Markdown.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "pisi",
    statusBarStyle: "black-translucent",
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
