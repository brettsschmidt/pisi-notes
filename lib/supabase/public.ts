import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Cookie-less anon client for public, unauthenticated endpoints (the /i/<slug>
 * image route). It can only call SECURITY DEFINER functions granted to `anon`;
 * RLS keeps every table closed to it.
 */
export function createPublicClient() {
  return createClient<Database, "minmi">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "minmi" },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
