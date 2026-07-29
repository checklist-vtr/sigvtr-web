const API_URL =
  "https://script.google.com/macros/s/AKfycbzuEEeAptN9MenKWY1oynX6c3gmGY7HgVXyGiGWGaoXeNOrmNNMUBCtXnutHVxJ13rv/exec";

const TOTAL_STEPS = 12;

const inspectionCategories = [
  {
    step: 2,
    title: "Pneus e Rodas",
    description: "Verifique individualmente pneus, rodas e estepe.",
    items: [
      "Pneu dianteiro esquerdo", "Pneu dianteiro direito", "Pneu traseiro esquerdo",
      "Pneu traseiro direito", "Estepe", "Roda dianteira esquerda",
      "Roda dianteira direita", "Roda traseira esquerda", "Roda traseira direita"
    ]
  },
  {
    step: 3,
    title: "Iluminação e Faróis",
    description: "Confira faróis, lanternas e luzes auxiliares.",
    items: [
      "Farol dianteiro esquerdo", "Farol dianteiro direito",
      "Lanterna dianteira esquerda", "Lanterna dianteira direita",
      "Lanterna traseira esquerda", "Lanterna traseira direita",
      "Luz de freio", "Luz de ré", "Luz da placa"
    ]
  },
  {
    step: 4,
    title: "Sinalização e Comunicação",
    description: "Teste os recursos luminosos, sonoros e de comunicação.",
    items: [
      "Giroflex dianteiro", "Giroflex traseiro", "Sirene",
      "Alto-falante (megafone)", "Rádio comunicador", "Tablet ou módulo de dados",
      "GPS ou rastreador", "Câmera veicular"
    ]
  },
  {
    step: 5,
    title: "Lataria Externa",
    description: "Inspecione a carroceria e cada lado da viatura.",
    items: [
      "Para-choque dianteiro", "Para-choque traseiro", "Capô", "Grade dianteira",
      "Para-lama dianteiro esquerdo", "Para-lama dianteiro direito",
      "Porta dianteira lado motorista", "Porta dianteira lado passageiro",
      "Porta traseira lado motorista", "Porta traseira lado passageiro",
      "Lateral traseira esquerda", "Lateral traseira direita", "Teto",
      "Caçamba ou tampa traseira"
    ]
  },
  {
    step: 6,
    title: "Vidros, Limpadores e Retrovisores",
    description: "Confira vidros, espelhos e sistemas de limpeza.",
    items: [
      "Para-brisa", "Vidro dianteiro esquerdo", "Vidro dianteiro direito",
      "Vidro traseiro esquerdo", "Vidro traseiro direito",
      "Retrovisor esquerdo", "Retrovisor direito",
      "Limpador do para-brisa dianteiro", "Limpador do vidro traseiro"
    ]
  },
  {
    step: 7,
    title: "Cabine",
    description: "Verifique bancos, comandos, acabamentos e segurança interna.",
    items: [
      "Banco do motorista", "Banco dianteiro do passageiro", "Bancos traseiros",
      "Cinto do motorista", "Cinto do passageiro", "Cintos traseiros",
      "Painel de instrumentos", "Painel central e comandos", "Volante",
      "Acabamentos internos", "Tapetes", "Limpeza interna"
    ]
  },
  {
    step: 8,
    title: "Compartimento de Detidos (Xadrez)",
    description: "Inspecione a estrutura destinada à condução de detidos.",
    items: [
      "Lataria externa do xadrez", "Estrutura interna do xadrez",
      "Porta do xadrez", "Tranca do xadrez", "Piso do xadrez",
      "Banco interno do xadrez", "Grade de proteção do xadrez",
      "Ventilação e aberturas do xadrez", "Limpeza do xadrez"
    ]
  },
  {
    step: 9,
    title: "Equipamentos Obrigatórios",
    description: "Confirme a presença e as condições dos equipamentos.",
    items: [
      "Triângulo de sinalização", "Macaco", "Chave de roda", "Extintor de incêndio",
      "Cone de sinalização", "Corda ou cabo de reboque", "Colete refletivo",
      "Documentação da viatura"
    ]
  },
  {
    step: 10,
    title: "Mecânica e Segurança",
    description: "Verifique sistemas essenciais ao funcionamento seguro.",
    items: [
      "Freio de serviço", "Freio de estacionamento", "Direção",
      "Suspensão dianteira", "Suspensão traseira", "Amortecedores",
      "Nível de óleo do motor", "Vazamentos", "Bateria", "Correias e mangueiras",
      "Nível de combustível", "Tampa do tanque", "Ar-condicionado",
      "Ventilação e aquecimento", "Desembaçador", "Limpeza externa"
    ]
  }
];

