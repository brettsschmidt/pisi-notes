import { redirect } from "next/navigation";
import { MascotMount } from "@/components/mascot/mascot-mount";
import { KeyboardShortcuts } from "@/components/nav/keyboard-shortcuts";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <>
      {children}
      <KeyboardShortcuts />
      <MascotMount />
    </>
  );
}
