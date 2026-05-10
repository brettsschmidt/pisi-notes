// Minimal service worker — exists so Chrome / Android show the install prompt.
// We don't cache yet (the app is server-rendered and tiny); revisit if we
// add offline support.

const VERSION = "v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // pass-through — required for the install prompt to fire
});

// Touch the version so a redeploy invalidates the registered SW.
self.PISI_SW_VERSION = VERSION;