const stepTitles = {
  1: "Identificação",
  11: "Fotos e confirmação",
  12: "Resumo e envio"
};
inspectionCategories.forEach(category => { stepTitles[category.step] = category.title; });

const state = {
  currentStep: 1,
  items: [],
  itemStatus: {},
  itemDescriptions: {},
  photos: { frontal: null, traseira: null, lado_esquerdo: null, lado_direito: null, odometro: null },
  device: {},
  deferredInstallPrompt: null,
  submissionStartedAt: 0,
  progressTimer: null
};

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

window.addEventListener("DOMContentLoaded", async () => {
  buildWizardPages();
  buildStepDots();
  setCurrentDate();
  detectDevice();
  initializeTheme();
  initializePrefixSelector();
  bindEvents();
  registerServiceWorker();
  await loadRemoteConfig();
  updateStepUI();
});

function buildWizardPages() {
  const host = $("#inspectionPages");
  state.items = [];

  inspectionCategories.forEach(category => {
    const section = document.createElement("section");
    section.className = "form-page";
    section.dataset.page = String(category.step);
    section.hidden = true;

    section.innerHTML = `
      <div class="page-heading">
        <span class="page-number">${category.step}</span>
        <div><h2>${escapeHtml(category.title)}</h2><p>${escapeHtml(category.description)}</p></div>
      </div>
      <div class="status-legend"><span><i class="ok-dot"></i> Sem alteração</span><span><i class="change-dot"></i> Com alteração</span></div>
      <div class="inspection-list" data-category-step="${category.step}"></div>
      <p class="form-error inspection-error" hidden>Avalie todos os itens desta categoria antes de continuar.</p>
      <div class="page-actions">
        <button class="secondary-button prev-button" type="button" data-prev="${category.step - 1}"><span aria-hidden="true">←</span> VOLTAR</button>
        <button class="primary-button next-button" type="button" data-next="${category.step + 1}">PRÓXIMA ETAPA <span aria-hidden="true">→</span></button>
      </div>`;

    host.appendChild(section);

    category.items.forEach((name, index) => {
      state.items.push({
        id: `${category.step}-${index + 1}`,
        nome: name,
        key: normalizeKey(name),
        categoria: category.title,
        step: category.step,
        ordem: index + 1
      });
    });
  });

  renderInspectionItems();
}

function buildStepDots() {
  const host = $("#stepDots");
  host.innerHTML = "";
  for (let step = 1; step <= TOTAL_STEPS; step += 1) {
    const button = document.createElement("button");
    button.className = "step-dot";
    button.type = "button";
    button.dataset.step = String(step);
    button.setAttribute("aria-label", `Ir para a etapa ${step}`);
    button.textContent = String(step);
    host.appendChild(button);
  }
}

