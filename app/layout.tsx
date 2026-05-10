import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pisi-notes",
  description: "Rich text notes that travel as Markdown.",
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
      <body>{children}</body>
    </html>
  );
}
