import "server-only";
import type { VapidKeys } from "./webpush";

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

export function vapidKeys(): VapidKeys | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:noreply@pisi-notes.app";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function pushDispatchSecret(): string | null {
  return process.env.PUSH_DISPATCH_SECRET?.trim() || null;
}
