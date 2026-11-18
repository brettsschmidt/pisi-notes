import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../types/supabase";

export function hasAdmin(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "E2E auth-gated tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. " +
        "Set SUPABASE_SERVICE_ROLE_KEY in .env.local (or export it) to run them.",
    );
  }
  return createClient<Database, "minmi">(url, key, {
    db: { schema: "minmi" },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createTestUser(email: string, password: string) {
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!;
}

export async function deleteTestUser(userId: string) {
  const admin = adminClient();
  // Best-effort cleanup of owned rows so tests stay isolated even if cascades miss anything.
  await admin.from("rotators").delete().eq("user_id", userId);
  await admin.auth.admin.deleteUser(userId);
}
