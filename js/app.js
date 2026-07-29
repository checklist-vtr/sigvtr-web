const API_URL =
  "https://script.google.com/macros/s/AKfycbzuEEeAptN9MenKWY1oynX6c3gmGY7HgVXyGiGWGaoXeNOrmNNMUBCtXnutHVxJ13rv/exec";

const APP_VERSION = "1.8.2";
const FIXED_PREFIX_PATTERN = /^50-(200[1-9]|201[0-9]|202[0-1])$/;
const EXTERNAL_PREFIX_PATTERN = /^\d{1,20}$/;
const PERSON_NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ ]{2,120}$/;
const RG_PATTERN = /^\d{1,20}$/;
const KM_PATTERN = /^\d{1,9}$/;
const TEAM_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 ]{1,300}$/;
const DESCRIPTION_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;()\/-]{3,300}$/;

const STEPS = [
  { id: 1, title: "Identificação" },
  { id: 2, title: "Pneus e Rodas", category: "Pneus e Rodas" },
  { id: 3, title: "Iluminação e Faróis", category: "Iluminação e Faróis" },
  { id: 4, title: "Sinalização e Comunicação", category: "Sinalização e Comunicação" },
  { id: 5, title: "Lataria Externa", category: "Lataria Externa" },
  { id: 6, title: "Vidros e Retrovisores", category: "Vidros, Limpadores e Retrovisores" },
  { id: 7, title: "Cabine", category: "Cabine" },
  { id: 8, title: "Xadrez", category: "Compartimento de Detidos (Xadrez)" },
  { id: 9, title: "Equipamentos", category: "Equipamentos Obrigatórios" },
  { id: 10, title: "Mecânica e Segurança", category: "Mecânica e Segurança" },
  { id: 11, title: "Fotos e confirmação" },
  { id: 12, title: "Resumo e envio" }
];

const CHECKLIST_CATEGORIES = [
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
    description: "Verifique os sistemas de iluminação dianteira e traseira.",
    items: [
      "Farol dianteiro esquerdo", "Farol dianteiro direito", "Lanterna dianteira esquerda",
      "Lanterna dianteira direita", "Lanterna traseira esquerda", "Lanterna traseira direita",
      "Luz de freio", "Luz de ré", "Luz da placa"
    ]
  },
  {
    step: 4,
    title: "Sinalização e Comunicação",
    description: "Confira os equipamentos de emergência e comunicação.",
    items: ["Giroflex dianteiro", "Giroflex traseiro", "Sirene", "Alto-falante (megafone)", "Rádio comunicador"]
  },
  {
    step: 5,
    title: "Lataria Externa",
    description: "Inspecione cada área externa da viatura.",
    items: [
      "Para-choque dianteiro", "Para-choque traseiro", "Capô", "Grade dianteira",
      "Para-lama dianteiro esquerdo", "Para-lama dianteiro direito",
      "Porta dianteira lado motorista", "Porta dianteira lado passageiro",
      "Porta traseira lado motorista", "Porta traseira lado passageiro",
      "Lateral traseira esquerda", "Lateral traseira direita", "Teto"
    ]
  },
  {
    step: 6,
    title: "Vidros, Limpadores e Retrovisores",
    description: "Confira vidros, espelhos e limpadores sem duplicidade.",
    items: [
      "Para-brisa", "Vidro dianteiro esquerdo", "Vidro dianteiro direito",
      "Vidro traseiro esquerdo", "Vidro traseiro direito", "Retrovisor esquerdo",
      "Retrovisor direito", "Limpador do para-brisa dianteiro", "Limpador do vidro traseiro"
    ]
  },
  {
    step: 7,
    title: "Cabine",
    description: "Verifique bancos, cintos, painéis e acabamento interno.",
    items: [
      "Banco do motorista", "Banco dianteiro do passageiro", "Banco traseiro esquerdo",
      "Banco traseiro direito", "Cinto do motorista", "Cinto do passageiro",
      "Cintos traseiros", "Painel de instrumentos", "Painel central e comandos",
      "Acabamentos internos", "Tapetes", "Ar-condicionado e ventilação"
    ]
  },
  {
    step: 8,
    title: "Compartimento de Detidos (Xadrez)",
    description: "Inspecione a estrutura e os componentes do compartimento de condução.",
    items: [
      "Lataria externa do xadrez", "Lataria interna do xadrez", "Estrutura interna do xadrez",
      "Porta do xadrez", "Tranca do xadrez", "Piso do xadrez", "Banco interno do xadrez",
      "Ventilação e aberturas do xadrez", "Iluminação interna do xadrez"
    ]
  },
  {
    step: 9,
    title: "Equipamentos Obrigatórios",
    description: "Confira a presença e condição dos equipamentos da viatura.",
    items: [
      "Triângulo de sinalização", "Macaco", "Chave de roda", "Extintor de incêndio",
      "Cone de sinalização", "Corda ou cabo de reboque", "Tablet ou módulo de dados",
      "GPS ou rastreador", "Câmera veicular"
    ]
  },
  {
    step: 10,
    title: "Mecânica e Segurança",
    description: "Faça a conferência funcional dos principais sistemas mecânicos.",
    items: [
      "Freio de serviço", "Freio de estacionamento", "Direção", "Suspensão dianteira",
      "Suspensão traseira", "Motor", "Nível de óleo do motor", "Vazamentos",
      "Bateria", "Correias e mangueiras", "Nível de combustível", "Tampa do tanque"
    ]
  }
];

