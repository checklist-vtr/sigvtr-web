(()=>{
  const byId=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const whatsappUrl=msg=>`https://web.whatsapp.com/send?text=${encodeURIComponent(msg||'')}`;
  let loading=false,lastRealtimeSignature="",lastAlertVersion="",pollTimer=null,pollingStopped=false;
  async function load(force=false){
    if(loading)return; loading=true;
    const state=byId('alertsState'),list=byId('alertsList'),refresh=byId('refreshAlerts');
    state.innerHTML='<div class="loading-state"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Carregando alertas...</span></div>';
    if(refresh)refresh.disabled=true;
    try{
      const d=await ApiService.get('adminAlertas',{tipo:byId('filterType').value,status:byId('filterStatus').value,prefixo:byId('filterPrefix').value},force?{forceNetwork:true}:{});
      AdminApp.showConnection(d._cache);
      const items=Array.isArray(d.items)?d.items:[],total=Number(d.total??items.length??0);
      lastRealtimeSignature=items.slice(0,5).map(a=>[a.ID_ALERTA,a.Status,a.Data||'',a.Hora||''].join(':')).join('|');if(d.version)lastAlertVersion=String(d.version);
      state.innerHTML=total?`<p class="text-secondary mb-3">${total} alerta${total===1?'':'s'}, mais recentes primeiro.</p>`:'<div class="empty-state"><i class="bi bi-bell-slash"></i><div><strong>Nenhum alerta encontrado.</strong><div class="small">Novos checklists, avarias e revisões aparecerão aqui.</div></div></div>';
      list.innerHTML=items.map(a=>`<div class="col-12"><article class="panel-card p-3"><div class="d-flex justify-content-between gap-3 flex-wrap"><div><div class="d-flex gap-2 align-items-center mb-2"><span class="badge text-bg-primary">${esc(a.Tipo)}</span><span class="badge text-bg-light">${esc(a.Status)}</span></div><h2 class="h5 mb-1">${esc(a.Título)}</h2><p class="mb-1"><strong>${esc(a.Prefixo)}</strong> · ${esc([a['Posto/Graduação'],a.Condutor].filter(Boolean).join(' '))} · ${esc(a.KM)} km</p><p class="text-secondary mb-1">${esc(a.Descrição)}</p><small>${esc(a.Data)} ${esc(a.Hora)}</small></div><div class="d-flex flex-column gap-2"><button class="btn btn-success share" data-id="${esc(a.ID_ALERTA)}" data-msg="${encodeURIComponent(a['Mensagem WhatsApp']||'')}"><i class="bi bi-whatsapp"></i> Compartilhar no WhatsApp</button><select class="form-select status" data-id="${esc(a.ID_ALERTA)}">${['NOVO','VISUALIZADO','ENCAMINHADO','RESOLVIDO','ARQUIVADO'].map(s=>`<option ${s===String(a.Status).toUpperCase()?'selected':''}>${s}</option>`).join('')}</select></div></div></article></div>`).join('');
      document.querySelectorAll('.status').forEach(el=>el.onchange=async()=>{try{await ApiService.post('adminAtualizarStatusAlerta',{idAlerta:el.dataset.id,status:el.value,admin:'ADMIN'});load(true);}catch(e){AdminApp.toast('Falha ao atualizar',e.message,'AVARIA');}});
      document.querySelectorAll('.share').forEach(el=>el.onclick=()=>{const message=decodeURIComponent(el.dataset.msg||'');const tab=window.open('about:blank','_blank');if(tab){tab.opener=null;tab.location.href=whatsappUrl(message);}else location.href=whatsappUrl(message);ApiService.post('adminAtualizarStatusAlerta',{idAlerta:el.dataset.id,status:'ENCAMINHADO',admin:'ADMIN'}).then(()=>load(true)).catch(()=>{});});
    }catch(e){list.innerHTML='';state.innerHTML=`<div class="alert alert-danger"><strong>Não foi possível carregar os alertas.</strong><div class="small mt-1">${esc(e.message)}</div></div>`;}
    finally{loading=false;if(refresh)refresh.disabled=false;}
  }
  async function pollAlertChanges(){if(pollingStopped||document.hidden||loading)return;try{const d=await ApiService.get('adminAlertasRecentes',{limit:5,sinceVersion:lastAlertVersion},{forceNetwork:true});if(d.version)lastAlertVersion=String(d.version);if(d.unchanged)return;const signature=(d.items||[]).map(a=>[a.ID_ALERTA,a.Status,a.Data||'',a.Hora||''].join(':')).join('|');if(lastRealtimeSignature&&signature&&signature!==lastRealtimeSignature)await load(true);else if(signature)lastRealtimeSignature=signature;}catch(_){}}
  document.addEventListener('DOMContentLoaded',()=>{if(!AdminApp.shell())return;byId('refreshAlerts').onclick=()=>load(true);byId('applyFilters').onclick=()=>load(true);load();pollTimer=setInterval(pollAlertChanges,30000);window.addEventListener('sigvtr:logout-start',()=>{pollingStopped=true;if(pollTimer)clearInterval(pollTimer);pollTimer=null;},{once:true});});
})();
