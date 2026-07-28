const AuthService = (() => {
  const SESSION_KEY = "sigvtr_admin_session";

  function getSession() {
    const rawSession = sessionStorage.getItem(SESSION_KEY);

    if (!rawSession) {
      return {
        authenticated: true,
        user: {
          name: "Administrador",
          role: "Administrador"
        }
      };
    }

    try {
      return JSON.parse(rawSession);
    } catch (error) {
      console.warn("Sessão inválida. Registro local removido.");
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
  }

  return {
    getSession,
    logout
  };
})();
