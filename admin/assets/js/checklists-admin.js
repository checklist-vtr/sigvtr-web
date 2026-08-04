(()=>{
  const byId=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let loading=false;
  async function load(force=false){
    if(loading)return;loading=true;
    const state=byId('checkState'),rows=byId('checkRows'),button=byId('checkSearch');
    state.innerHTML='<div class="loading-state"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Carregando checklists...</span></div>';
    if(button)button.disabled=true;
    try{
      const d=await ApiService.get('adminChecklists',{prefixo:byId('checkPrefix').value.trim()},force?{forceNetwork:true}:{});
      AdminApp.showConnection(d._cache);
      const items=Array.isArray(d.items)?d.items:[],total=Number(d.total??items.length??0);
      state.innerHTML=total?`<p class="text-secondary mb-3">${total} registro${total===1?'':'s'} encontrado${total===1?'':'s'}.</p>`:'<div class="empty-state"><i class="bi bi-clipboard2-x"></i><div><strong>Nenhum checklist encontrado.</strong><div class="small">Os próximos envios do Checklist do Condutor serão exibidos aqui.</div></div></div>';
      rows.innerHTML=items.map(r=>`<tr><td class="fw-semibold">${esc(r.protocolo)}</td><td>${esc(r.dataHora)}</td><td>${esc(r.prefixo)}</td><td>${esc(r.condutor)}</td><td>${esc(r.km)}</td><td>${esc(r.combustivel)}</td><td>${esc(r.status)}</td></tr>`).join('');
    }catch(err){rows.innerHTML='';state.innerHTML=`<div class="alert alert-danger"><strong>Não foi possível carregar os checklists.</strong><div class="small mt-1">${esc(err.message)}</div></div>`;}
    finally{loading=false;if(button)button.disabled=false;}
  }
  document.addEventListener('DOMContentLoaded',()=>{if(!AdminApp.shell())return;const query=new URLSearchParams(location.search);byId('checkPrefix').value=query.get('prefixo')||query.get('busca')||'';byId('checkSearch').onclick=()=>load(true);byId('checkPrefix').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();load(true);}});load();});
})();
