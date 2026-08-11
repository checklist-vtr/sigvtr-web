const CACHE_NAME="sigvtr-fiscal-v11910rc1";
const OFFLINE_PAGE="./index.html?v=1.19.10-rc1";
const APP_FILES=[
 OFFLINE_PAGE,
 "./css/style.css?v=1.19.10-rc1",
 "./js/app.js?v=1.19.10-rc1",
 "./manifest.json?v=1.19.10-rc1",
 "../assets/icons/android-chrome-192x192.png",
 "../assets/icons/android-chrome-512x512.png",
 "../assets/logo/brasao-20bpm-oficial.webp",
 "../assets/logo/brasao-20bpm.webp"
];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_FILES)));
 self.skipWaiting();
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("sigvtr-fiscal-")&&key!==CACHE_NAME).map(key=>caches.delete(key)))));
 self.clients.claim();
});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 if(event.request.mode==="navigate"){
  event.respondWith(fetch(event.request,{cache:"no-store"}).catch(()=>caches.match(OFFLINE_PAGE)));
  return;
 }
 event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{
  if(response&&response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,response.clone()));
  return response;
 }).catch(()=>caches.match(event.request)));
});
