const AuthService = (() => {
  const SESSION_KEY = "sigvtr_admin_session";
  const ATTEMPTS_KEY = "sigvtr_login_attempts";
  const EMAIL_KEY = "sigvtr_remembered_email";
  const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 5 * 60 * 1000;

  const ROUTE_PERMISSIONS = {
    "index.html": ["ADMINISTRADOR", "SUPERVISOR"],
    "viaturas.html": ["ADMINISTRADOR", "SUPERVISOR"],
    "checklists.html": ["ADMINISTRADOR", "SUPERVISOR"],
    "usuarios.html": ["ADMINISTRADOR"],
    "avarias.html": ["ADMINISTRADOR", "SUPERVISOR"],
    "relatorios.html": ["ADMINISTRADOR", "SUPERVISOR"],
    "configuracoes.html": ["ADMINISTRADOR"]
  };

  function now() { return Date.now(); }

  function parseStorage(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch (_) { localStorage.removeItem(key); return null; }
  }

  function getSession() {
    let session = null;
    try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch (_) { clearSession(); return null; }

    if (!session || !session.expiresAt || session.expiresAt <= now()) {
      clearSession();
      return null;
    }
    return session;
  }

  function createSession(user) {
    const session = {
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      createdAt: now(),
      expiresAt: now() + SESSION_DURATION_MS
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

  function getAttemptState() {
    return parseStorage(ATTEMPTS_KEY) || { count: 0, lockedUntil: 0 };
  }

  function registerFailedAttempt() {
    const state = getAttemptState();
    const count = state.lockedUntil > now() ? state.count : state.count + 1;
    const next = count >= MAX_ATTEMPTS
      ? { count, lockedUntil: now() + LOCK_DURATION_MS }
      : { count, lockedUntil: 0 };
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
    return next;
  }

  function resetAttempts() { localStorage.removeItem(ATTEMPTS_KEY); }

  function getLockRemainingMs() {
    const state = getAttemptState();
    if (!state.lockedUntil || state.lockedUntil <= now()) {
      if (state.lockedUntil) resetAttempts();
      return 0;
    }
    return state.lockedUntil - now();
  }

  async function authenticate(email, password) {
    const remaining = getLockRemainingMs();
    if (remaining > 0) {
      return { ok: false, code: "LOCKED", remainingMs: remaining };
    }

    // MODO PROTÓTIPO: substituir por ApiService.request('/login', ...) na integração oficial.
    await new Promise(resolve => setTimeout(resolve, 650));
    const valid = email.toLowerCase() === "admin@sigvtr.local" && password === "SIGVTR@2026";

    if (!valid) {
      const state = registerFailedAttempt();
      return {
        ok: false,
        code: state.lockedUntil ? "LOCKED" : "INVALID_CREDENTIALS",
        remainingAttempts: Math.max(0, MAX_ATTEMPTS - state.count),
        remainingMs: state.lockedUntil ? LOCK_DURATION_MS : 0
      };
    }

    resetAttempts();
    return {
      ok: true,
      session: createSession({
        id: "USR-ADMIN-001",
        name: "Administrador",
        email: "admin@sigvtr.local",
        role: "ADMINISTRADOR"
      })
    };
  }

  function requireAuthentication(options = {}) {
    const session = getSession();
    if (!session) {
      const current = encodeURIComponent(location.pathname.split('/').pop() || 'index.html');
      location.replace(`login.html?redirect=${current}`);
      return null;
    }

    const route = location.pathname.split('/').pop() || "index.html";
    const allowedRoles = options.roles || ROUTE_PERMISSIONS[route];
    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      location.replace("acesso-negado.html");
      return null;
    }
    return session;
  }

  function redirectAuthenticatedUser() {
    if (!getSession()) return;
    const params = new URLSearchParams(location.search);
    location.replace(params.get("redirect") || "index.html");
  }

  function logout() {
    clearSession();
    location.replace("login.html?logout=1");
  }

  function rememberEmail(email, remember) {
    remember ? localStorage.setItem(EMAIL_KEY, email) : localStorage.removeItem(EMAIL_KEY);
  }

  function getRememberedEmail() { return localStorage.getItem(EMAIL_KEY) || ""; }

  return {
    authenticate,
    getSession,
    requireAuthentication,
    redirectAuthenticatedUser,
    logout,
    rememberEmail,
    getRememberedEmail,
    getLockRemainingMs
  };
})();
