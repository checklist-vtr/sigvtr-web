const API_URL =
  "https://script.google.com/macros/s/AKfycbzuEEeAptN9MenKWY1oynX6c3gmGY7HgVXyGiGWGaoXeNOrmNNMUBCtXnutHVxJ13rv/exec";

const fallbackItems = [
  "Placas",
  "Giroflex",
  "Sirene",
  "Pneus",
  "Rádio",
  "Estepe",
  "Macaco",
  "Triângulo",
  "Retrovisor E",
  "Retrovisor D",
  "Farol",
  "Lanterna",
  "Freio",
  "Limpador"
];

const state = {
  currentStep: 1,
  items: [],
  itemStatus: {},
  itemDescriptions: {},
  photos: {
    lado_esquerdo: null,
    lado_direito: null,
    odometro: null
  },
  device: {},
  deferredInstallPrompt: null
};

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", async () => {
  setCurrentDate();
  detectDevice();
  initializeTheme();
  initializePrefixSelector();
  bindEvents();
  registerServiceWorker();
  await loadChecklistItems();
  updateStepUI();
});

function bindEvents() {
  $$(".next-button").forEach(button => {
    button.addEventListener("click", () => goToNextStep(Number(button.dataset.next)));
  });

  $$(".prev-button").forEach(button => {
    button.addEventListener("click", () => showStep(Number(button.dataset.prev)));
  });

  $$(".step-dot").forEach(button => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.step);
      if (target < state.currentStep) showStep(target);
    });
  });

  $$("[data-capture]").forEach(button => {
    button.addEventListener("click", () => {
      const type = button.dataset.capture;
      $(`#photo_${type}`).click();
    });
  });

  Object.keys(state.photos).forEach(type => {
    $(`#photo_${type}`).addEventListener("change", event => handlePhoto(type, event));
  });

  $("#checklistForm").addEventListener("submit", submitChecklist);
  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#newChecklistButton").addEventListener("click", resetForm);
  $("#installButton").addEventListener("click", installApp);

  $("#prefixo").addEventListener("change", syncPrefixSelector);

  $("#prefixoOutro").addEventListener("input", event => {
    event.target.value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 12);

    event.target.closest(".field")?.classList.remove("invalid");
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    $("#installButton").hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    $("#installButton").hidden = true;
    state.deferredInstallPrompt = null;
    showToast("SIGVTR instalado no dispositivo.", "success");
  });
}


function initializePrefixSelector() {
  const originalInput = $("#prefixo");
  if (!originalInput) return;

  const field = originalInput.closest(".field");

  originalInput.id = "prefixoOutro";
  originalInput.name = "prefixoOutro";
  originalInput.required = false;
  originalInput.hidden = true;
  originalInput.maxLength = 12;
  originalInput.placeholder = "Digite o prefixo da viatura";

  const select = document.createElement("select");
  select.id = "prefixo";
  select.name = "prefixo";
  select.required = true;
  select.setAttribute("aria-label", "Prefixo da VTR");

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecione o prefixo";
  select.appendChild(placeholder);

  for (let number = 2001; number <= 2021; number++) {
    const option = document.createElement("option");
    option.value = `50-${number}`;
    option.textContent = `50-${number}`;
    select.appendChild(option);
  }

  const otherOption = document.createElement("option");
  otherOption.value = "__OUTRO__";
  otherOption.textContent = "Outro prefixo";
  select.appendChild(otherOption);

  field.insertBefore(select, originalInput);

  let hint = field.querySelector(".field-hint");

  if (!hint) {
    hint = document.createElement("small");
    hint.className = "field-hint";
    field.appendChild(hint);
  }

  hint.textContent =
    "Selecione uma VTR da frota fixa ou escolha “Outro prefixo” para viatura reserva.";
}

function syncPrefixSelector() {
  const select = $("#prefixo");
  const otherInput = $("#prefixoOutro");
  const isOther = select.value === "__OUTRO__";

  otherInput.hidden = !isOther;
  otherInput.required = isOther;

  if (!isOther) {
    otherInput.value = "";
  } else {
    setTimeout(() => otherInput.focus(), 60);
  }

  select.closest(".field")?.classList.remove("invalid");
}