const state = {
  currentStep: 1,
  items: [],
  itemStatus: {},
  itemDescriptions: {},
  photos: { frontal: null, traseira: null, lado_esquerdo: null, lado_direito: null, odometro: null },
  device: {},
  deferredInstallPrompt: null,
  pendingDamages: [],
  pendingDamageDecisions: {},
  pendingDamagesLoading: false
};

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

window.addEventListener("DOMContentLoaded", () => {
  buildInspectionPages();
  buildStepDots();
  setCurrentDate();
  detectDevice();
  initializeTheme();
  initializePrefixSelector();
  bindEvents();
  registerServiceWorker();
  updateStepUI();
});

function buildInspectionPages() {
  const host = $("#inspectionPages");
  state.items = [];

  CHECKLIST_CATEGORIES.forEach(category => {
    const section = document.createElement("section");
    section.className = "form-page";
    section.dataset.page = category.step;
    section.hidden = true;

    const items = category.items.map((name, index) => {
      const item = {
        id: `${category.step}-${index + 1}`,
        nome: name,
        key: normalizeKey(name),
        categoria: category.title,
        ordem: index + 1,
        step: category.step
      };
      state.items.push(item);
      return item;
    });

    section.innerHTML = `
      <div class="page-heading">
        <span class="page-number">${category.step}</span>
        <div><h2>${escapeHtml(category.title)}</h2><p>${escapeHtml(category.description)}</p></div>
      </div>
      <div class="status-legend"><span><i class="ok-dot"></i> Sem alteração</span><span><i class="change-dot"></i> Com alteração</span></div>
      <div class="inspection-list">${items.map(renderInspectionCardHtml).join("")}</div>
      <p class="form-error inspection-error" hidden>Avalie todos os itens desta categoria antes de continuar.</p>
      <div class="page-actions">
        <button class="secondary-button prev-button" type="button" data-prev="${category.step - 1}"><span aria-hidden="true">←</span> VOLTAR</button>
        <button class="primary-button next-button" type="button" data-next="${category.step + 1}">PRÓXIMA ETAPA <span aria-hidden="true">→</span></button>
      </div>`;

    host.appendChild(section);
  });
}

function renderInspectionCardHtml(item) {
  return `<article class="inspection-card" data-item-key="${item.key}">
    <div class="inspection-top">
      <div class="inspection-title"><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml(item.categoria)}</small></div>
      <div class="status-buttons">
        <button class="status-choice ok" type="button" data-status="ok" data-item="${item.key}">SEM ALTERAÇÃO</button>
        <button class="status-choice change" type="button" data-status="nao" data-item="${item.key}">COM ALTERAÇÃO</button>
      </div>
    </div>
    <div class="change-description" id="description_${item.key}" hidden>
      <textarea maxlength="300" inputmode="text" autocomplete="off" placeholder="Descreva a alteração encontrada em ${escapeHtml(item.nome)}"></textarea>
    </div>
  </article>`;
}

