const AdminApp=(()=>{
  const POLL_MS=20000;
  let pollTimer=null,initializedAlerts=false,seenAlertIds=new Set(),alertModalQueue=[],alertModalVisible=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const menu=`<div class="sidebar-brand"><div class="sidebar-brand-icon"><i class="bi bi-shield-check"></i></div><div><strong>SIGVTR</strong><span>Gestão de Viaturas</span></div></div><nav class="sidebar-nav"><p class="sidebar-section-label">Principal</p>${[['index.html','bi-grid-1x2-fill','Dashboard'],['alertas.html','bi-bell-fill','Alertas'],['historico-viatura.html','bi-clock-history','Histórico por Viatura'],['viaturas.html','bi-truck-front-fill','Viaturas'],['checklists.html','bi-clipboard2-check-fill','Checklists'],['avarias.html','bi-tools','Avarias'],['usuarios.html','bi-people-fill','Usuários'],['relatorios.html','bi-bar-chart-fill','Relatórios'],['configuracoes.html','bi-gear-fill','Configurações']].map(x=>`<a class="sidebar-link" href="${x[0]}"><i class="bi ${x[1]}"></i><span>${x[2]}</span></a>`).join('')}</nav><div class="sidebar-footer"><button id="logoutButton" class="sidebar-link border-0 bg-transparent w-100 text-start"><i class="bi bi-box-arrow-right"></i><span>Sair</span></button></div>`;
  function ensureRuntimeUi(){
    if(!document.getElementById('connectionState'))document.body.insertAdjacentHTML('beforeend','<div id="connectionState" class="position-fixed bottom-0 start-50 translate-middle-x mb-3 px-3 py-2 rounded shadow-sm bg-warning-subtle text-warning-emphasis d-none" style="z-index:1090"></div>');
    if(!document.getElementById('adminRealtimeAlertModal'))document.body.insertAdjacentHTML('beforeend',`<div class="modal fade" id="adminRealtimeAlertModal" tabindex="-1" aria-labelledby="adminRealtimeAlertTitle" aria-hidden="true"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content realtime-alert-modal"><div class="modal-header realtime-alert-header"><div class="d-flex align-items-center gap-3"><span id="adminRealtimeAlertIcon" class="realtime-alert-icon"><i class="bi bi-bell-fill"></i></span><div><div id="adminRealtimeAlertType" class="realtime-alert-type">SIGVTR</div><h2 id="adminRealtimeAlertTitle" class="modal-title h5 mb-0">Novo alerta</h2></div></div><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button></div><div class="modal-body"><p id="adminRealtimeAlertMessage" class="mb-3"></p><div id="adminRealtimeAlertPrefix" class="realtime-alert-prefix"></div></div><div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Fechar</button><a class="btn btn-primary" href="alertas.html"><i class="bi bi-bell me-2"></i>Abrir Central de Alertas</a></div></div></div></div>`);
  }
  function showConnection(cache){
    const el=document.getElementById('connectionState');if(!el)return;
    if(cache&&cache.offline){const when=cache.savedAt?new Date(cache.savedAt).toLocaleString('pt-BR'):'';el.textContent=`Sem conexão estável. Exibindo dados salvos${when?' de '+when:''}.`;el.classList.remove('d-none');}
    else el.classList.add('d-none');
  }
  function alertTheme(kind){
    const normalized=String(kind||'').toUpperCase();
    if(normalized==='AVARIA'||normalized==='DANGER')return{theme:'danger',icon:'bi-exclamation-triangle-fill',label:'AVARIA'};
    if(normalized==='REVISAO'||normalized==='REVISÃO'||normalized==='SUCCESS')return{theme:'success',icon:'bi-wrench-adjustable-circle-fill',label:'REVISÃO'};
    return{theme:'petroleum',icon:'bi-clipboard2-check-fill',label:'CHECKLIST'};
  }
  function showNextRealtimeAlert(){
    if(alertModalVisible||!alertModalQueue.length)return;
    const data=alertModalQueue.shift(),modalEl=document.getElementById('adminRealtimeAlertModal');
    if(!modalEl)return;
    const theme=alertTheme(data.kind);
    modalEl.querySelector('.realtime-alert-modal').className='modal-content realtime-alert-modal theme-'+theme.theme;
    document.getElementById('adminRealtimeAlertIcon').innerHTML=`<i class="bi ${theme.icon}"></i>`;
    document.getElementById('adminRealtimeAlertType').textContent=theme.label+' · SIGVTR';
    document.getElementById('adminRealtimeAlertTitle').textContent=data.title||'Novo alerta';
    document.getElementById('adminRealtimeAlertMessage').textContent=data.message||'';
    const prefix=document.getElementById('adminRealtimeAlertPrefix');
    prefix.textContent=data.prefix?`Viatura: ${data.prefix}`:'';prefix.hidden=!data.prefix;
    const modal=bootstrap.Modal.getOrCreateInstance(modalEl,{backdrop:'static',keyboard:true});
    alertModalVisible=true;
    modalEl.addEventListener('hidden.bs.modal',()=>{alertModalVisible=false;setTimeout(showNextRealtimeAlert,180);},{once:true});
    modal.show();
  }
  function toast(title,message,kind='primary',prefix=''){
    alertModalQueue.push({title,message,kind,prefix});showNextRealtimeAlert();
  }
  function shell(){
    document.getElementById('sidebar').innerHTML=menu;document.getElementById('navbar').innerHTML=`<div class="topbar"><div class="topbar-left"><button id="sidebarToggle" class="icon-button d-lg-none"><i class="bi bi-list fs-4"></i></button><div><div class="topbar-title">Painel Administrativo</div><div id="currentDate" class="topbar-date"></div></div></div><div class="topbar-right"><button id="themeToggle" class="icon-button"><i class="bi bi-moon-stars"></i></button><div class="user-chip"><div class="user-avatar">AD</div><div><strong id="userName" class="d-block small">Administrador</strong><span class="text-secondary" style="font-size:.74rem">Administrador</span></div></div></div></div>`;
    document.getElementById('footer').innerHTML='<div class="app-footer">SIGVTR · Painel Administrativo v1.10.2 · 20º BPM/PMPA</div>';ensureRuntimeUi();
    const s=AuthService.requireAuthentication();if(!s)return false;document.getElementById('userName').textContent=s.user.name;document.getElementById('logoutButton').onclick=AuthService.logout;document.getElementById('currentDate').textContent=new Intl.DateTimeFormat('pt-BR',{dateStyle:'full'}).format(new Date());document.getElementById('themeToggle').onclick=()=>document.body.classList.toggle('dark-mode');MenuController.init();
    if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js?v=1.10.2').catch(()=>{});
    return true;
  }
  function renderDashboard(d){
    const k=document.getElementById('kpiContainer'),tbody=document.getElementById('recentActivity'),pending=document.getElementById('pendingList');
    const cards=[['Checklists hoje',d.checklistsHoje,'bi-clipboard2-check-fill'],['Checklists recebidos',d.checklistsTotal,'bi-inbox-fill'],['Avarias pendentes',d.avariasPendentes,'bi-tools'],['Revisões pendentes',d.revisoesPendentes,'bi-wrench-adjustable'],['Alertas novos',d.alertasNovos,'bi-bell-fill']];
    k.innerHTML=cards.map(x=>`<div class="col-12 col-sm-6 col-xl"><article class="kpi-card h-100"><div class="kpi-card-top"><div><div class="kpi-label">${x[0]}</div><p class="kpi-value">${x[1]}</p></div><div class="kpi-icon"><i class="bi ${x[2]}"></i></div></div></article></div>`).join('');
    tbody.innerHTML=(d.recentes||[]).map(r=>`<tr><td class="fw-semibold">${esc(r.protocolo)}</td><td>${esc(r.prefixo)}</td><td>${esc(r.condutor)}</td><td>${esc(r.status)}</td><td>${esc(r.dataHora)}</td></tr>`).join('')||'<tr><td colspan="5">Nenhum registro.</td></tr>';
    pending.innerHTML=`<a class="btn btn-primary w-100 mb-2" href="alertas.html">Abrir Central de Alertas</a><a class="btn btn-outline-primary w-100" href="historico-viatura.html">Pesquisar histórico</a>`;
  }
  function processRealtimeAlerts(items){
    const current=new Set((items||[]).map(a=>String(a.id||a.ID_ALERTA||'')));if(!initializedAlerts){seenAlertIds=current;initializedAlerts=true;return;}
    (items||[]).slice().reverse().forEach(a=>{const id=String(a.id||a.ID_ALERTA||'');if(id&&!seenAlertIds.has(id))toast(a.titulo||a.Título||'Novo alerta',a.descricao||a.Descrição||'',String(a.tipo||a.Tipo||'').toUpperCase(),a.prefixo||a.Prefixo||'');});seenAlertIds=current;
  }
  async function refreshDashboard(silent=false){
    const k=document.getElementById('kpiContainer');if(!silent&&!k.dataset.loaded)k.innerHTML='<div class="p-4">Carregando...</div>';
    try{const d=await ApiService.get('adminDashboard');renderDashboard(d);k.dataset.loaded='1';showConnection(d._cache);processRealtimeAlerts(d.ultimosAlertas||[]);}catch(e){if(!k.dataset.loaded)k.innerHTML=`<div class="alert alert-danger">${esc(e.message)}</div>`;}
  }
  async function dashboard(){if(!shell())return;await refreshDashboard(false);pollTimer=setInterval(()=>{if(!document.hidden)refreshDashboard(true)},POLL_MS);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDashboard(true)});}
  function init(){if(document.getElementById('kpiContainer'))dashboard();}
  return{init,shell,showConnection,toast};
})();document.addEventListener('DOMContentLoaded',AdminApp.init);
