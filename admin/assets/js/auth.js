const AuthService = (() => {
  const SESSION_KEY = "sigvtr_admin_session";
  const LOGIN_ATTEMPTS_KEY = "sigvtr_login_attempts";
  const REMEMBERED_EMAIL_KEY = "sigvtr_admin_remembered_email";

  const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION_MS = 5 * 60 * 1000;

  const ADMIN_CREDENTIALS = Object.freeze({
    email: "admin@sigvtr.local",
    password: "SIGVTR@2026",
    user: {
      name: "Administrador",
      role: "Administrador"
    }
  });

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function readJson(storage, key) {
    const rawValue = storage.getItem(key);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue);
    } catch (error) {
      storage.removeItem(key);
      return null;
    }
  }

  function getAttemptState() {
    return readJson(localStorage, LOGIN_ATTEMPTS_KEY) || {
      count: 0,
      blockedUntil: 0
    };
  }

  function saveAttemptState(state) {
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(state));
  }

  function clearAttempts() {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  }

  function getBlockStatus() {
    const state = getAttemptState();
    const remainingMs = Math.max(0, state.blockedUntil - Date.now());

    if (remainingMs === 0 && state.blockedUntil > 0) {
      clearAttempts();
      return { blocked: false, remainingMs: 0 };
    }

    return {
      blocked: remainingMs > 0,
      remainingMs
    };
  }

  function registerFailedAttempt() {
    const state = getAttemptState();
    const nextCount = state.count + 1;

    if (nextCount >= MAX_ATTEMPTS) {
      const blockedUntil = Date.now() + BLOCK_DURATION_MS;
      saveAttemptState({ count: nextCount, blockedUntil });

      return {
        blocked: true,
        remainingAttempts: 0,
        blockedUntil
      };
    }

    saveAttemptState({
      count: nextCount,
      blockedUntil: 0
    });

    return {
      blocked: false,
      remainingAttempts: MAX_ATTEMPTS - nextCount,
      blockedUntil: 0
    };
  }

  function createSession(user) {
    const now = Date.now();
    const session = {
      authenticated: true,
      issuedAt: now,
      expiresAt: now + SESSION_DURATION_MS,
      user: {
        name: user.name,
        role: "Administrador"
      }
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function getSession() {
    const session = readJson(sessionStorage, SESSION_KEY);

    if (!session || !session.authenticated || !session.expiresAt) {
      return null;
    }

    if (Date.now() >= session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    if (session.user?.role !== "Administrador") {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  }

  function getReturnUrl() {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get("return");

    if (!returnUrl || returnUrl.includes("://") || returnUrl.startsWith("//")) {
      return "index.html";
    }

    return returnUrl;
  }

  function redirectToLogin() {
    const currentPage = `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search}`;
    window.location.replace(`login.html?return=${encodeURIComponent(currentPage)}`);
  }

  function requireAuthentication() {
    const session = getSession();

    if (!session) {
      redirectToLogin();
      return null;
    }

    return session;
  }

  async function login(email, password) {
    const blockStatus = getBlockStatus();

    if (blockStatus.blocked) {
      return {
        success: false,
        blocked: true,
        remainingMs: blockStatus.remainingMs,
        message: "Acesso temporariamente bloqueado."
      };
    }

    const validEmail = normalizeEmail(email) === ADMIN_CREDENTIALS.email;
    const validPassword = String(password || "") === ADMIN_CREDENTIALS.password;

    if (!validEmail || !validPassword) {
      const attempt = registerFailedAttempt();

      return {
        success: false,
        blocked: attempt.blocked,
        remainingAttempts: attempt.remainingAttempts,
        remainingMs: attempt.blocked
          ? Math.max(0, attempt.blockedUntil - Date.now())
          : 0,
        message: attempt.blocked
          ? "Número máximo de tentativas atingido."
          : "E-mail ou senha inválidos."
      };
    }

    clearAttempts();
    const session = createSession(ADMIN_CREDENTIALS.user);

    return {
      success: true,
      session,
      redirectUrl: getReturnUrl()
    };
  }

  function getLockRemainingMs() {
    return getBlockStatus().remainingMs;
  }

  function rememberEmail(email, shouldRemember) {
    if (shouldRemember) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, normalizeEmail(email));
      return;
    }

    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }

  function getRememberedEmail() {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
  }

  function redirectAuthenticatedUser() {
    const session = getSession();

    if (!session) {
      return false;
    }

    window.location.replace(getReturnUrl());
    return true;
  }

  async function authenticate(email, password) {
    const result = await login(email, password);

    if (result.success) {
      return {
        ok: true,
        code: "AUTHORIZED",
        session: result.session,
        redirectUrl: result.redirectUrl
      };
    }

    return {
      ok: false,
      code: result.blocked ? "LOCKED" : "INVALID_CREDENTIALS",
      remainingAttempts: Number.isInteger(result.remainingAttempts)
        ? result.remainingAttempts
        : 0,
      remainingMs: result.remainingMs || 0,
      message: result.message
    };
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace("login.html");
  }

  return {
    login,
    authenticate,
    logout,
    getSession,
    requireAuthentication,
    getBlockStatus,
    getLockRemainingMs,
    rememberEmail,
    getRememberedEmail,
    redirectAuthenticatedUser
  };
})();