function bindEvents() {
  document.addEventListener("click", event => {
    const next = event.target.closest(".next-button");
    if (next) goToNextStep(Number(next.dataset.next));

    const prev = event.target.closest(".prev-button");
    if (prev) showStep(Number(prev.dataset.prev));

    const dot = event.target.closest(".step-dot");
    if (dot) {
      const target = Number(dot.dataset.step);
      if (target < state.currentStep) showStep(target);
    }

    const capture = event.target.closest("[data-capture]");
    if (capture) $( `#photo_${capture.dataset.capture}` ).click();
  });

  Object.keys(state.photos).forEach(type => {
    $( `#photo_${type}` ).addEventListener("change", event => handlePhoto(type, event));
  });

  $("#checklistForm").addEventListener("submit", submitChecklist);
  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#newChecklistButton").addEventListener("click", resetForm);
  $("#closeAndRefreshButton")?.addEventListener("click", clearAppCacheAndRefresh);
  $("#installButton").addEventListener("click", installApp);
  $("#prefixo").addEventListener("change", syncPrefixSelector);
  $("#prefixoOutro").addEventListener("input", event => {
    event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);
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

function renderInspectionItems() {
  $$("[data-category-step]").forEach(container => { container.innerHTML = ""; });

  state.items.forEach(item => {
    const container = document.querySelector(`[data-category-step="${item.step}"]`);
    const card = document.createElement("article");
    card.className = "inspection-card";
    card.dataset.itemKey = item.key;
    card.innerHTML = `
      <div class="inspection-top">
        <div class="inspection-title"><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml(item.categoria)}</small></div>
        <div class="status-buttons">
          <button class="status-choice ok" type="button" data-status="ok" data-item="${item.key}">SEM ALTERAÇÃO</button>
          <button class="status-choice change" type="button" data-status="nao" data-item="${item.key}">COM ALTERAÇÃO</button>
        </div>
      </div>
      <div class="change-description" hidden><textarea maxlength="500" placeholder="Descreva a alteração encontrada em ${escapeHtml(item.nome)}"></textarea></div>`;

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

  const box = card.querySelector(".change-description");
  const textarea = box.querySelector("textarea");
  if (status === "nao") {
    box.hidden = false;
    textarea.required = true;
    setTimeout(() => textarea.focus(), 80);
  } else {
    box.hidden = true;
    textarea.required = false;
    textarea.value = "";
    delete state.itemDescriptions[itemKey];
  }
  card.closest(".form-page")?.querySelector(".inspection-error")?.setAttribute("hidden", "");
}

function goToNextStep(targetStep) {
  if (!validateStep(state.currentStep)) return;
  if (targetStep === 12) renderReviewSummary();
  showStep(targetStep);
}

function showStep(step) {
  state.currentStep = step;
  $$(".form-page").forEach(page => {
    const active = Number(page.dataset.page) === step;
    page.hidden = !active;
    page.classList.toggle("active", active);
  });
  if (step === 12) renderReviewSummary();
  updateStepUI();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateStepUI() {
  $("#stepTitle").textContent = stepTitles[state.currentStep] || "Checklist";
  $("#stepCounter").textContent = `Etapa ${state.currentStep} de ${TOTAL_STEPS}`;
  $("#progressBar").style.width = `${(state.currentStep / TOTAL_STEPS) * 100}%`;
  $$(".step-dot").forEach(dot => {
    const step = Number(dot.dataset.step);
    dot.classList.toggle("active", step === state.currentStep);
    dot.classList.toggle("completed", step < state.currentStep);
  });
}

function validateStep(step) {
  if (step === 1) return validateIdentification();
  if (step >= 2 && step <= 10) return validateInspectionCategory(step);
  if (step === 11) return validateFinalStep();
  return true;
}

function validateIdentification() {
  const fields = [$("#prefixo"), $("#data"), $("#condutor"), $("#postoGraduacao"), $("#rg"), $("#turno"), $("#km"), $("#equipe")];
  let valid = true;
  let firstInvalid = null;
  fields.forEach(field => {
    const wrapper = field.closest(".field");
    let fieldValid = field.checkValidity();
    if (field.id === "prefixo") fieldValid = validatePrefix(getPrefixValue());
    wrapper.classList.toggle("invalid", !fieldValid);
    if (!fieldValid && !firstInvalid) firstInvalid = field;
    valid = valid && fieldValid;
  });
  if (!valid) {
    showToast("Preencha corretamente os dados de identificação.", "error");
    firstInvalid?.focus();
  }
  return valid;
}

function validateInspectionCategory(step) {
  const categoryItems = state.items.filter(item => item.step === step);
  let valid = true;
  let firstProblem = null;
  categoryItems.forEach(item => {
    const card = document.querySelector(`.inspection-card[data-item-key="${item.key}"]`);
    const status = state.itemStatus[item.key];
    const description = state.itemDescriptions[item.key] || "";
    const problem = !status || (status === "nao" && description.length < 3);
    card?.classList.toggle("invalid-card", problem);
    if (problem && !firstProblem) firstProblem = card;
    valid = valid && !problem;
  });
  const error = document.querySelector(`.form-page[data-page="${step}"] .inspection-error`);
  if (error) error.hidden = valid;
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
    showToast("Adicione as cinco fotografias obrigatórias.", "error");
    return false;
  }
  if (!$("#confirmacao").checked) {
    showToast("Confirme a revisão das informações.", "error");
    $("#confirmacao").focus();
    return false;
  }
  return true;
}

function renderReviewSummary() {
  const changed = state.items.filter(item => state.itemStatus[item.key] === "nao");
  const host = $("#reviewSummary");
  const changesHtml = changed.length
    ? `<div class="review-changes"><h3>Alterações encontradas (${changed.length})</h3>${changed.map(item => `<div class="review-change"><strong>${escapeHtml(item.nome)}</strong><span>${escapeHtml(state.itemDescriptions[item.key] || "Sem descrição")}</span></div>`).join("")}</div>`
    : `<div class="review-ok">✓ Nenhuma alteração informada.</div>`;

  host.innerHTML = `
    <div class="review-grid">
      <div><span>Viatura</span><strong>${escapeHtml(getPrefixValue())}</strong></div>
      <div><span>KM</span><strong>${escapeHtml($("#km").value)}</strong></div>
      <div><span>Condutor</span><strong>${escapeHtml($("#postoGraduacao").value)} ${escapeHtml($("#condutor").value.trim())}</strong></div>
      <div><span>RG</span><strong>${escapeHtml($("#rg").value.trim())}</strong></div>
      <div><span>Turno</span><strong>${escapeHtml($("#turno").value)}</strong></div>
      <div><span>Fotos</span><strong>${Object.values(state.photos).filter(Boolean).length}/5</strong></div>
      <div><span>Itens avaliados</span><strong>${Object.keys(state.itemStatus).length}/${state.items.length}</strong></div>
      <div><span>Com alteração</span><strong>${changed.length}</strong></div>
    </div>${changesHtml}`;
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
    const compressed = await compressImage(file, 1280, 0.68);
    state.photos[type] = { tipo: type, name: `${type}_${Date.now()}.jpg`, mimeType: "image/jpeg", data: compressed.split(",")[1], preview: compressed };
    renderPhoto(type);
  } catch (error) {
    console.error(error);
    showToast("Não foi possível processar a fotografia.", "error");
  }
  event.target.value = "";
}

function renderPhoto(type) {
  const preview = $( `#preview_${type}` );
  const slot = preview.closest(".photo-slot");
  const photo = state.photos[type];
  if (!photo) {
    preview.innerHTML = "";
    slot.classList.remove("has-photo");
    return;
  }
  preview.innerHTML = `<img src="${photo.preview}" alt="Fotografia ${type.replaceAll("_", " ")}"><button class="remove-photo" type="button" aria-label="Remover fotografia">×</button>`;
  preview.querySelector(".remove-photo").addEventListener("click", () => {
    state.photos[type] = null;
    renderPhoto(type);
  });
  slot.classList.add("has-photo");
  $("#photoError").hidden = true;
}

async function submitChecklist(event) {
  event.preventDefault();
  if (!validateFinalStep()) return;
  if (!API_URL || API_URL.includes("COLE_AQUI")) {
    showToast("Configure a URL do Apps Script no arquivo app.js.", "error");
    return;
  }

  const payload = {
    action: "salvarRetiradaMobile",
    data: {
      prefixo: getPrefixValue(), dataCliente: $("#data").value,
      condutor: $("#condutor").value.trim(), postoGraduacao: $("#postoGraduacao").value,
      rg: $("#rg").value.trim(), turno: $("#turno").value,
      kmInicial: Number($("#km").value), equipe: $("#equipe").value.trim(),
      itens: state.itemStatus, descricoesAlteracoes: state.itemDescriptions,
      fotos: Object.values(state.photos).map(({ tipo, name, mimeType, data }) => ({ tipo, name, mimeType, data })),
      dispositivo: state.device
    }
  };

  setSubmitting(true);
  startSendingExperience();

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload), redirect: "follow"
    });
    const raw = await response.text();
    const result = JSON.parse(raw);
    if (!result.success) throw new Error(result.message || "Não foi possível registrar o checklist.");

    finishSendingExperience();
    await delay(450);
    $("#sendingModal").hidden = true;
    $("#successMessage").textContent = `Protocolo ${result.protocolo || result.id || ""} · Status: ${result.status || "REGISTRADO"}`;
    $("#successModal").hidden = false;
  } catch (error) {
    console.error(error);
    stopSendingExperience();
    $("#sendingModal").hidden = true;
    showToast(error.message || "Falha no envio. Verifique sua conexão.", "error");
  } finally {
    setSubmitting(false);
  }
}

