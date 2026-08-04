(()=>{
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icons={VIATURA:'bi-truck-front-fill',CHECKLIST:'bi-clipboard2-check-fill',AVARIA:'bi-tools',ALERTA:'bi-bell-fill'};
  const labels={VIATURA:'Viatura',CHECKLIST:'Checklist',AVARIA:'Avaria',ALERTA:'Alerta'};
  let allItems=[];
  let activeType='TODOS';

  const elements={};
  function cacheElements(){
    ['searchForm','searchInput','searchButton','clearSearchButton','searchSummary','typeFilters','searchState','searchResults'].forEach(id=>elements[id]=document.getElementById(id));
  }
  function setLoading(loading){
    elements.searchButton.disabled=loading;
    elements.searchButton.innerHTML=loading?'<span class="spinner-border spinner-border-sm me-2"></span>Pesquisando...':'<i class="bi bi-search me-1"></i> Pesquisar';
  }
  function counts(items){
    const result={TODOS:items.length,VIATURA:0,CHECKLIST:0,AVARIA:0,ALERTA:0};
    items.forEach(item=>{if(Object.prototype.hasOwnProperty.call(result,item.tipo))result[item.tipo]++;});
    return result;
  }
  function renderSummary(data){
    const c=data.contagens||counts(allItems);
    const cards=[['TODOS','Resultados','bi-search'],['VIATURA','Viaturas','bi-truck-front-fill'],['CHECKLIST','Checklists','bi-clipboard2-check-fill'],['AVARIA','Avarias','bi-tools'],['ALERTA','Alertas','bi-bell-fill']];
    elements.searchSummary.innerHTML=cards.map(([key,title,icon])=>`<div class="col-6 col-md"><article class="search-summary-card"><i class="bi ${icon}"></i><div><span>${esc(title)}</span><strong>${Number(c[key]||0)}</strong></div></article></div>`).join('');
    elements.searchSummary.classList.remove('d-none');
    elements.typeFilters.classList.remove('d-none');
  }
  function updateFilterButtons(){
    document.querySelectorAll('.search-type-filter').forEach(button=>{
      const selected=button.dataset.type===activeType;
      button.classList.toggle('btn-primary',selected);
      button.classList.toggle('btn-outline-primary',!selected);
      const c=counts(allItems)[button.dataset.type]||0;
      button.innerHTML=`${esc(button.textContent.replace(/\s*\(\d+\)$/,''))} <span class="badge ${selected?'text-bg-light':'text-bg-primary'} ms-1">${c}</span>`;
    });
  }
  function renderResults(){
    const visible=activeType==='TODOS'?allItems:allItems.filter(item=>item.tipo===activeType);
    if(!visible.length){
      elements.searchResults.innerHTML='';
      elements.searchState.innerHTML='<div class="empty-state"><i class="bi bi-search"></i><div><strong>Nenhum resultado nesta categoria</strong><div class="small">Altere o filtro ou faça uma nova pesquisa.</div></div></div>';
      return;
    }
    elements.searchState.innerHTML=`<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2"><p class="text-secondary mb-0">Exibindo <strong>${visible.length}</strong> resultado(s).</p><small class="text-secondary">Resultados mais relevantes aparecem primeiro.</small></div>`;
    elements.searchResults.innerHTML=visible.map(item=>`<div class="col-12 col-xl-6"><a class="panel-card p-3 d-flex gap-3 text-decoration-none text-body h-100 search-result-card" href="${esc(item.url)}"><span class="search-result-icon type-${esc(String(item.tipo||'').toLowerCase())}"><i class="bi ${icons[item.tipo]||'bi-search'}"></i></span><div class="flex-grow-1 min-width-0"><div class="d-flex justify-content-between gap-2 flex-wrap"><span class="badge text-bg-primary mb-2">${esc(labels[item.tipo]||item.tipo)}</span>${item.exato?'<span class="badge text-bg-success mb-2">Correspondência exata</span>':''}</div><h2 class="h6 mb-1 text-break">${esc(item.titulo)}</h2><div class="fw-semibold small mb-1 text-break">${esc(item.subtitulo)}</div><p class="text-secondary small mb-0 text-break">${esc(item.descricao)}</p></div><i class="bi bi-chevron-right align-self-center text-secondary"></i></a></div>`).join('');
  }
  function setFilter(type){activeType=type;updateFilterButtons();renderResults();}
  async function run(query){
    const q=String(query||'').trim();
    if(q.length<2){elements.searchInput.focus();return;}
    setLoading(true);activeType='TODOS';allItems=[];elements.searchResults.innerHTML='';elements.searchSummary.classList.add('d-none');elements.typeFilters.classList.add('d-none');elements.clearSearchButton.classList.remove('d-none');
    elements.searchState.innerHTML='<div class="loading-state"><span class="spinner-border spinner-border-sm"></span><div><strong>Pesquisando em todo o SIGVTR...</strong><div class="small">Consultando viaturas, checklists, avarias e alertas.</div></div></div>';
    try{
      const data=await ApiService.get('adminBuscaGlobal',{q},{forceNetwork:true});
      allItems=Array.isArray(data.items)?data.items:[];
      renderSummary(data);updateFilterButtons();renderResults();AdminApp.showConnection(data._cache);
      history.replaceState(null,'','?q='+encodeURIComponent(q));
    }catch(error){
      elements.searchState.innerHTML=`<div class="alert alert-danger mb-0"><i class="bi bi-exclamation-triangle me-2"></i>${esc(error.message)}</div>`;
    }finally{setLoading(false);}
  }
  function clearSearch(){
    allItems=[];activeType='TODOS';elements.searchInput.value='';elements.searchResults.innerHTML='';elements.searchSummary.classList.add('d-none');elements.typeFilters.classList.add('d-none');elements.clearSearchButton.classList.add('d-none');elements.searchState.innerHTML='<div class="empty-state"><i class="bi bi-search"></i><div><strong>Pronto para pesquisar</strong><div class="small">Use o campo acima para consultar todo o histórico disponível no SIGVTR.</div></div></div>';history.replaceState(null,'',location.pathname);elements.searchInput.focus();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    if(!AdminApp.shell())return;
    cacheElements();
    elements.searchForm.addEventListener('submit',event=>{event.preventDefault();run(elements.searchInput.value);});
    elements.clearSearchButton.addEventListener('click',clearSearch);
    document.querySelectorAll('.search-type-filter').forEach(button=>button.addEventListener('click',()=>setFilter(button.dataset.type)));
    const query=new URLSearchParams(location.search).get('q')||'';
    elements.searchInput.value=query;
    if(query.trim().length>=2)run(query);
  });
})();
