const MenuController = (() => {
  function init() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const toggleButton = document.getElementById("sidebarToggle");

    if (!sidebar || !backdrop || !toggleButton) {
      return;
    }

    const open = () => {
      sidebar.classList.add("open");
      backdrop.hidden = false;
      toggleButton.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      sidebar.classList.remove("open");
      backdrop.hidden = true;
      toggleButton.setAttribute("aria-expanded", "false");
    };

    toggleButton.addEventListener("click", () => {
      sidebar.classList.contains("open") ? close() : open();
    });

    backdrop.addEventListener("click", close);

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 992) {
        close();
      }
    });
  }

  return { init };
})();