function getPrefixValue() {
  const selected = $("#prefixo")?.value || "";

  if (selected === "__OUTRO__") {
    return ($("#prefixoOutro")?.value || "").trim().toUpperCase();
  }

  return selected.trim().toUpperCase();
}

async function loadChecklistItems() {
  let items = fallbackItems.map((name, index) => ({
    id: index + 1,
    nome: name,
    key: normalizeKey(name),
    categoria: "Conferência",
    ordem: index + 1
  }));

  if (API_URL && !API_URL.includes("COLE_AQUI")) {
    try {
      const response = await fetch(`${API_URL}?action=bootstrap`, { redirect: "follow" });
      const data = await response.json();

      if (data.success && Array.isArray(data.itens) && data.itens.length) {
        items = data.itens.map(item => ({
          ...item,
          key: item.key || normalizeKey(item.nome)
        }));
      }

      if (data.config?.["Nome da OPM"]) {
        $(".institution").textContent = data.config["Nome da OPM"];
      }
    } catch (error) {
      console.warn("Usando lista local de itens:", error);
    }
  }

  state.items = items;
  renderInspectionItems();
}

function renderInspectionItems() {
  const container = $("#inspectionList");
  container.innerHTML = "";

  state.items.forEach(item => {
    const card = document.createElement("article");
    card.className = "inspection-card";
    card.dataset.itemKey = item.key;

    card.innerHTML = `
      <div class="inspection-top">
        <div class="inspection-title">
          <strong>${escapeHtml(item.nome)}</strong>
          <small>${escapeHtml(item.categoria || "Conferência")}</small>
        </div>

        <div class="status-buttons">
          <button class="status-choice ok" type="button"
                  data-status="ok" data-item="${item.key}">
            SEM ALTERAÇÃO
          </button>
          <button class="status-choice change" type="button"
                  data-status="nao" data-item="${item.key}">
            COM ALTERAÇÃO
          </button>
        </div>
      </div>

      <div class="change-description" id="description_${item.key}" hidden>
        <textarea maxlength="500"
                  placeholder="Descreva a alteração encontrada em ${escapeHtml(item.nome)}"></textarea>
      </div>
    `;

    card.querySelectorAll(".status-choice").forEach(button => {
      button.addEventListener("click", () => setItemStatus(item.key, button.dataset.status, card));
    });

    card.querySelector("textarea").addEventListener("input", event => {
      state.itemDescriptions[item.key] = event.target.value.trim();
    });

    container.appendChild(card);
  });
}

function setItemStatus(itemKey, status, card) {
  state.itemStatus[itemKey] = status;

  card.querySelectorAll(".status-choice").forEach(button => {
    button.classList.toggle("selected", button.dataset.status === status);
  });

  const descriptionBox = card.querySelector(".change-description");
  const textarea = descriptionBox.querySelector("textarea");

  if (status === "nao") {
    descriptionBox.hidden = false;
    textarea.required = true;
    setTimeout(() => textarea.focus(), 80);
  } else {
    descriptionBox.hidden = true;
    textarea.required = false;
    textarea.value = "";
    delete state.itemDescriptions[itemKey];
  }

  $("#inspectionError").hidden = true;
}

function goToNextStep(targetStep) {
  if (!validateStep(state.currentStep)) return;
  showStep(targetStep);
}

