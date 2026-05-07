import prompts from "prompts";
import { readEnv, publicClient } from "./supabase.js";
import { writeSession, clearSession, readSession } from "./config.js";

export async function login(emailArg?: string): Promise<void> {
  const env = readEnv();
  const supa = publicClient(env);

  const { email } = emailArg
    ? { email: emailArg }
    : await prompts({ type: "text", name: "email", message: "Email" });
  if (!email) throw new Error("email is required");

  const { error: otpError } = await supa.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (otpError) throw otpError;
  console.log(`Sent a 6-digit code to ${email}.`);

  const { token } = await prompts({ type: "text", name: "token", message: "Paste the code" });
  if (!token) throw new Error("code is required");

  const { data, error } = await supa.auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.session) throw error ?? new Error("verification failed");

  await writeSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at ?? 0,
    user_email: email,
    supabase_url: env.url,
  });
  console.log(`Signed in as ${email}.`);
}

export async function logout(): Promise<void> {
  await clearSession();
  console.log("Signed out.");
}

export async function whoami(): Promise<void> {
  const session = await readSession();
  if (!session) {
    console.log("Not signed in.");
    return;
  }
  console.log(session.user_email);
}