const sendingStageLabels = [
  "Validando informações", "Preparando fotografias", "Enviando dados ao sistema",
  "Aguardando confirmação do servidor", "Gerando protocolo", "Finalizando"
];

function startSendingExperience() {
  state.submissionStartedAt = Date.now();
  $("#sendingModal").hidden = false;
  const host = $("#sendingStages");
  host.innerHTML = sendingStageLabels.map((label, index) => `<div class="sending-stage" data-stage="${index}"><span class="stage-indicator">${index === 0 ? "◌" : "○"}</span><span>${label}</span></div>`).join("");
  setSendingStage(0);
  let current = 0;
  state.progressTimer = setInterval(() => {
    if (current < 3) {
      markStageComplete(current);
      current += 1;
      setSendingStage(current);
    }
  }, 1300);
}

function setSendingStage(index) {
  $$(".sending-stage").forEach((stage, i) => {
    stage.classList.toggle("active", i === index);
    if (i === index) stage.querySelector(".stage-indicator").textContent = "◌";
  });
}

function markStageComplete(index) {
  const stage = document.querySelector(`.sending-stage[data-stage="${index}"]`);
  if (!stage) return;
  stage.classList.remove("active");
  stage.classList.add("complete");
  stage.querySelector(".stage-indicator").textContent = "✓";
}