function buildStepDots() {
  $("#stepDots").innerHTML = STEPS.map(step =>
    `<button class="step-dot${step.id === 1 ? " active" : ""}" type="button" data-step="${step.id}" aria-label="Ir para a etapa ${step.id}: ${escapeHtml(step.title)}">${step.id}</button>`
  ).join("");
}

function bindEvents() {
  $("#checklistForm").addEventListener("click", event => {
    const next = event.target.closest(".next-button");
    const prev = event.target.closest(".prev-button");
    const choice = event.target.closest(".status-choice");
    const capture = event.target.closest("[data-capture]");
    const remove = event.target.closest(".remove-photo");
    const damageDecision = event.target.closest("[data-damage-decision]");

    if (next) goToNextStep(Number(next.dataset.next));
    if (prev) showStep(Number(prev.dataset.prev));
    if (choice) setItemStatus(choice.dataset.item, choice.dataset.status, choice.closest(".inspection-card"));
    if (capture) $(`#photo_${capture.dataset.capture}`).click();
    if (damageDecision) setPendingDamageDecision(damageDecision.dataset.damageId, damageDecision.dataset.damageDecision);
    if (remove) {
      const type = remove.dataset.removePhoto;
      state.photos[type] = null;
      renderPhoto(type);
    }
  });

  $("#checklistForm").addEventListener("input", event => {
    const textarea = event.target.closest(".change-description textarea");
    if (!textarea) return;
    const key = textarea.closest(".inspection-card").dataset.itemKey;
    const sanitized = sanitizeDescription(textarea.value);
    if (textarea.value !== sanitized) textarea.value = sanitized;
    state.itemDescriptions[key] = sanitized.trim();
  });

  $("#stepDots").addEventListener("click", event => {
    const dot = event.target.closest(".step-dot");
    if (!dot) return;
    const target = Number(dot.dataset.step);
    if (target < state.currentStep) showStep(target);
  });

  Object.keys(state.photos).forEach(type => {
    $(`#photo_${type}`).addEventListener("change", event => handlePhoto(type, event));
  });

  $("#checklistForm").addEventListener("submit", submitChecklist);
  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#newChecklistButton").addEventListener("click", resetForm);
  $("#closeAndRefreshButton")?.addEventListener("click", clearAppCacheAndRefresh);
  $("#installButton").addEventListener("click", installApp);
  $("#prefixo").addEventListener("change", async () => { syncPrefixSelector(); await loadPendingDamages(); });
  $("#prefixoOutro").addEventListener("input", event => {
    event.target.value = keepDigits(event.target.value, 20);
    event.target.closest(".field")?.classList.remove("invalid");
    clearTimeout(loadPendingDamages.timer);
    loadPendingDamages.timer = setTimeout(loadPendingDamages, 450);
  });

  bindSecureFieldFilters();

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
  originalInput.maxLength = 20;
  originalInput.inputMode = "numeric";
  originalInput.pattern = "[0-9]+";
  originalInput.autocomplete = "off";
  originalInput.placeholder = "Digite apenas números. Ex.: 041 ou 110";

  const select = document.createElement("select");
  select.id = "prefixo";
  select.name = "prefixo";
  select.required = true;
  select.innerHTML = '<option value="">Selecione o prefixo</option>';
  for (let number = 2001; number <= 2021; number++) {
    select.insertAdjacentHTML("beforeend", `<option value="50-${number}">50-${number}</option>`);
  }
  select.insertAdjacentHTML("beforeend", '<option value="__OUTRO__">Outro prefixo</option>');
  field.insertBefore(select, originalInput);
  field.querySelector(".field-hint").textContent = "Frota fixa: 50-2001 a 50-2021. Em “Outro prefixo”, informe apenas números da viatura externa.";
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
  return $("#prefixo").value === "__OUTRO__"
    ? keepDigits($("#prefixoOutro").value, 20)
    : $("#prefixo").value.trim().toUpperCase();
}

