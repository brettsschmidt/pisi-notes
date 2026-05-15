import { NextResponse } from "next/server";
import { dispatchDueReminders } from "@/lib/push/dispatch";
import { pushDispatchSecret } from "@/lib/push/config";

// Triggered by a cron (e.g. Cloudflare Cron Trigger -> fetch(/api/push/dispatch)).
// Authenticates with a shared secret in the Authorization header.
async function run(request: Request) {
  const secret = pushDispatchSecret();
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    const expected = `Bearer ${secret}`;
    if (auth !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const result = await dispatchDueReminders();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "dispatch failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
