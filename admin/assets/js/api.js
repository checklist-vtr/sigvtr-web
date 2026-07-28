const ApiService = (() => {
  const CONFIG = {
    baseUrl: "",
    timeout: 15000
  };

  async function request(endpoint, options = {}) {
    if (!CONFIG.baseUrl) {
      throw new Error("API ainda não configurada.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    try {
      const response = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        throw new Error(`Falha na API: ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    configure(baseUrl) {
      CONFIG.baseUrl = baseUrl.trim();
    },
    request
  };
})();
