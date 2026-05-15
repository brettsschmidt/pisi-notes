import { NextResponse } from "next/server";
import { vapidPublicKey } from "@/lib/push/config";

export async function GET() {
  const key = vapidPublicKey();
  if (!key) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }
  return NextResponse.json({ publicKey: key });
}
