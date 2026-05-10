"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost") return; // skip in dev

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // ignore — install prompt simply won't appear
    });
  }, []);

  return null;
}
