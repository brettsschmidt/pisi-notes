import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export function createAdminClient() {
  return createClient<Database, "pisi">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: "pisi" },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
