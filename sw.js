const CACHE_NAME = "sigvtr-mobile-v193";
const APP_FILES = [
  "./",
  "./index.html?v=1.9.3",
  "./css/style.css?v=1.9.3",
  "./js/app.js?v=1.9.3",
  "./manifest.json?v=1.9.3",
  "./assets/icons/android-chrome-192x192.png",
  "./assets/icons/android-chrome-512x512.png",
  "./assets/logo/brasao-20bpm.webp",
  "./assets/logo/brasao-20bpm-oficial.webp"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isDocument = event.request.mode === "navigate" || event.request.destination === "document";
  if (isDocument) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          if (response && response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html?v=1.9.3", response.clone()));
          }
          return response;
        })
        .catch(() => caches.match("./index.html?v=1.9.3"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