function showStep(step) {
  state.currentStep = step;

  $$(".form-page").forEach(page => {
    const isActive = Number(page.dataset.page) === step;
    page.hidden = !isActive;
    page.classList.toggle("active", isActive);
  });

  updateStepUI();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateStepUI() {
  const titles = {
    1: "Identificação",
    2: "Itens de conferência",
    3: "Fotos e confirmação"
  };

  $("#stepTitle").textContent = titles[state.currentStep];
  $("#stepCounter").textContent = `Etapa ${state.currentStep} de 3`;
  $("#progressBar").style.width = `${state.currentStep * 33.333}%`;

  $$(".step-dot").forEach(dot => {
    const dotStep = Number(dot.dataset.step);
    dot.classList.toggle("active", dotStep === state.currentStep);
    dot.classList.toggle("completed", dotStep < state.currentStep);
  });
}

function validateStep(step) {
  if (step === 1) return validateIdentification();
  if (step === 2) return validateInspection();
  if (step === 3) return validateFinalStep();
  return true;
}

function validatePrefix(prefix) {
  const value = String(prefix || "").trim().toUpperCase();

  // Frota fixa: 50-2001 até 50-2021.
  const fixedFleet = /^50-(200[1-9]|201[0-9]|202[0-1])$/;

  // Outros prefixos: números, letras e hífen, com até 12 caracteres.
  const otherVehicle = /^(?!-)(?!.*--)[A-Z0-9-]{1,12}(?<!-)$/;

  return fixedFleet.test(value) || otherVehicle.test(value);
}

function validateIdentification() {
  const fields = [
    $("#prefixo"),
    $("#data"),
    $("#postoGraduacao"),
    $("#rg"),
    $("#turno"),
    $("#km"),
    $("#equipe")
  ];

  let valid = true;
  let firstInvalid = null;

  fields.forEach(field => {
    const wrapper = field.closest(".field");
    let fieldValid = field.checkValidity() && String(field.value).trim() !== "";

    if (field.id === "prefixo" && fieldValid) {
      fieldValid = validatePrefix(getPrefixValue());
    }

    wrapper.classList.toggle("invalid", !fieldValid);

    if (!fieldValid && !firstInvalid) {
      firstInvalid = field;
      valid = false;
    }
  });

  if ($("#prefixo").value === "__OUTRO__" && !validatePrefix(getPrefixValue())) {
    valid = false;
    $("#prefixo").closest(".field").classList.add("invalid");
    firstInvalid = $("#prefixoOutro");
  }

  if (!valid) {
    if (
      firstInvalid?.id === "prefixo" ||
      firstInvalid?.id === "prefixoOutro"
    ) {
      showToast(
        "Selecione uma VTR da frota ou informe um prefixo válido no campo Outro.",
        "error"
      );
    } else {
      showToast("Preencha todos os campos obrigatórios.", "error");
    }

    firstInvalid?.focus();
  }

  return valid;
}

function validateInspection() {
  let valid = true;
  let firstProblem = null;

  for (const item of state.items) {
    const status = state.itemStatus[item.key];

    if (!status) {
      valid = false;
      firstProblem = firstProblem || $(`[data-item-key="${item.key}"]`);
      continue;
    }

    if (status === "nao" && !String(state.itemDescriptions[item.key] || "").trim()) {
      valid = false;
      firstProblem = firstProblem || $(`#description_${item.key}`);
    }
  }

  $("#inspectionError").hidden = valid;

  if (!valid) {
    showToast("Avalie todos os itens e descreva cada alteração.", "error");
    firstProblem?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return valid;
}

function validateFinalStep() {
  const photosComplete = Object.values(state.photos).every(Boolean);
  $("#photoError").hidden = photosComplete;

  if (!photosComplete) {
    showToast("Adicione as três fotografias obrigatórias.", "error");
    return false;
  }

  if (!$("#confirmacao").checked) {
    showToast("Confirme a revisão das informações.", "error");
    $("#confirmacao").focus();
    return false;
  }

  return true;
}

async function handlePhoto(type, event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Selecione uma imagem válida.", "error");
    event.target.value = "";
    return;
  }

  try {
    const compressed = await compressImage(file, 1600, 0.76);

    state.photos[type] = {
      tipo: type,
      name: `${type}_${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      data: compressed.split(",")[1],
      preview: compressed
    };

    renderPhoto(type);
  } catch (error) {
    console.error(error);
    showToast("Não foi possível processar a fotografia.", "error");
  }

  event.target.value = "";
}

function renderPhoto(type) {
  const preview = $(`#preview_${type}`);
  const slot = preview.closest(".photo-slot");
  const photo = state.photos[type];

  if (!photo) {
    preview.innerHTML = "";
    slot.classList.remove("has-photo");
    return;
  }

  preview.innerHTML = `
    <img src="${photo.preview}" alt="Fotografia ${type.replaceAll("_", " ")}">
    <button class="remove-photo" type="button" aria-label="Remover fotografia">×</button>
  `;

  preview.querySelector(".remove-photo").addEventListener("click", () => {
    state.photos[type] = null;
    renderPhoto(type);
  });

  slot.classList.add("has-photo");
  $("#photoError").hidden = true;
}

async function submitChecklist(event) {
  event.preventDefault();

  if (!validateStep(3)) return;

  if (!API_URL || API_URL.includes("COLE_AQUI")) {
    showToast("Configure a URL do Apps Script no arquivo app.js.", "error");
    return;
  }

  const payload = {
    action: "salvarRetiradaMobile",
    data: {
      prefixo: getPrefixValue(),
      dataCliente: $("#data").value,
      postoGraduacao: $("#postoGraduacao").value,
      rg: $("#rg").value.trim(),
      turno: $("#turno").value,
      kmInicial: Number($("#km").value),
      equipe: $("#equipe").value.trim(),
      itens: state.itemStatus,
      descricoesAlteracoes: state.itemDescriptions,
      fotos: Object.values(state.photos).map(({ tipo, name, mimeType, data }) => ({
        tipo,
        name,
        mimeType,
        data
      })),
      dispositivo: state.device
    }
  };

  setSubmitting(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });

    const raw = await response.text();
    const result = JSON.parse(raw);

    if (!result.success) {
      throw new Error(result.message || "Não foi possível registrar o checklist.");
    }

    $("#successMessage").textContent =
      `Protocolo ${result.protocolo || result.id || ""} · Status: ${result.status || "REGISTRADO"}`;

    $("#successModal").hidden = false;
  } catch (error) {
    console.error(error);
    showToast(error.message || "Falha no envio. Verifique sua conexão.", "error");
  } finally {
    setSubmitting(false);
  }
}

function setSubmitting(value) {
  $("#submitButton").disabled = value;
  $("#submitText").hidden = value;
  $("#submitSpinner").hidden = !value;
}

function resetForm() {
  $("#checklistForm").reset();

  state.itemStatus = {};
  state.itemDescriptions = {};
  state.photos = {
    lado_esquerdo: null,
    lado_direito: null,
    odometro: null
  };

  setCurrentDate();
  syncPrefixSelector();
  renderInspectionItems();
  Object.keys(state.photos).forEach(renderPhoto);

  $("#inspectionError").hidden = true;
  $("#photoError").hidden = true;
  $("#successModal").hidden = true;

  showStep(1);
}

function setCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  $("#data").value = `${year}-${month}-${day}`;
}

