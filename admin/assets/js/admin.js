const AdminApp = (() => {
  const components = {
    sidebar: `
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon"><i class="bi bi-shield-check"></i></div>
        <div>
          <strong>SIGVTR</strong>
          <span>Gestão de Viaturas</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <p class="sidebar-section-label">Principal</p>
        <a class="sidebar-link active" href="index.html">
          <i class="bi bi-grid-1x2-fill"></i><span>Dashboard</span>
        </a>
        <a class="sidebar-link" href="viaturas.html">
          <i class="bi bi-truck-front-fill"></i><span>Viaturas</span>
        </a>
        <a class="sidebar-link" href="checklists.html">
          <i class="bi bi-clipboard2-check-fill"></i><span>Checklists</span>
        </a>
        <a class="sidebar-link" href="usuarios.html">
          <i class="bi bi-people-fill"></i><span>Usuários</span>
        </a>
        <a class="sidebar-link" href="avarias.html">
          <i class="bi bi-tools"></i><span>Avarias</span>
        </a>
        <a class="sidebar-link" href="relatorios.html">
          <i class="bi bi-bar-chart-fill"></i><span>Relatórios</span>
        </a>

        <p class="sidebar-section-label">Sistema</p>
        <a class="sidebar-link" href="configuracoes.html">
          <i class="bi bi-gear-fill"></i><span>Configurações</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <button id="logoutButton" class="sidebar-link border-0 bg-transparent w-100 text-start" type="button">
          <i class="bi bi-box-arrow-right"></i><span>Sair</span>
        </button>
      </div>
    `,
    navbar: `
      <div class="topbar">
        <div class="topbar-left">
          <button id="sidebarToggle" class="icon-button d-lg-none" type="button"
            aria-label="Abrir menu" aria-expanded="false">
            <i class="bi bi-list fs-4"></i>
          </button>
          <div>
            <div class="topbar-title">Painel Administrativo</div>
            <div id="currentDate" class="topbar-date"></div>
          </div>
        </div>

        <div class="topbar-right">
          <button id="themeToggle" class="icon-button" type="button" aria-label="Alternar tema">
            <i class="bi bi-moon-stars"></i>
          </button>

          <button class="icon-button desktop-only" type="button" aria-label="Notificações">
            <i class="bi bi-bell"></i>
          </button>

          <div class="user-chip">
            <div class="user-avatar">AD</div>
            <div class="desktop-only">
              <strong id="userName" class="d-block small">Administrador</strong>
              <span id="userRole" class="d-block text-secondary" style="font-size:.74rem">Administrador</span>
            </div>
          </div>
        </div>
      </div>
    `,
    footer: `
      <div class="app-footer">
        SIGVTR — Sistema Integrado de Gestão de Viaturas · v1.4.1 · 20º BPM/PMPA
      </div>
    `
  };

  const dashboardData = {
    kpis: [
      { label: "Viaturas cadastradas", value: "24", icon: "bi-truck-front-fill", meta: "22 operacionais" },
      { label: "Checklists hoje", value: "18", icon: "bi-clipboard2-check-fill", meta: "75% da frota" },
      { label: "Pendências", value: "5", icon: "bi-exclamation-triangle-fill", meta: "2 com prioridade alta" },
      { label: "Avarias abertas", value: "3", icon: "bi-tools", meta: "1 aguardando análise" },
      { label: "Usuários ativos", value: "31", icon: "bi-people-fill", meta: "4 acessos hoje" }
    ],
    activity: [
      { protocol: "SIG-2026-0018", vehicle: "VTR-2012", user: "CB Almeida", status: "Concluído", statusClass: "success", time: "10:42" },
      { protocol: "SIG-2026-0017", vehicle: "VTR-2018", user: "SGT Costa", status: "Pendente", statusClass: "warning", time: "09:58" },
      { protocol: "SIG-2026-0016", vehicle: "VTR-2007", user: "SD Souza", status: "Avaria", statusClass: "danger", time: "08:31" },
      { protocol: "SIG-2026-0015", vehicle: "VTR-2021", user: "CB Lima", status: "Concluído", statusClass: "success", time: "07:54" }
    ],
    pending: [
      { title: "Checklist incompleto", description: "VTR-2018 · faltam 2 verificações" },
      { title: "Avaria aguardando validação", description: "VTR-2007 · sistema elétrico" },
      { title: "Documento próximo do vencimento", description: "VTR-2014 · licenciamento" }
    ]
  };

  function renderComponents() {
    document.getElementById("sidebar").innerHTML = components.sidebar;
    document.getElementById("navbar").innerHTML = components.navbar;
    document.getElementById("footer").innerHTML = components.footer;
  }

  function renderKpis() {
    const container = document.getElementById("kpiContainer");

    container.innerHTML = dashboardData.kpis.map((item) => `
      <div class="col-12 col-sm-6 col-xl">
        <article class="kpi-card h-100">
          <div class="kpi-card-top">
            <div>
              <div class="kpi-label">${item.label}</div>
              <p class="kpi-value">${item.value}</p>
            </div>
            <div class="kpi-icon"><i class="bi ${item.icon}"></i></div>
          </div>
          <div class="kpi-meta">${item.meta}</div>
        </article>
      </div>
    `).join("");
  }

  function renderActivity() {
    const tbody = document.getElementById("recentActivity");

    tbody.innerHTML = dashboardData.activity.map((item) => `
      <tr>
        <td class="fw-semibold">${item.protocol}</td>
        <td>${item.vehicle}</td>
        <td>${item.user}</td>
        <td><span class="status-badge status-${item.statusClass}">${item.status}</span></td>
        <td>${item.time}</td>
      </tr>
    `).join("");
  }

  function renderPending() {
    const container = document.getElementById("pendingList");

    container.innerHTML = dashboardData.pending.map((item) => `
      <div class="pending-item">
        <span class="pending-dot"></span>
        <div>
          <strong class="d-block">${item.title}</strong>
          <span class="text-secondary small">${item.description}</span>
        </div>
      </div>
    `).join("");
  }

  function formatCurrentDate() {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    const text = formatter.format(new Date());
    document.getElementById("currentDate").textContent =
      text.charAt(0).toUpperCase() + text.slice(1);
  }

  function initTheme() {
    const themeButton = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("sigvtr_admin_theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      themeButton.innerHTML = '<i class="bi bi-sun"></i>';
    }

    themeButton.addEventListener("click", () => {
      const darkMode = document.body.classList.toggle("dark-mode");
      localStorage.setItem("sigvtr_admin_theme", darkMode ? "dark" : "light");
      themeButton.innerHTML = darkMode
        ? '<i class="bi bi-sun"></i>'
        : '<i class="bi bi-moon-stars"></i>';
    });
  }

  function initSession() {
    const session = AuthService.requireAuthentication();

    if (!session) return;

    document.getElementById("userName").textContent = session.user.name;
    document.getElementById("userRole").textContent = "Administrador";
    document.getElementById("logoutButton").addEventListener("click", AuthService.logout);
  }

  function init() {
    renderComponents();
    renderKpis();
    renderActivity();
    renderPending();
    formatCurrentDate();
    initTheme();
    initSession();
    MenuController.init();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", AdminApp.init);
