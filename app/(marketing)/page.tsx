import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Landing } from "@/components/marketing/landing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "pisi-notes — write it like a text, keep it like Markdown",
  description:
    "A chat-style notebook that turns quick thoughts into tagged, searchable Markdown — with tasks, reminders, a calendar, and an AI that has read every note you've written.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Signed-in visitors go straight to their notes; everyone else gets the
  // marketing landing page.
  if (user) redirect("/notes");
  return <Landing />;
}
