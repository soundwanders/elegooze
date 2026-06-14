const CACHE = "aplc-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Install: cache all assets
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app assets, network-first for anything else
self.addEventListener("fetch", e => {
  // Only handle GET requests for our own origin
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful responses for our own assets
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return index.html for navigation requests
        if (e.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