function detectDevice() {
  const ua = navigator.userAgent;

  let type = "Computador";
  if (/tablet|ipad/i.test(ua)) type = "Tablet";
  else if (/mobile|android|iphone/i.test(ua)) type = "Celular";

  let system = "Desconhecido";
  if (/Android/i.test(ua)) system = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) system = "iOS/iPadOS";
  else if (/Windows/i.test(ua)) system = "Windows";
  else if (/Mac OS/i.test(ua)) system = "macOS";
  else if (/Linux/i.test(ua)) system = "Linux";

  let browser = "Outro";
  if (/Edg\//.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome\//.test(ua)) browser = "Google Chrome";
  else if (/Firefox\//.test(ua)) browser = "Mozilla Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  state.device = {
    tipo: type,
    sistema: system,
    navegador: browser,
    idioma: navigator.language || "",
    resolucao: `${screen.width}x${screen.height}`,
    userAgent: ua
  };

  $("#deviceSummary").textContent =
    `${type} · ${system} · ${browser} · ${state.device.resolucao}`;
}

function initializeTheme() {
  const saved = localStorage.getItem("sigvtr-theme");
  const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(saved || preferred);
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("sigvtr-theme", theme);
  $("#themeIcon").textContent = theme === "dark" ? "☀️" : "🌙";
}

async function installApp() {
  if (!state.deferredInstallPrompt) {
    showToast("Use o menu do navegador para adicionar o SIGVTR à tela inicial.", "");
    return;
  }

  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice;
  state.deferredInstallPrompt = null;
  $("#installButton").hidden = true;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(error => {
        console.warn("Service Worker não registrado:", error);
      });
    });
  }
}

function compressImage(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();

      image.onerror = reject;
      image.onload = () => {
        const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message, type = "") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.className = "toast";
  }, 4300);
}
