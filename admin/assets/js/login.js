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
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function startLockCountdown() {
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

      showAlert(
        `Muitas tentativas. Novo acesso permitido em ${formatRemaining(remaining)}.`,
        "warning"
      );
    };

    update();
    lockTimer = setInterval(update, 1000);
  }

  function getSafeReturnUrl() {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("return") || params.get("redirect");

    if (!value || value.includes("://") || value.startsWith("//")) {
      return "index.html";
    }

    return value;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    hideAlert();

    if (!elements.form.checkValidity()) {
      elements.form.classList.add("was-validated");
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.login(
        elements.email.value,
        elements.password.value
      );

      if (!result.success) {
        elements.password.value = "";
        elements.password.focus();

        if (result.blocked) {
          startLockCountdown();
        } else {
          const attempts = Number.isInteger(result.remainingAttempts)
            ? ` Restam ${result.remainingAttempts} tentativa(s).`
            : "";

          showAlert(`${result.message}${attempts}`);
        }

        return;
      }

      AuthService.rememberEmail(
        elements.email.value,
        elements.remember.checked
      );

      showAlert("Acesso autorizado. Redirecionando...", "success");

      window.setTimeout(() => {
        window.location.replace(getSafeReturnUrl());
      }, 250);
    } catch (error) {
      console.error("Falha inesperada no login:", error);
      showAlert("Não foi possível concluir o login. Atualize a página e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function bindEvents() {
    elements.form.addEventListener("submit", handleSubmit);

    document.getElementById("togglePassword").addEventListener("click", (event) => {
      const visible = elements.password.type === "text";
      elements.password.type = visible ? "password" : "text";
      event.currentTarget.innerHTML = visible
        ? '<i class="bi bi-eye"></i>'
        : '<i class="bi bi-eye-slash"></i>';
      event.currentTarget.setAttribute(
        "aria-label",
        visible ? "Mostrar senha" : "Ocultar senha"
      );
    });

    document.getElementById("forgotPassword").addEventListener("click", () => {
      showAlert(
        "A recuperação de senha será habilitada após a integração com o backend oficial.",
        "info"
      );
    });
  }

  function init() {
    cacheElements();

    if (AuthService.redirectAuthenticatedUser()) {
      return;
    }

    const remembered = AuthService.getRememberedEmail();

    if (remembered) {
      elements.email.value = remembered;
      elements.remember.checked = true;
      elements.password.focus();
    }

    if (AuthService.getLockRemainingMs() > 0) {
      startLockCountdown();
    }

    bindEvents();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", LoginPage.init);
