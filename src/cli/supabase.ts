import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/supabase.js";
import { readSession } from "./config.js";

export interface CliEnv {
  url: string;
  anonKey: string;
}

export function readEnv(): CliEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PISI_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.PISI_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or the PISI_ equivalents).",
    );
  }
  return { url, anonKey };
}

export function publicClient(env: CliEnv): SupabaseClient<Database> {
  return createClient<Database>(env.url, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function authedClient(): Promise<SupabaseClient<Database>> {
  const env = readEnv();
  const session = await readSession();
  if (!session) throw new Error("Not signed in. Run `pisi login` first.");
  const client = createClient<Database>(env.url, env.anonKey, {
    auth: { autoRefreshToken: true, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  });
  await client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
  return client;
}
