const CACHE_NAME = "sigvtr-fiscal-v1190rc1";
const APP_FILES = [
  "./",
  "./index.html?v=1.19.0-rc1",
  "./css/style.css?v=1.19.0-rc1",
  "./js/app.js?v=1.19.0-rc1",
  "./manifest.json?v=1.19.0-rc1",
  "../assets/icons/android-chrome-192x192.png",
  "../assets/icons/android-chrome-512x512.png",
  "../assets/logo/brasao-20bpm-oficial.webp"
];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_FILES)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
 event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{if(response&&response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,response.clone()));return response}).catch(()=>caches.match(event.request).then(r=>r||caches.match("./index.html?v=1.19.0-rc1"))));
});
