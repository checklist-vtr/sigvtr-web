const AdminLayout=(()=>{
  const VERSION="1.13.2-rc1";
  const sidebar=`<div class="sidebar-brand"><div class="sidebar-brand-icon"><img src="assets/images/brasao-20bpm.webp" alt="Brasão do 20º BPM"></div><div><strong>SIGVTR</strong><span>20º BPM · Gestão de Viaturas</span></div></div><nav class="sidebar-nav"><p class="sidebar-section-label">Principal</p><a class="sidebar-link" data-page="index.html" href="index.html"><i class="bi bi-grid-1x2-fill"></i><span>Dashboard</span></a><a class="sidebar-link" data-page="busca-global.html" href="busca-global.html"><i class="bi bi-search"></i><span>Pesquisa Global</span></a><a class="sidebar-link" data-page="alertas.html" href="alertas.html"><i class="bi bi-bell-fill"></i><span>Alertas</span></a><a class="sidebar-link" data-page="historico-viatura.html" href="historico-viatura.html"><i class="bi bi-clock-history"></i><span>Histórico por Viatura</span></a><a class="sidebar-link" data-page="viaturas.html" href="viaturas.html"><i class="bi bi-truck-front-fill"></i><span>Viaturas</span></a><a class="sidebar-link" data-page="prontuario.html" href="prontuario.html"><i class="bi bi-journal-text"></i><span>Prontuário</span></a><a class="sidebar-link" data-page="checklists.html" href="checklists.html"><i class="bi bi-clipboard2-check-fill"></i><span>Checklists</span></a><a class="sidebar-link" data-page="avarias.html" href="avarias.html"><i class="bi bi-tools"></i><span>Avarias</span></a><a class="sidebar-link" data-page="usuarios.html" href="usuarios.html"><i class="bi bi-people-fill"></i><span>Usuários</span></a><a class="sidebar-link" data-page="relatorios.html" href="relatorios.html"><i class="bi bi-bar-chart-fill"></i><span>Relatórios</span></a><a class="sidebar-link" data-page="arquivamento.html" href="arquivamento.html"><i class="bi bi-device-hdd-fill"></i><span>Arquivamento</span></a><p class="sidebar-section-label">Sistema</p><a class="sidebar-link" data-page="configuracoes.html" href="configuracoes.html"><i class="bi bi-gear-fill"></i><span>Configurações</span></a></nav><div class="sidebar-footer"><button id="logoutButton" class="sidebar-link border-0 bg-transparent w-100 text-start"><i class="bi bi-box-arrow-right"></i><span>Sair</span></button></div>`;
  const navbar=`<div class="topbar"><div class="topbar-left"><button id="sidebarToggle" class="icon-button d-lg-none" aria-label="Abrir menu"><i class="bi bi-list fs-4"></i></button><div><div class="topbar-title">Painel Administrativo</div><div id="currentDate" class="topbar-date"></div></div></div><div class="topbar-right"><button id="themeToggle" class="icon-button" aria-label="Alternar tema"><i class="bi bi-moon-stars"></i></button><button class="icon-button desktop-only" aria-label="Notificações"><i class="bi bi-bell"></i></button><div class="user-chip"><div class="user-avatar">AD</div><div class="desktop-only"><strong id="userName" class="d-block small">Administrador</strong><span id="userRole" class="d-block text-secondary" style="font-size:.74rem">Administrador</span></div></div></div></div>`;
  const footer=`<div class="app-footer"><div>SIGVTR · Painel Administrativo 1.13.2-rc1 · 20º BPM/PMPA</div><div>Sugestões e melhorias: <a href="mailto:checklist.viaturas.oficial@gmail.com">checklist.viaturas.oficial@gmail.com</a></div></div>`;
  function init(){
    const side=document.getElementById("sidebar"), nav=document.getElementById("navbar"), foot=document.getElementById("footer");
    if(!side||!nav||!foot)return null;
    side.innerHTML=sidebar;nav.innerHTML=navbar;foot.innerHTML=footer;
    const session=AuthService.requireAuthentication();if(!session)return null;
    document.getElementById("userName").textContent=session.user.name;
    document.getElementById("logoutButton").addEventListener("click",AuthService.logout);
    const date=new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(new Date());
    document.getElementById("currentDate").textContent=date[0].toUpperCase()+date.slice(1);
    const page=location.pathname.split("/").pop()||"index.html";
    document.querySelectorAll("[data-page]").forEach(a=>a.classList.toggle("active",a.dataset.page===page));
    const button=document.getElementById("themeToggle");
    if(localStorage.getItem("sigvtr_admin_theme")==="dark")document.body.classList.add("dark-mode");
    const paint=()=>button.innerHTML=document.body.classList.contains("dark-mode")?'<i class="bi bi-sun"></i>':'<i class="bi bi-moon-stars"></i>';
    paint();button.addEventListener("click",()=>{const dark=document.body.classList.toggle("dark-mode");localStorage.setItem("sigvtr_admin_theme",dark?"dark":"light");paint()});
    MenuController.init();return session;
  }
  return{init,VERSION};
})();