function finishSendingExperience() {
  clearInterval(state.progressTimer);
  $$(".sending-stage").forEach((stage, index) => {
    setTimeout(() => markStageComplete(index), index * 100);
  });
}

function stopSendingExperience() {
  clearInterval(state.progressTimer);
  state.progressTimer = null;
}

function setSubmitting(value) {
  $("#submitButton").disabled = value;
  $("#submitText").hidden = value;
  $("#submitSpinner").hidden = !value;
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
  select.innerHTML = '<option value="">Selecione o prefixo</option>';
  for (let number = 2001; number <= 2021; number += 1) {
    const option = document.createElement("option");
    option.value = `50-${number}`;
    option.textContent = `50-${number}`;
    select.appendChild(option);
  }
  const other = document.createElement("option");
  other.value = "__OUTRO__";
  other.textContent = "Outro prefixo";
  select.appendChild(other);
  field.insertBefore(select, originalInput);
  field.querySelector(".field-hint").textContent = "Selecione uma VTR da frota fixa ou escolha “Outro prefixo” para viatura reserva.";
}

function syncPrefixSelector() {
  const select = $("#prefixo");
  const otherInput = $("#prefixoOutro");
  const isOther = select.value === "__OUTRO__";
  otherInput.hidden = !isOther;
  otherInput.required = isOther;
  if (!isOther) otherInput.value = "";
  else setTimeout(() => otherInput.focus(), 60);
  select.closest(".field")?.classList.remove("invalid");
}