function bindSecureFieldFilters() {
  const condutor = $("#condutor");
  const rg = $("#rg");
  const km = $("#km");
  const equipe = $("#equipe");

  condutor.addEventListener("input", event => {
    event.target.value = normalizeSpaces(event.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, "")).slice(0, 120);
    clearFieldError(event.target);
  });

  rg.addEventListener("input", event => {
    event.target.value = keepDigits(event.target.value, 20);
    clearFieldError(event.target);
  });

  km.addEventListener("input", event => {
    event.target.value = keepDigits(event.target.value, 9);
    clearFieldError(event.target);
  });

  equipe.addEventListener("input", event => {
    event.target.value = normalizeSpaces(event.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 ]/g, "")).slice(0, 300);
    clearFieldError(event.target);
  });
}

function clearFieldError(field) {
  field.closest(".field")?.classList.remove("invalid");
}

function keepDigits(value, maxLength) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

function normalizeSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").replace(/^ +/, "");
}

function sanitizeDescription(value) {
  return normalizeSpaces(String(value || "").replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;()\/-]/g, "")).slice(0, 300);
}

function setItemStatus(itemKey, status, card) {
  state.itemStatus[itemKey] = status;
  card.querySelectorAll(".status-choice").forEach(button => button.classList.toggle("selected", button.dataset.status === status));
  const box = card.querySelector(".change-description");
  const textarea = box.querySelector("textarea");
  if (status === "nao") {
    box.hidden = false;
    textarea.required = true;
    setTimeout(() => textarea.focus(), 60);
  } else {
    box.hidden = true;
    textarea.required = false;
    textarea.value = "";
    delete state.itemDescriptions[itemKey];
  }
  card.closest(".form-page").querySelector(".inspection-error").hidden = true;
}

function goToNextStep(targetStep) {
  if (!validateStep(state.currentStep)) return;
  if (targetStep === 12) renderSummary();
  showStep(targetStep);
}

