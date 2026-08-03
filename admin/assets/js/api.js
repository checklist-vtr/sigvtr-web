const ApiService=(()=>{
  const CONFIG={
    baseUrl:"https://script.google.com/macros/s/AKfycbzuEEeAptN9MenKWY1oynX6c3gmGY7HgVXyGiGWGaoXeNOrmNNMUBCtXnutHVxJ13rv/exec",
    timeout:20000,
    retries:2,
    cachePrefix:"sigvtr_admin_api_v1120:"
  };
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const cacheKey=(action,params)=>CONFIG.cachePrefix+action+":"+JSON.stringify(Object.keys(params||{}).sort().reduce((o,k)=>(o[k]=params[k],o),{}));
  function readCache(action,params={}){
    try{const raw=localStorage.getItem(cacheKey(action,params));if(!raw)return null;return JSON.parse(raw);}catch(_){return null;}
  }
  function writeCache(action,params,data){
    try{localStorage.setItem(cacheKey(action,params),JSON.stringify({savedAt:Date.now(),data}));}catch(_){/* armazenamento indisponível */}
  }
  async function fetchJson(url,options,attempt=0){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),CONFIG.timeout);
    try{
      const response=await fetch(url,{...options,signal:controller.signal,cache:"no-store"});
      if(!response.ok)throw new Error(`Falha na API: ${response.status}`);
      const json=await response.json();
      if(!json.success)throw new Error(json.message||"Falha no SIGVTR.");
      return json;
    }catch(error){
      if(attempt<CONFIG.retries){await sleep(700*(attempt+1));return fetchJson(url,options,attempt+1);}
      throw error;
    }finally{clearTimeout(timer);}
  }
  async function get(action,params={},options={}){
    const cached=readCache(action,params);
    if(options.cacheOnly){if(!cached)throw new Error("Dados ainda não armazenados neste dispositivo.");return {...cached.data,_cache:{offline:true,savedAt:cached.savedAt}};}
    const url=new URL(CONFIG.baseUrl);url.searchParams.set("action",action);url.searchParams.set("_ts",Date.now());
    Object.entries(params).forEach(([k,v])=>{if(v!==""&&v!=null)url.searchParams.set(k,v)});
    try{
      const json=await fetchJson(url,{method:"GET"});
      const data=json.data??json;writeCache(action,params,data);return {...data,_cache:{offline:false,savedAt:Date.now()}};
    }catch(error){
      if(cached)return {...cached.data,_cache:{offline:true,savedAt:cached.savedAt,error:error.message}};
      throw error;
    }
  }
  async function post(action,data={}){
    const json=await fetchJson(CONFIG.baseUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,data})});
    return json;
  }
  return{configure(v){CONFIG.baseUrl=String(v||"").trim()},get,post,readCache};
})();
