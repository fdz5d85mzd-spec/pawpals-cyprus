// Minimal service worker — its only job is to satisfy browsers'
// installability checklist (a controlling SW with a fetch handler). No
// offline caching yet; every request just passes straight through to the
// network so this can't ever serve stale content.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
