const CACHE_NAME = "sigvtr-mobile-v183";
const APP_FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./manifest.json",
  "./assets/icons/android-chrome-192x192.png",
  "./assets/icons/android-chrome-512x512.png",
  "./assets/logo/brasao-20bpm.webp",
  "./assets/logo/brasao-20bpm.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const requestUrl = new URL(request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  // Não interfere em chamadas externas, como a API do Google Apps Script.
  if (!isSameOrigin) return;

  const isMainResource =
    request.mode === "navigate" ||
    requestUrl.pathname.endsWith("/index.html") ||
    requestUrl.pathname.endsWith("/js/app.js") ||
    requestUrl.pathname.endsWith("/css/style.css") ||
    requestUrl.pathname.endsWith("/manifest.json");

  if (isMainResource) {
    // Arquivos principais: tenta obter a versão nova primeiro.
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const responseCopy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseCopy);
            });
          }

          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("./index.html");
        })
    );

    return;
  }

  // Imagens e demais arquivos estáticos: usa cache e busca na rede se necessário.
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        if (response && response.ok) {
          const responseCopy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseCopy);
          });
        }

        return response;
      });
    })
  );
});
