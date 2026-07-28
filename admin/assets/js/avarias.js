const AvariasPage = (() => {
  const STORAGE_KEY = "sigvtr_admin_avarias_v2";

  const categoryLabels = {
    LATARIA: "Lataria",
    SINALIZACAO: "Sinalização",
    EQUIPAMENTOS: "Equipamentos",
    ESTRUTURA: "Estrutura",
    FREIOS: "Freios",
    PNEUS: "Pneus",
    VIDROS: "Vidros",
    ELETRICA: "Elétrica",
    MECANICA: "Mecânica",
    INTERIOR: "Interior",
    OUTROS: "Outros"
  };

  const statusLabels = {
    REGISTRADA: "Registrada",
    EM_ANALISE: "Em análise",
    EM_ACOMPANHAMENTO: "Em acompanhamento",
    ENCAMINHADA: "Encaminhada",
    RESOLVIDA: "Resolvida"
  };

  const statusClassMap = {
    REGISTRADA: "status-registrada",
    EM_ANALISE: "status-em-analise",
    EM_ACOMPANHAMENTO: "status-em-acompanhamento",
    ENCAMINHADA: "status-encaminhada",
    RESOLVIDA: "status-resolvida"
  };

  const seed = [
    {
      id: "AVR-2026-0041",
      vehicle: "VTR-2012",
      category: "LATARIA",
      component: "Porta do motorista",
      description: "Arranhão na porta do motorista",
      date: "2026-07-28T10:30:00",
      displayDate: "28/07/2026",
      status: "REGISTRADA",
      originProtocol: "SIG-2026-0187",
      registeredBy: "CB Silva",
      photos: 2,
      notes: "Avaria estética. Não impede o emprego operacional.",
      history: [
        { date: "28/07/2026 10:30", text: "Avaria registrada durante checklist por CB Silva." },
        { date: "29/07/2026 07:12", text: "Avaria confirmada sem alteração por SD Oliveira." }
      ]
    },
    {
      id: "AVR-2026-0038",
      vehicle: "VTR-2007",
      category: "SINALIZACAO",
      component: "Lanterna traseira direita",
      description: "Lanterna traseira direita sem funcionamento",
      date: "2026-07-25T19:10:00",
      displayDate: "25/07/2026",
      status: "EM_ANALISE",
      originProtocol: "SIG-2026-0172",
      registeredBy: "SGT Costa",
      photos: 1,
      notes: "Encaminhada para avaliação administrativa.",
      history: [
        { date: "25/07/2026 19:10", text: "Avaria registrada por SGT Costa." },
        { date: "26/07/2026 08:20", text: "Administração iniciou análise da ocorrência." }
      ]
    },
    {
      id: "AVR-2026-0032",
      vehicle: "VTR-2018",
      category: "VIDROS",
      component: "Para-brisa",
      description: "Pequena trinca no canto inferior do para-brisa",
      date: "2026-07-20T14:22:00",
      displayDate: "20/07/2026",
      status: "EM_ACOMPANHAMENTO",
      originProtocol: "SIG-2026-0149",
      registeredBy: "SD Souza",
      photos: 3,
      notes: "Acompanhar possível aumento da trinca.",
      history: [
        { date: "20/07/2026 14:22", text: "Trinca registrada por SD Souza." },
        { date: "22/07/2026 08:04", text: "Condutor confirmou que a avaria permanece sem agravamento." }
      ]
    },
    {
      id: "AVR-2026-0024",
      vehicle: "VTR-2014",
      category: "PNEUS",
      component: "Pneu dianteiro esquerdo",
      description: "Desgaste irregular no pneu dianteiro esquerdo",
      date: "2026-07-10T09:05:00",
      displayDate: "10/07/2026",
      status: "ENCAMINHADA",
      originProtocol: "SIG-2026-0106",
      registeredBy: "CB Lima",
      photos: 2,
      notes: "Encaminhada para verificação e possível substituição.",
      history: [
        { date: "10/07/2026 09:05", text: "Desgaste registrado por CB Lima." },
        { date: "11/07/2026 13:40", text: "Administração encaminhou para manutenção programada." }
      ]
    },
    {
      id: "AVR-2026-0015",
      vehicle: "VTR-2021",
      category: "EQUIPAMENTOS",
      component: "Porta-luvas",
      description: "Trava do porta-luvas danificada",
      date: "2026-06-18T11:18:00",
      displayDate: "18/06/2026",
      status: "RESOLVIDA",
      originProtocol: "SIG-2026-0067",
      registeredBy: "CB Almeida",
      photos: 1,
      notes: "Peça substituída.",
      history: [
        { date: "18/06/2026 11:18", text: "Avaria registrada por CB Almeida." },
        { date: "22/06/2026 15:30", text: "Reparo concluído e ocorrência encerrada pela Administração." }
      ]
    }
  ];

  let records = [];
  const state = { filtered: [], selectedId: null };

  function load() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
      records = Array.isArray(stored) && stored.length ? stored : structuredClone(seed);
    } catch {
      records = structuredClone(seed);
    }
    state.filtered = [...records];
  }

  function save() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function getSelectedRecord() {
    return records.find((item) => item.id === state.selectedId) || null;
  }

  function renderKpis() {
    const open = records.filter((item) => item.status !== "RESOLVIDA").length;
    const analysis = records.filter((item) => item.status === "EM_ANALISE").length;
    const monitoring = records.filter((item) =>
      ["EM_ACOMPANHAMENTO", "ENCAMINHADA"].includes(item.status)
    ).length;
    const resolved = records.filter((item) => item.status === "RESOLVIDA").length;

    const items = [
      ["Avarias abertas", open, "bi-exclamation-triangle"],
      ["Em análise", analysis, "bi-search"],
      ["Em acompanhamento", monitoring, "bi-eye"],
      ["Resolvidas", resolved, "bi-check2-circle"]
    ];

    document.getElementById("avariaKpis").innerHTML = items.map(([label, value, icon]) => `
      <div class="col-6 col-xl-3">
        <article class="avaria-kpi h-100">
          <div class="avaria-kpi-header">
            <div>
              <div class="avaria-kpi-label">${label}</div>
              <p class="avaria-kpi-value">${value}</p>
            </div>
            <div class="avaria-kpi-icon"><i class="bi ${icon}"></i></div>
          </div>
        </article>
      </div>
    `).join("");
  }

  function populateVehicleFilter() {
    const select = document.getElementById("filterVehicle");
    const current = select.value;
    const vehicles = [...new Set(records.map((item) => item.vehicle))].sort();

    select.innerHTML = '<option value="">Todas</option>' +
      vehicles.map((vehicle) => `<option value="${vehicle}">${vehicle}</option>`).join("");

    select.value = vehicles.includes(current) ? current : "";
  }

  function renderTable() {
    const tbody = document.getElementById("avariasTableBody");
    const empty = document.getElementById("emptyState");

    document.getElementById("resultCount").textContent =
      `${state.filtered.length} registro${state.filtered.length === 1 ? "" : "s"} ` +
      `encontrado${state.filtered.length === 1 ? "" : "s"}`;

    if (!state.filtered.length) {
      tbody.innerHTML = "";
      empty.classList.remove("d-none");
      return;
    }

    empty.classList.add("d-none");

    tbody.innerHTML = state.filtered.map((item) => `
      <tr>
        <td class="fw-semibold">${item.id}</td>
        <td>${item.vehicle}</td>
        <td><span class="category-chip">${categoryLabels[item.category] || item.category}</span></td>
        <td class="avaria-description">
          <strong class="d-block">${item.component || "Componente não informado"}</strong>
          <span class="text-secondary small">${item.description}</span>
        </td>
        <td>${item.displayDate}</td>
        <td>
          <span class="status-chip ${statusClassMap[item.status]}">
            ${statusLabels[item.status]}
          </span>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary" data-action="details" data-id="${item.id}">
            Detalhes
          </button>
        </td>
      </tr>
    `).join("");
  }

  function applyFilters() {
    const search = document.getElementById("searchAvaria").value.trim().toLowerCase();
    const status = document.getElementById("filterStatus").value;
    const category = document.getElementById("filterCategory").value;
    const vehicle = document.getElementById("filterVehicle").value;
    const period = Number(document.getElementById("filterPeriod").value || 0);

    state.filtered = records.filter((item) => {
      const searchable = [
        item.id, item.vehicle, item.component, item.description,
        item.registeredBy, item.originProtocol, categoryLabels[item.category]
      ].join(" ").toLowerCase();

      let matches = !search || searchable.includes(search);
      matches = matches && (!status || item.status === status);
      matches = matches && (!category || item.category === category);
      matches = matches && (!vehicle || item.vehicle === vehicle);

      if (period > 0) {
        const elapsed = Date.now() - new Date(item.date).getTime();
        matches = matches && elapsed <= period * 86400000;
      }

      return matches;
    });

    renderTable();
  }

  function openDetails(id) {
    const record = records.find((item) => item.id === id);
    if (!record) return;

    state.selectedId = id;

    document.getElementById("avariaModalTitle").textContent =
      `${record.id} · ${record.vehicle}`;

    const resolveButton = document.getElementById("resolveAvaria");
    resolveButton.disabled = record.status === "RESOLVIDA";
    resolveButton.innerHTML = record.status === "RESOLVIDA"
      ? '<i class="bi bi-check2-circle me-2"></i>Ocorrência resolvida'
      : '<i class="bi bi-check2-circle me-2"></i>Marcar como resolvida';

    document.getElementById("avariaModalBody").innerHTML = `
      <div class="detail-grid mb-4">
        ${[
          ["Viatura", record.vehicle],
          ["Protocolo de origem", record.originProtocol],
          ["Categoria", categoryLabels[record.category]],
          ["Componente", record.component || "Não informado"],
          ["Status", statusLabels[record.status]],
          ["Registrada em", record.displayDate],
          ["Registrada por", record.registeredBy]
        ].map(([label, value]) => `
          <div class="detail-item">
            <span class="detail-label">${label}</span>
            <strong>${value}</strong>
          </div>
        `).join("")}
      </div>

      <section class="mb-4">
        <h3 class="h6">Descrição</h3>
        <p class="mb-1">${record.description}</p>
        <p class="text-secondary small mb-0">${record.notes || "Sem observação administrativa."}</p>
      </section>

      <section class="mb-4">
        <h3 class="h6">Fotos vinculadas</h3>
        <div class="photo-placeholder">
          <div class="text-center">
            <i class="bi bi-images fs-3 d-block mb-2"></i>
            ${record.photos} foto${record.photos === 1 ? "" : "s"} registrada${record.photos === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      <section>
        <h3 class="h6 mb-3">Histórico da ocorrência</h3>
        <ol class="timeline">
          ${record.history.map((event) => `
            <li class="timeline-item">
              <strong class="d-block">${event.date}</strong>
              <span class="text-secondary small">${event.text}</span>
            </li>
          `).join("")}
        </ol>
      </section>
    `;

    bootstrap.Modal.getOrCreateInstance(document.getElementById("avariaModal")).show();
  }

  function openEdit() {
    const record = getSelectedRecord();
    if (!record) return;

    document.getElementById("editAvariaId").value = record.id;
    document.getElementById("editAvariaCategory").value = record.category;
    document.getElementById("editAvariaComponent").value = record.component || "";
    document.getElementById("editAvariaDescription").value = record.description;
    document.getElementById("editAvariaStatus").value = record.status;
    document.getElementById("editAvariaNotes").value = record.notes || "";

    bootstrap.Modal.getInstance(document.getElementById("avariaModal"))?.hide();
    bootstrap.Modal.getOrCreateInstance(document.getElementById("editAvariaModal")).show();
  }

  function saveEdit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const record = records.find((item) =>
      item.id === document.getElementById("editAvariaId").value
    );
    if (!record) return;

    const previousStatus = record.status;

    record.category = document.getElementById("editAvariaCategory").value;
    record.component = document.getElementById("editAvariaComponent").value.trim();
    record.description = document.getElementById("editAvariaDescription").value.trim();
    record.status = document.getElementById("editAvariaStatus").value;
    record.notes = document.getElementById("editAvariaNotes").value.trim();

    record.history.push({
      date: new Date().toLocaleString("pt-BR"),
      text: previousStatus === record.status
        ? "Dados da ocorrência atualizados pela Administração."
        : `Status alterado de ${statusLabels[previousStatus]} para ${statusLabels[record.status]}.`
    });

    save();
    renderKpis();
    populateVehicleFilter();
    applyFilters();

    bootstrap.Modal.getInstance(document.getElementById("editAvariaModal"))?.hide();
    openDetails(record.id);
  }

  function resolveSelected() {
    const record = getSelectedRecord();
    if (!record || record.status === "RESOLVIDA") return;

    record.status = "RESOLVIDA";
    record.history.push({
      date: new Date().toLocaleString("pt-BR"),
      text: "Ocorrência marcada como resolvida pela Administração."
    });

    save();
    renderKpis();
    applyFilters();
    openDetails(record.id);
  }

  function bindEvents() {
    ["searchAvaria", "filterStatus", "filterCategory", "filterVehicle", "filterPeriod"]
      .forEach((id) => {
        const element = document.getElementById(id);
        element.addEventListener(id === "searchAvaria" ? "input" : "change", applyFilters);
      });

    document.getElementById("clearFilters").addEventListener("click", () => {
      ["searchAvaria", "filterStatus", "filterCategory", "filterVehicle", "filterPeriod"]
        .forEach((id) => document.getElementById(id).value = "");
      state.filtered = [...records];
      renderTable();
    });

    document.getElementById("avariasTableBody").addEventListener("click", (event) => {
      const button = event.target.closest('[data-action="details"]');
      if (button) openDetails(button.dataset.id);
    });

    document.getElementById("editAvaria").addEventListener("click", openEdit);
    document.getElementById("editAvariaForm").addEventListener("submit", saveEdit);
    document.getElementById("resolveAvaria").addEventListener("click", resolveSelected);

    document.getElementById("viewVehicleRecord").addEventListener("click", () => {
      const record = getSelectedRecord();
      if (record) {
        location.href = `prontuario.html?vtr=${encodeURIComponent(record.vehicle)}`;
      }
    });

    document.getElementById("refreshAvarias").addEventListener("click", (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Atualizando';

      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i>Atualizar';
        load();
        renderKpis();
        populateVehicleFilter();
        applyFilters();
      }, 500);
    });
  }

  function init() {
    if (!AdminLayout.init()) return;
    load();
    renderKpis();
    populateVehicleFilter();
    renderTable();
    bindEvents();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", AvariasPage.init);
