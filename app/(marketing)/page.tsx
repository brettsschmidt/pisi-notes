import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Landing } from "@/components/marketing/landing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Quiet Upsell: a new image on every email open",
  description:
    "Put one image URL in your email and show a different picture each time it's opened. Upload a set of images, choose in-order or random, and paste the link into any email tool.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Signed-in visitors go straight to their links; everyone else gets the
  // marketing landing page.
  if (user) redirect("/rotators");
  return <Landing />;
}
