import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pisi-notes",
  description: "Rich text notes that travel as Markdown.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
