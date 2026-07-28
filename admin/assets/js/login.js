const LoginPage = (() => {
  const elements = {};
  let lockTimer = null;

  function cacheElements() {
    elements.form = document.getElementById("loginForm");
    elements.email = document.getElementById("email");
    elements.password = document.getElementById("password");
    elements.remember = document.getElementById("rememberEmail");
    elements.alert = document.getElementById("loginAlert");
    elements.button = document.getElementById("loginButton");
    elements.label = elements.button.querySelector(".button-label");
    elements.loading = elements.button.querySelector(".button-loading");
  }

  function showAlert(message, type = "danger") {
    elements.alert.className = `alert alert-${type}`;
    elements.alert.textContent = message;
  }

  function hideAlert() {
    elements.alert.className = "alert d-none";
    elements.alert.textContent = "";
  }

  function setLoading(loading) {
    elements.button.disabled = loading;
    elements.label.classList.toggle("d-none", loading);
    elements.loading.classList.toggle("d-none", !loading);
  }

  function formatRemaining(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(seconds / 60);
    const rest = String(seconds % 60).padStart(2, "0");
    return `${minutes}:${rest}`;
  }

  function startLockCountdown(initialMs) {
    clearInterval(lockTimer);
    elements.button.disabled = true;
    const update = () => {
      const remaining = AuthService.getLockRemainingMs();
      if (remaining <= 0) {
        clearInterval(lockTimer);
        elements.button.disabled = false;
        showAlert("Bloqueio encerrado. Você pode tentar novamente.", "success");
        return;
      }
      showAlert(`Muitas tentativas. Novo acesso permitido em ${formatRemaining(remaining)}.`, "warning");
    };
    update();
    lockTimer = setInterval(update, 1000);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    hideAlert();

    if (!elements.form.checkValidity()) {
      elements.form.classList.add("was-validated");
      return;
    }

    setLoading(true);
    const result = await AuthService.authenticate(elements.email.value.trim(), elements.password.value);
    setLoading(false);

    if (!result.ok) {
      elements.password.value = "";
      elements.password.focus();
      if (result.code === "LOCKED") {
        startLockCountdown(result.remainingMs);
      } else {
        showAlert(`Credenciais inválidas. Restam ${result.remainingAttempts} tentativa(s).`);
      }
      return;
    }

    AuthService.rememberEmail(elements.email.value.trim(), elements.remember.checked);
    showAlert("Acesso autorizado. Redirecionando...", "success");
    const params = new URLSearchParams(location.search);
    location.replace(params.get("redirect") || "index.html");
  }

  function bindEvents() {
    elements.form.addEventListener("submit", handleSubmit);
    document.getElementById("togglePassword").addEventListener("click", (event) => {
      const visible = elements.password.type === "text";
      elements.password.type = visible ? "password" : "text";
      event.currentTarget.innerHTML = visible ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
      event.currentTarget.setAttribute("aria-label", visible ? "Mostrar senha" : "Ocultar senha");
    });
    document.getElementById("forgotPassword").addEventListener("click", () => {
      showAlert("A recuperação de senha será habilitada após a integração com o backend oficial.", "info");
    });
  }

  function init() {
    AuthService.redirectAuthenticatedUser();
    cacheElements();
    const remembered = AuthService.getRememberedEmail();
    if (remembered) {
      elements.email.value = remembered;
      elements.remember.checked = true;
      elements.password.focus();
    }
    const params = new URLSearchParams(location.search);
    if (params.get("logout") === "1") showAlert("Sessão encerrada com segurança.", "success");
    const lockRemaining = AuthService.getLockRemainingMs();
    if (lockRemaining > 0) startLockCountdown(lockRemaining);
    bindEvents();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", LoginPage.init);
