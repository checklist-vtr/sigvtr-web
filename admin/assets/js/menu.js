const MenuController = (() => {
  const DESKTOP_BREAKPOINT = 992;
  const STORAGE_KEY = "sigvtr_admin_sidebar_collapsed";

  function init() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const mobileToggle = document.getElementById("sidebarToggle");

    if (!sidebar || !backdrop) return;

    let desktopToggle = document.getElementById("sidebarDesktopToggle");
    if (!desktopToggle) {
      desktopToggle = document.createElement("button");
      desktopToggle.id = "sidebarDesktopToggle";
      desktopToggle.type = "button";
      desktopToggle.className = "sidebar-desktop-toggle";
      document.body.appendChild(desktopToggle);
    }

    const isDesktop = () => window.innerWidth >= DESKTOP_BREAKPOINT;

    const paintDesktopToggle = () => {
      const collapsed = document.body.classList.contains("sidebar-collapsed");
      desktopToggle.innerHTML = collapsed ? '<i class="bi bi-chevron-right"></i>' : '<i class="bi bi-chevron-left"></i>';
      desktopToggle.setAttribute("aria-label", collapsed ? "Expandir menu lateral" : "Recolher menu lateral");
      desktopToggle.title = collapsed ? "Expandir menu lateral" : "Recolher menu lateral";
      desktopToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    };

    const closeMobile = () => {
      sidebar.classList.remove("open");
      backdrop.hidden = true;
      if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "false");
    };

    const openMobile = () => {
      sidebar.classList.add("open");
      backdrop.hidden = false;
      if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "true");
    };

    const applyDesktopPreference = () => {
      if (!isDesktop()) {
        document.body.classList.remove("sidebar-collapsed");
        closeMobile();
        return;
      }
      closeMobile();
      const collapsed = localStorage.getItem(STORAGE_KEY) === "1";
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      paintDesktopToggle();
    };

    if (mobileToggle) {
      mobileToggle.addEventListener("click", () => {
        if (isDesktop()) return;
        sidebar.classList.contains("open") ? closeMobile() : openMobile();
      });
    }

    desktopToggle.addEventListener("click", () => {
      if (!isDesktop()) return;
      const collapsed = document.body.classList.toggle("sidebar-collapsed");
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
      paintDesktopToggle();
    });

    backdrop.addEventListener("click", closeMobile);
    window.addEventListener("resize", applyDesktopPreference);
    applyDesktopPreference();
  }

  return { init };
})();
