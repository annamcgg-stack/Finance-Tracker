/* WealthPlan service worker — offline shell only; never caches auth or API data */

const CACHE_NAME = "wealthplan-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function shouldBypass(request) {
  if (request.method !== "GET") return true;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return true;
  if (url.hostname.includes("supabase.co")) return true;
  if (url.pathname.startsWith("/auth/")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (shouldBypass(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return cached || Response.error();
      })
    );
    return;
  }

  const url = new URL(request.url);
  if (
    url.pathname === "/manifest.json" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === OFFLINE_URL
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      }))
    );
  }
});
