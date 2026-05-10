"use client";

import type { MascotEvent } from "./dialog";

const EVENT_NAME = "pisi:mascot";

export function speak(event: MascotEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<MascotEvent>(EVENT_NAME, { detail: event }));
}

export function onSpeak(handler: (event: MascotEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<MascotEvent>).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
