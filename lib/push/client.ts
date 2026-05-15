"use client";

// Browser helpers for subscribing/unsubscribing to web push.

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) return reg;
  return navigator.serviceWorker.register("/sw.js");
}

export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "not supported" };

  const keyRes = await fetch("/api/push/vapid-key").catch(() => null);
  if (!keyRes || !keyRes.ok) {
    return { ok: false, reason: "push not configured on server" };
  }
  const { publicKey } = (await keyRes.json()) as { publicKey: string };

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "permission denied" };

  const reg = await getRegistration();
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const keyBytes = urlBase64ToUint8Array(publicKey);
    const keyBuf = new ArrayBuffer(keyBytes.byteLength);
    new Uint8Array(keyBuf).set(keyBytes);
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBuf,
    });
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: {
        p256dh: arrayBufferToBase64Url(sub.getKey("p256dh")),
        auth: arrayBufferToBase64Url(sub.getKey("auth")),
      },
      userAgent: navigator.userAgent,
    }),
  });
  if (!res.ok) return { ok: false, reason: "failed to save subscription" };
  return { ok: true };
}

export async function disablePush(): Promise<{ ok: boolean }> {
  if (!pushSupported()) return { ok: false };
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return { ok: true };
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { ok: true };
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => {});
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  return { ok: true };
}

export async function pushSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

function arrayBufferToBase64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