function showStep(step) {
  state.currentStep = step;
  $$(".form-page").forEach(page => {
    const active = Number(page.dataset.page) === step;
    page.hidden = !active;
    page.classList.toggle("active", active);
  });
  if (step === 12) renderSummary();
  updateStepUI();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateStepUI() {
  const current = STEPS.find(step => step.id === state.currentStep);
  $("#stepTitle").textContent = current.title;
  $("#stepCounter").textContent = `Etapa ${state.currentStep} de ${STEPS.length}`;
  $("#progressBar").style.width = `${(state.currentStep / STEPS.length) * 100}%`;
  $$(".step-dot").forEach(dot => {
    const step = Number(dot.dataset.step);
    dot.classList.toggle("active", step === state.currentStep);
    dot.classList.toggle("completed", step < state.currentStep);
  });
}

function validateStep(step) {
  if (step === 1) return validateIdentification();
  if (step >= 2 && step <= 10) return validateInspectionStep(step);
  if (step === 11) return validateFinalStep();
  return true;
}

function validatePrefix(prefix) {
  const value = String(prefix || "").trim().toUpperCase();
  return FIXED_PREFIX_PATTERN.test(value) || EXTERNAL_PREFIX_PATTERN.test(value);
}

function validateIdentification() {
  const validations = [
    { field: $("#prefixo"), valid: Boolean($("#prefixo").value) && validatePrefix(getPrefixValue()), message: "Selecione uma viatura válida ou informe somente números em Outro prefixo." },
    { field: $("#data"), valid: $("#data").checkValidity() && Boolean($("#data").value), message: "Informe a data." },
    { field: $("#condutor"), valid: PERSON_NAME_PATTERN.test($("#condutor").value.trim()), message: "O nome do condutor deve conter somente letras e espaços." },
    { field: $("#postoGraduacao"), valid: Boolean($("#postoGraduacao").value), message: "Selecione o posto ou graduação." },
    { field: $("#rg"), valid: RG_PATTERN.test($("#rg").value.trim()), message: "O RG deve conter somente números." },
    { field: $("#turno"), valid: Boolean($("#turno").value), message: "Selecione o turno." },
    { field: $("#km"), valid: KM_PATTERN.test(String($("#km").value).trim()), message: "A quilometragem deve conter somente números inteiros." },
    { field: $("#equipe"), valid: TEAM_PATTERN.test($("#equipe").value.trim()), message: "A equipe deve conter somente letras, números e espaços." }
  ];

  let firstInvalid = null;
  let firstMessage = "";

  validations.forEach(item => {
    item.field.closest(".field")?.classList.toggle("invalid", !item.valid);
    if (!item.valid && !firstInvalid) {
      firstInvalid = item.field;
      firstMessage = item.message;
    }
  });

  if (!firstInvalid && state.pendingDamages.length) {
    const undecided = state.pendingDamages.find(damage => !state.pendingDamageDecisions[damage.idAvaria]);
    if (undecided) {
      firstInvalid = $("#pendingDamagesPanel");
      firstMessage = "Confirme a situação de todas as avarias já registradas.";
    }
  }

  if (firstInvalid) {
    showToast(firstMessage, "error");
    firstInvalid.focus?.();
    firstInvalid.scrollIntoView?.({ behavior: "smooth", block: "center" });
    return false;
  }

  return true;
}
function validateInspectionStep(step) {
  const items = state.items.filter(item => item.step === step);
  let valid = true;
  let firstProblem = null;
  for (const item of items) {
    const status = state.itemStatus[item.key];
    const card = $(`[data-item-key="${item.key}"]`);
    card.classList.remove("invalid-card");
    const description = String(state.itemDescriptions[item.key] || "").trim();
    if (!status || (status === "nao" && !DESCRIPTION_PATTERN.test(description))) {
      valid = false;
      card.classList.add("invalid-card");
      firstProblem ||= card;
    }
  }
  const error = $(`.form-page[data-page="${step}"] .inspection-error`);
  error.hidden = valid;
  if (!valid) {
    showToast("Avalie todos os itens. Em caso de alteração, use uma descrição de 3 a 300 caracteres sem símbolos especiais.", "error");
    firstProblem?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return valid;
}

function validateFinalStep() {
  const photosComplete = Object.values(state.photos).every(Boolean);
  $("#photoError").hidden = photosComplete;
  if (!photosComplete) { showToast("Adicione as cinco fotografias obrigatórias.", "error"); return false; }
  if (!$("#confirmacao").checked) { showToast("Confirme a revisão das informações.", "error"); $("#confirmacao").focus(); return false; }
  return true;
}

function renderSummary() {
  const changes = state.items.filter(item => state.itemStatus[item.key] === "nao");
  const summary = $("#checklistSummary");
  summary.innerHTML = `
    <dl class="summary-grid">
      <div><dt>Viatura</dt><dd>${escapeHtml(getPrefixValue())}</dd></div>
      <div><dt>KM</dt><dd>${escapeHtml($("#km").value)}</dd></div>
      <div><dt>Condutor</dt><dd>${escapeHtml($("#postoGraduacao").value)} ${escapeHtml($("#condutor").value.trim())}</dd></div>
      <div><dt>RG</dt><dd>${escapeHtml($("#rg").value.trim())}</dd></div>
      <div><dt>Turno</dt><dd>${escapeHtml($("#turno").value)}</dd></div>
      <div><dt>Fotos</dt><dd>${Object.values(state.photos).filter(Boolean).length}/5</dd></div>
      <div><dt>Itens avaliados</dt><dd>${Object.keys(state.itemStatus).length}/${state.items.length}</dd></div>
      <div><dt>Com alteração</dt><dd class="${changes.length ? "summary-danger" : "summary-success"}">${changes.length}</dd></div>
    </dl>
    <div class="summary-changes">
      <h3>Alterações registradas</h3>
      ${changes.length ? `<ul>${changes.map(item => `<li><strong>${escapeHtml(item.nome)}</strong><span>${escapeHtml(state.itemDescriptions[item.key] || "")}</span></li>`).join("")}</ul>` : '<p class="empty-summary">Nenhuma alteração informada.</p>'}
    </div>`;
}

async function handlePhoto(type, event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { showToast("Selecione uma imagem válida.", "error"); event.target.value = ""; return; }
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
  const preview = $(`#preview_${type}`);
  const slot = preview.closest(".photo-slot");
  const photo = state.photos[type];
  if (!photo) { preview.innerHTML = ""; slot.classList.remove("has-photo"); return; }
  preview.innerHTML = `<img src="${photo.preview}" alt="Fotografia ${type.replaceAll("_", " ")}"><button class="remove-photo" data-remove-photo="${type}" type="button" aria-label="Remover fotografia">×</button>`;
  slot.classList.add("has-photo");
  $("#photoError").hidden = true;
}


async function loadPendingDamages() {
  const prefix = getPrefixValue();
  state.pendingDamages = [];
  state.pendingDamageDecisions = {};
  renderPendingDamages();
  if (!prefix || !validatePrefix(prefix) || state.pendingDamagesLoading) return;

  state.pendingDamagesLoading = true;
  renderPendingDamages(true);
  try {
    const url = new URL(API_URL);
    url.searchParams.set("action", "avariasPendentes");
    url.searchParams.set("prefixo", prefix);
    const response = await fetch(url.toString(), { method: "GET", redirect: "follow" });
    const result = JSON.parse(await response.text());
    if (!result.success) throw new Error(result.message || "Falha ao consultar avarias.");
    state.pendingDamages = Array.isArray(result.avarias) ? result.avarias : [];
    renderPendingDamages();
    highlightKnownDamageCards();
  } catch (error) {
    console.error(error);
    renderPendingDamages(false, "Não foi possível consultar as avarias pendentes. Você pode tentar novamente selecionando a viatura.");
  } finally {
    state.pendingDamagesLoading = false;
  }
}

function renderPendingDamages(loading = false, errorMessage = "") {
  const panel = $("#pendingDamagesPanel");
  const list = $("#pendingDamagesList");
  if (!panel || !list) return;
  panel.hidden = false;
  panel.classList.toggle("has-damages", state.pendingDamages.length > 0);

  if (loading) {
    list.innerHTML = '<div class="damage-loading"><span class="spinner"></span> Consultando avarias pendentes...</div>';
    return;
  }
  if (errorMessage) {
    list.innerHTML = `<div class="damage-query-error">${escapeHtml(errorMessage)}</div>`;
    return;
  }
  if (!getPrefixValue()) {
    list.innerHTML = '<p class="damage-empty">Selecione a viatura para consultar avarias já registradas.</p>';
    return;
  }
  if (!state.pendingDamages.length) {
    list.innerHTML = '<p class="damage-empty success">Nenhuma avaria pendente encontrada para esta viatura.</p>';
    return;
  }

  list.innerHTML = state.pendingDamages.map(damage => `
    <article class="known-damage-card" data-known-damage="${escapeHtml(damage.idAvaria)}">
      <div class="known-damage-heading"><strong>${escapeHtml(damage.item || "Avaria registrada")}</strong><span>${escapeHtml(damage.situacao || "PENDENTE")}</span></div>
      <p>${escapeHtml(damage.descricao || "Sem descrição.")}</p>
      <small>Registrada em ${escapeHtml(damage.dataDeteccao || "data não informada")}</small>
      <div class="damage-decisions" role="group" aria-label="Situação da avaria ${escapeHtml(damage.item || "")}">
        <button type="button" data-damage-id="${escapeHtml(damage.idAvaria)}" data-damage-decision="continua">CONTINUA IGUAL</button>
        <button type="button" data-damage-id="${escapeHtml(damage.idAvaria)}" data-damage-decision="agravou">AGRAVOU</button>
        <button type="button" data-damage-id="${escapeHtml(damage.idAvaria)}" data-damage-decision="solicitar_verificacao">SOLICITAR VERIFICAÇÃO</button>
      </div>
    </article>`).join("");
}

function setPendingDamageDecision(idAvaria, decision) {
  state.pendingDamageDecisions[idAvaria] = decision;
  const card = $(`[data-known-damage="${CSS.escape(idAvaria)}"]`);
  card?.querySelectorAll("[data-damage-decision]").forEach(button => {
    button.classList.toggle("selected", button.dataset.damageDecision === decision);
  });
}

function highlightKnownDamageCards() {
  $$(".inspection-card").forEach(card => card.classList.remove("known-damage-item"));
  state.pendingDamages.forEach(damage => {
    const key = normalizeKey(damage.item);
    const card = $(`[data-item-key="${CSS.escape(key)}"]`);
    if (card) {
      card.classList.add("known-damage-item");
      if (!card.querySelector(".known-damage-badge")) {
        card.querySelector(".inspection-title")?.insertAdjacentHTML("beforeend", '<span class="known-damage-badge">AVARIA JÁ REGISTRADA</span>');
      }
    }
  });
}

async function submitChecklist(event) {
  event.preventDefault();
  if (!validateFinalStep()) { showStep(11); return; }
  if (!API_URL || API_URL.includes("COLE_AQUI")) { showToast("Configure a URL do Apps Script no arquivo app.js.", "error"); return; }

  const payload = {
    action: "salvarRetiradaMobile",
    data: {
      prefixo: getPrefixValue(), dataCliente: $("#data").value, condutor: normalizeSpaces($("#condutor").value).trim(),
      postoGraduacao: $("#postoGraduacao").value, rg: keepDigits($("#rg").value, 20), turno: $("#turno").value,
      kmInicial: Number(keepDigits($("#km").value, 9)), equipe: normalizeSpaces($("#equipe").value).trim(), itens: state.itemStatus,
      descricoesAlteracoes: state.itemDescriptions,
      avariasConhecidas: state.pendingDamages.map(damage => ({
        idAvaria: damage.idAvaria,
        item: damage.item,
        itemKey: normalizeKey(damage.item),
        decisao: state.pendingDamageDecisions[damage.idAvaria] || ""
      })),
      fotos: Object.values(state.photos).map(({ tipo, name, mimeType, data }) => ({ tipo, name, mimeType, data })),
      dispositivo: state.device
    }
  };

  setSubmitting(true);
  openSendingModal();
  markSendingStep("validate", "done");
  await wait(180);
  markSendingStep("prepare", "done");
  markSendingStep("send", "active");

  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), redirect: "follow" });
    markSendingStep("send", "done");
    markSendingStep("server", "active");
    const raw = await response.text();
    const result = JSON.parse(raw);
    if (!result.success) throw new Error(result.message || "Não foi possível registrar o checklist.");
    markSendingStep("server", "done");
    markSendingStep("protocol", "done");
    markSendingStep("finish", "done");
    await wait(350);
    $("#sendingModal").hidden = true;
    $("#successMessage").textContent = `Protocolo ${result.protocolo || result.id || ""} · Status: ${result.status || "REGISTRADO"}`;
    $("#successModal").hidden = false;
  } catch (error) {
    console.error(error);
    $("#sendingModal").hidden = true;
    showToast(error.message || "Falha no envio. Verifique sua conexão.", "error");
  } finally {
    setSubmitting(false);
  }
}

