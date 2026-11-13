import { NextResponse } from "next/server";
import { dispatchWeeklyDigests } from "@/lib/ai/digest-dispatch";
import { pushDispatchSecret } from "@/lib/push/config";

// Weekly AI digest. Hit /api/ai/digest once a week from an external cron
// (the same one that drives /api/push/dispatch) with
// `Authorization: Bearer ${PUSH_DISPATCH_SECRET}`.
async function run(request: Request) {
  const secret = pushDispatchSecret();
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const result = await dispatchWeeklyDigests();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "digest dispatch failed" },
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
