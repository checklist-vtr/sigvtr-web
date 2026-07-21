/**
 * =====================================================
 * SIGVTR
 * Service Worker
 * Versão 0.1.0
 * =====================================================
 */

const CACHE_NAME = "sigvtr-v0.1.0";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json"
];

// Instalação
self.addEventListener("install", (event) => {

    event.waitUntil(

        caches.open(CACHE_NAME)

        .then(cache => {

            return cache.addAll(FILES_TO_CACHE);

        })

    );

});

// Ativação

self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys()

        .then(keys => {

            return Promise.all(

                keys.map(key => {

                    if(key !== CACHE_NAME){

                        return caches.delete(key);

                    }

                })

            );

        })

    );

});

// Cache

self.addEventListener("fetch", (event) => {

    event.respondWith(

        caches.match(event.request)

        .then(response => {

            return response || fetch(event.request);

        })

    );

});