function openSendingModal() {
  $$("[data-send-step]").forEach(row => row.className = "");
  markSendingStep("validate", "active");
  $("#sendingModal").hidden = false;
}
function markSendingStep(name, status) { const row = $(`[data-send-step="${name}"]`); if (row) row.className = status; }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function setSubmitting(value) { $("#submitButton").disabled = value; $("#submitText").hidden = value; $("#submitSpinner").hidden = !value; }

async function clearAppCacheAndRefresh() {
  const button = $("#closeAndRefreshButton");
  if (button) { button.disabled = true; button.textContent = "ATUALIZANDO..."; }
  try {
    if ("caches" in window) { const names = await caches.keys(); await Promise.all(names.filter(name => name.startsWith("sigvtr-")).map(name => caches.delete(name))); }
    if ("serviceWorker" in navigator) { const registrations = await navigator.serviceWorker.getRegistrations(); await Promise.all(registrations.map(registration => registration.unregister())); }
    sessionStorage.clear();
    const theme = localStorage.getItem("sigvtr-theme");
    Object.keys(localStorage).filter(key => key.startsWith("sigvtr-")).forEach(key => localStorage.removeItem(key));
    if (theme) localStorage.setItem("sigvtr-theme", theme);
    const url = new URL(window.location.href); url.search = ""; url.hash = ""; url.searchParams.set("atualizacao", Date.now().toString());
    window.location.replace(url.toString());
  } catch (error) { console.error(error); window.location.reload(); }
}

