const CACHE='sigvtr-admin-v1207rc1';
const APP=['./','./index.html','./alertas.html','./checklists.html','./avarias.html','./historico-viatura.html','./viaturas.html','./cartoes.html','./prontuario.html','./relatorios.html','./assistente.html','./busca-global.html','./usuarios.html','./trocar-senha.html','./assets/css/admin.css','./assets/css/dashboard.css','./assets/css/avarias.css','./assets/css/viaturas.css','./assets/css/cartoes.css','./assets/css/prontuario.css','./assets/css/relatorios.css','./assets/css/assistente.css','./assets/js/api.js','./assets/js/admin.js','./assets/js/alertas.js','./assets/js/checklists-admin.js','./assets/js/historico-viatura.js','./assets/js/avarias.js','./assets/js/viaturas.js','./assets/js/cartoes.js','./assets/js/prontuario.js','./assets/js/auth.js','./assets/js/menu.js','./assets/js/admin-layout.js','./assets/js/usuarios.js','./assets/js/trocar-senha.js','./assets/js/relatorios.js','./assets/js/assistente.js',
  "./assets/css/checklists.css"
];
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
