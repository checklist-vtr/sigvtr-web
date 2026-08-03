(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const whatsappUrl=msg=>`https://web.whatsapp.com/send?text=${encodeURIComponent(msg||'')}`;
  async function load(){
    const state=document.getElementById('alertsState'),list=document.getElementById('alertsList');if(!list.dataset.loaded)state.innerHTML='<div class="alert alert-info">Carregando alertas...</div>';
    try{
      const d=await ApiService.get('adminAlertas',{tipo:filterType.value,status:filterStatus.value,prefixo:filterPrefix.value});AdminApp.showConnection(d._cache);
      state.innerHTML=d.total?`<p class="text-secondary">${d.total} alerta(s), mais recentes primeiro.</p>`:'<div class="alert alert-secondary">Nenhum alerta encontrado.</div>';
      list.innerHTML=(d.items||[]).map(a=>`<div class="col-12"><article class="panel-card p-3"><div class="d-flex justify-content-between gap-3 flex-wrap"><div><div class="d-flex gap-2 align-items-center mb-2"><span class="badge text-bg-primary">${esc(a.Tipo)}</span><span class="badge text-bg-light">${esc(a.Status)}</span></div><h2 class="h5 mb-1">${esc(a.Título)}</h2><p class="mb-1"><strong>${esc(a.Prefixo)}</strong> · ${esc([a['Posto/Graduação'],a.Condutor].filter(Boolean).join(' '))} · ${esc(a.KM)} km</p><p class="text-secondary mb-1">${esc(a.Descrição)}</p><small>${esc(a.Data)} ${esc(a.Hora)}</small></div><div class="d-flex flex-column gap-2"><button class="btn btn-success share" data-id="${esc(a.ID_ALERTA)}" data-msg="${encodeURIComponent(a['Mensagem WhatsApp']||'')}"><i class="bi bi-whatsapp"></i> Compartilhar no WhatsApp</button><select class="form-select status" data-id="${esc(a.ID_ALERTA)}">${['NOVO','VISUALIZADO','ENCAMINHADO','RESOLVIDO','ARQUIVADO'].map(s=>`<option ${s===String(a.Status).toUpperCase()?'selected':''}>${s}</option>`).join('')}</select></div></div></article></div>`).join('');list.dataset.loaded='1';
      document.querySelectorAll('.status').forEach(el=>el.onchange=async()=>{try{await ApiService.post('adminAtualizarStatusAlerta',{idAlerta:el.dataset.id,status:el.value,admin:'ADMIN'});load();}catch(e){AdminApp.toast('Falha ao atualizar',e.message,'danger');}});
      document.querySelectorAll('.share').forEach(el=>el.onclick=()=>{
        const message=decodeURIComponent(el.dataset.msg||'');
        const tab=window.open('about:blank','_blank');
        if(tab){tab.opener=null;tab.location.href=whatsappUrl(message);}else{window.location.href=whatsappUrl(message);}
        ApiService.post('adminAtualizarStatusAlerta',{idAlerta:el.dataset.id,status:'ENCAMINHADO',admin:'ADMIN'}).then(load).catch(()=>{});
      });
    }catch(e){state.innerHTML=`<div class="alert alert-danger">${esc(e.message)}</div>`;}
  }
  document.addEventListener('DOMContentLoaded',()=>{AdminApp.shell();refreshAlerts.onclick=load;applyFilters.onclick=load;load();setInterval(()=>{if(!document.hidden)load()},30000);});
})();