function resetForm() {
  $("#checklistForm").reset();
  state.itemStatus = {};
  state.itemDescriptions = {};
  state.photos = { frontal: null, traseira: null, lado_esquerdo: null, lado_direito: null, odometro: null };
  state.pendingDamages = [];
  state.pendingDamageDecisions = {};
  renderPendingDamages();
  setCurrentDate();
  syncPrefixSelector();
  $$(".status-choice").forEach(button => button.classList.remove("selected"));
  $$(".change-description").forEach(box => { box.hidden = true; box.querySelector("textarea").value = ""; });
  $$(".inspection-card").forEach(card => card.classList.remove("invalid-card"));
  Object.keys(state.photos).forEach(renderPhoto);
  $$(".form-error").forEach(error => error.hidden = true);
  $("#successModal").hidden = true;
  showStep(1);
}

function setCurrentDate() { const now = new Date(); $("#data").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; }
function detectDevice() {
  const ua = navigator.userAgent;
  let type = /tablet|ipad/i.test(ua) ? "Tablet" : /mobile|android|iphone/i.test(ua) ? "Celular" : "Computador";
  let system = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iPod/i.test(ua) ? "iOS/iPadOS" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Desconhecido";
  let browser = /Edg\//.test(ua) ? "Microsoft Edge" : /Chrome\//.test(ua) ? "Google Chrome" : /Firefox\//.test(ua) ? "Mozilla Firefox" : /Safari\//.test(ua) ? "Safari" : "Outro";
  state.device = { tipo: type, sistema: system, navegador: browser, idioma: navigator.language || "", resolucao: `${screen.width}x${screen.height}`, userAgent: ua };
  $("#deviceSummary").textContent = `${type} · ${system} · ${browser} · ${state.device.resolucao}`;
}
function initializeTheme() { const saved = localStorage.getItem("sigvtr-theme"); const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; applyTheme(saved || preferred); }
function toggleTheme() { applyTheme((document.documentElement.dataset.theme || "light") === "dark" ? "light" : "dark"); }
function applyTheme(theme) { document.documentElement.dataset.theme = theme; localStorage.setItem("sigvtr-theme", theme); $("#themeIcon").textContent = theme === "dark" ? "☀️" : "🌙"; }
async function installApp() { if (!state.deferredInstallPrompt) { showToast("Use o menu do navegador para adicionar o SIGVTR à tela inicial."); return; } state.deferredInstallPrompt.prompt(); await state.deferredInstallPrompt.userChoice; state.deferredInstallPrompt = null; $("#installButton").hidden = true; }
function registerServiceWorker() { if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service Worker não registrado:", error))); }
function compressImage(file, maxDimension, quality) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = reject; reader.onload = () => { const image = new Image(); image.onerror = reject; image.onload = () => { const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height)); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * ratio)); canvas.height = Math.max(1, Math.round(image.height * ratio)); canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL("image/jpeg", quality)); }; image.src = reader.result; }; reader.readAsDataURL(file); }); }
function normalizeKey(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toLowerCase(); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function showToast(message, type = "") { const toast = $("#toast"); toast.textContent = message; toast.className = `toast show ${type}`; clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.className = "toast", 4300); }