function getPrefixValue() {
  const selected = $("#prefixo")?.value || "";
  return selected === "__OUTRO__" ? ($("#prefixoOutro")?.value || "").trim().toUpperCase() : selected.trim().toUpperCase();
}

function validatePrefix(prefix) {
  const value = String(prefix || "").trim().toUpperCase();
  const fixedFleet = /^50-(200[1-9]|201[0-9]|202[0-1])$/;
  const otherVehicle = /^(?!-)(?!.*--)[A-Z0-9-]{1,12}(?<!-)$/;
  return fixedFleet.test(value) || otherVehicle.test(value);
}

async function loadRemoteConfig() {
  if (!API_URL || API_URL.includes("COLE_AQUI")) return;
  try {
    const response = await fetch(`${API_URL}?action=bootstrap`, { redirect: "follow" });
    const data = await response.json();
    if (data.config?.["Nome da OPM"]) $(".institution").textContent = data.config["Nome da OPM"];
  } catch (error) {
    console.warn("Configuração remota indisponível; usando dados locais.", error);
  }
}

function resetForm() {
  $("#checklistForm").reset();
  state.itemStatus = {};
  state.itemDescriptions = {};
  state.photos = { frontal: null, traseira: null, lado_esquerdo: null, lado_direito: null, odometro: null };
  setCurrentDate();
  syncPrefixSelector();
  renderInspectionItems();
  Object.keys(state.photos).forEach(renderPhoto);
  $("#photoError").hidden = true;
  $("#successModal").hidden = true;
  $("#sendingModal").hidden = true;
  showStep(1);
}

function setCurrentDate() {
  const now = new Date();
  $("#data").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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
  state.device = { tipo: type, sistema: system, navegador: browser, idioma: navigator.language || "", resolucao: `${screen.width}x${screen.height}`, userAgent: ua };
  $("#deviceSummary").textContent = `${type} · ${system} · ${browser} · ${state.device.resolucao}`;
}

function initializeTheme() {
  const saved = localStorage.getItem("sigvtr-theme");
  const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(saved || preferred);
}
function toggleTheme() { applyTheme((document.documentElement.dataset.theme || "light") === "dark" ? "light" : "dark"); }
function applyTheme(theme) { document.documentElement.dataset.theme = theme; localStorage.setItem("sigvtr-theme", theme); $("#themeIcon").textContent = theme === "dark" ? "☀️" : "🌙"; }

async function installApp() {
  if (!state.deferredInstallPrompt) { showToast("Use o menu do navegador para adicionar o SIGVTR à tela inicial."); return; }
  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice;
  state.deferredInstallPrompt = null;
  $("#installButton").hidden = true;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service Worker não registrado:", error)));
}

async function clearAppCacheAndRefresh() {
  const button = $("#closeAndRefreshButton");
  if (button) { button.disabled = true; button.textContent = "ATUALIZANDO..."; }
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.filter(name => name.startsWith("sigvtr-")).map(name => caches.delete(name)));
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
    sessionStorage.clear();
    const theme = localStorage.getItem("sigvtr-theme");
    Object.keys(localStorage).filter(key => key.startsWith("sigvtr-")).forEach(key => localStorage.removeItem(key));
    if (theme) localStorage.setItem("sigvtr-theme", theme);
    const url = new URL(window.location.href);
    url.search = ""; url.hash = ""; url.searchParams.set("atualizacao", Date.now().toString());
    window.location.replace(url.toString());
  } catch (error) { console.error(error); window.location.reload(); }
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
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function normalizeKey(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toLowerCase();
}
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function showToast(message, type = "") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.className = "toast"; }, 4300);
}
