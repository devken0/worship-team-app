// Offline service worker for the Worship Team PWA.
//
// Strategy (GET only — never touches Server Actions, auth, or other mutations):
//   • Build assets (/_next/static, icons, fonts) → cache-first (content-hashed,
//     safe to keep forever).
//   • Public chord images (Supabase `chords` bucket) → cache-first, so charts
//     stay viewable offline once seen.
//   • Page navigations → network-first, falling back to the last cached copy of
//     that page, then to the /offline page.
// Everything else (Supabase auth/REST, RSC fetches, POSTs) passes straight to
// the network so data and sign-in are never served stale.

const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;
const IMAGE_CACHE = `images-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, PAGE_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:css|js|woff2?|png|svg|ico|jpg|jpeg|gif|webp)$/.test(url.pathname)
  );
}

function isChordImage(url) {
  return url.pathname.includes("/storage/v1/object/public/chords/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Public chord images live on Supabase storage (cross-origin) — cache them.
  if (isChordImage(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Leave every other cross-origin request (Supabase auth/REST) to the network.
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return cached ?? Response.error();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return (await cache.match(OFFLINE_URL)) ?? Response.error();
  }
}
