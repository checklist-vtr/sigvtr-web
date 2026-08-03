const CACHE='sigvtr-admin-v1133rc1';
const APP=['./','./index.html','./alertas.html','./checklists.html','./avarias.html','./historico-viatura.html','./viaturas.html','./prontuario.html','./busca-global.html','./assets/css/admin.css','./assets/css/dashboard.css','./assets/css/avarias.css','./assets/css/viaturas.css','./assets/css/prontuario.css','./assets/js/api.js','./assets/js/admin.js','./assets/js/alertas.js','./assets/js/checklists-admin.js','./assets/js/avarias.js','./assets/js/viaturas.js','./assets/js/prontuario.js','./assets/js/auth.js','./assets/js/menu.js','./assets/js/admin-layout.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sigvtr-admin-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
  const request=event.request;
  const destination=request.destination;
  const networkFirst=['document','script','style','worker'].includes(destination)||/\.(?:html|js|css)(?:\?|$)/i.test(request.url);
  if(networkFirst){
    event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response;}).catch(()=>caches.match(request)));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response;})));
});
