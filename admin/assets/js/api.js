const ApiService=(()=>{
  const CONFIG={baseUrl:"https://script.google.com/macros/s/AKfycbzuEEeAptN9MenKWY1oynX6c3gmGY7HgVXyGiGWGaoXeNOrmNNMUBCtXnutHVxJ13rv/exec",timeout:15000,retries:1,cachePrefix:"sigvtr_admin_api_v1132rc1:"};
  const memory=new Map(),pending=new Map();
  try{Object.keys(localStorage).filter(k=>k.startsWith("sigvtr_admin_api_")&&!k.startsWith(CONFIG.cachePrefix)).forEach(k=>localStorage.removeItem(k));}catch(_){}
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const stableParams=params=>Object.keys(params||{}).sort().reduce((o,k)=>(o[k]=params[k],o),{});
  const key=(action,params={})=>action+":"+JSON.stringify(stableParams(params));
  const storageKey=(action,params={})=>CONFIG.cachePrefix+key(action,params);
  function friendlyError(error){
    const name=String(error&&error.name||''),msg=String(error&&error.message||'');
    if(name==='AbortError'||/aborted|signal is aborted/i.test(msg))return new Error('A conexão demorou mais que o esperado. Exibindo os últimos dados salvos e tentando novamente.');
    if(/404|Failed to fetch|NetworkError|Load failed/i.test(msg))return new Error('Servidor temporariamente indisponível. Exibindo os últimos dados salvos.');
    return new Error(msg||'Não foi possível atualizar os dados agora.');
  }
  function readCache(action,params={}){const k=key(action,params);if(memory.has(k))return memory.get(k);try{const raw=localStorage.getItem(storageKey(action,params));if(!raw)return null;const parsed=JSON.parse(raw);memory.set(k,parsed);return parsed}catch(_){return null}}
  function writeCache(action,params,data){const entry={savedAt:Date.now(),data};memory.set(key(action,params),entry);try{localStorage.setItem(storageKey(action,params),JSON.stringify(entry))}catch(_){}return entry}
  async function fetchJson(url,options={},attempt=0){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),CONFIG.timeout);try{const response=await fetch(url,{...options,signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error(`Falha na API: ${response.status}`);const json=await response.json();if(!json.success)throw new Error(json.message||'Falha no SIGVTR.');return json}catch(error){if(attempt<CONFIG.retries){await sleep(900*(attempt+1));return fetchJson(url,options,attempt+1)}throw friendlyError(error)}finally{clearTimeout(timer)}}
  function buildUrl(action,params={}){const url=new URL(CONFIG.baseUrl);url.searchParams.set('action',action);url.searchParams.set('_ts',Date.now());Object.entries(params).forEach(([k,v])=>{if(v!==''&&v!=null)url.searchParams.set(k,v)});return url}
  async function networkGet(action,params={}){const requestKey=key(action,params);if(pending.has(requestKey))return pending.get(requestKey);const task=(async()=>{try{const json=await fetchJson(buildUrl(action,params),{method:'GET'});const data=json.data??json;writeCache(action,params,data);return {...data,_cache:{offline:false,savedAt:Date.now()}}}finally{pending.delete(requestKey)}})();pending.set(requestKey,task);return task}
  async function get(action,params={},options={}){const cached=readCache(action,params);if(options.forceNetwork)return networkGet(action,params);if(options.cacheOnly){if(!cached)throw new Error('Dados ainda não armazenados neste dispositivo.');return {...cached.data,_cache:{offline:true,savedAt:cached.savedAt}}}if(options.staleWhileRevalidate&&cached){networkGet(action,params).catch(()=>{});return {...cached.data,_cache:{offline:true,refreshing:true,savedAt:cached.savedAt}}}try{return await networkGet(action,params)}catch(error){if(cached)return {...cached.data,_cache:{offline:true,savedAt:cached.savedAt,error:error.message}};throw error}}
  async function post(action,data={}){const json=await fetchJson(CONFIG.baseUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,data})});return json.data??json}
  return{configure(v){CONFIG.baseUrl=String(v||'').trim()},get,post,readCache,writeCache,friendlyError};
})();
