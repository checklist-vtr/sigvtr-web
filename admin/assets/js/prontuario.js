const ProntuarioPage = (() => {
  const VEHICLE_STORAGE_KEY = "sigvtr_admin_vehicles_v1";
  const DAMAGE_STORAGE_KEY = "sigvtr_admin_avarias_v2";

  const statusLabels = {
    ATIVA: "Ativa",
    MANUTENCAO: "Em manutenção",
    RESERVA: "Reserva",
    INATIVA: "Inativa"
  };

  const seedVehicles = [
    { id:"VEI-001", prefix:"VTR-2012", plate:"QVE-2A12", brand:"Chevrolet", model:"Trailblazer", year:2023, company:"1ª Companhia", km:34582, fuel:78, status:"ATIVA", openDamages:1, checklists:42, notes:"Viatura de radiopatrulhamento.", lastChecklist:"28/07/2026 10:30", lastDriver:"CB Silva" },
    { id:"VEI-002", prefix:"VTR-2007", plate:"QVE-2B07", brand:"Ford", model:"Ranger", year:2022, company:"2ª Companhia", km:51204, fuel:54, status:"MANUTENCAO", openDamages:1, checklists:36, notes:"Avaliação da lanterna traseira.", lastChecklist:"25/07/2026 19:10", lastDriver:"SGT Costa" },
    { id:"VEI-003", prefix:"VTR-2018", plate:"QVE-2C18", brand:"Renault", model:"Duster", year:2021, company:"1ª Companhia", km:63910, fuel:66, status:"ATIVA", openDamages:1, checklists:51, notes:"Acompanhar trinca no para-brisa.", lastChecklist:"27/07/2026 17:41", lastDriver:"SD Souza" },
    { id:"VEI-004", prefix:"VTR-2014", plate:"QVE-2D14", brand:"Toyota", model:"Hilux", year:2020, company:"3ª Companhia", km:88440, fuel:41, status:"RESERVA", openDamages:1, checklists:63, notes:"Viatura reserva da unidade.", lastChecklist:"10/07/2026 09:05", lastDriver:"CB Lima" },
    { id:"VEI-005", prefix:"VTR-2021", plate:"QVE-2E21", brand:"Chevrolet", model:"S10", year:2024, company:"1ª Companhia", km:18260, fuel:92, status:"ATIVA", openDamages:0, checklists:24, notes:"Sem observações.", lastChecklist:"18/06/2026 11:18", lastDriver:"CB Almeida" }
  ];

  const checklistSeed = {
    "VTR-2012": [["SIG-2026-0187","28/07/2026 10:30","CB Silva","Concluído"],["SIG-2026-0178","27/07/2026 19:22","SD Oliveira","Concluído"]],
    "VTR-2007": [["SIG-2026-0172","25/07/2026 19:10","SGT Costa","Concluído"]],
    "VTR-2018": [["SIG-2026-0181","27/07/2026 17:41","SD Souza","Concluído"]],
    "VTR-2014": [["SIG-2026-0106","10/07/2026 09:05","CB Lima","Concluído"]],
    "VTR-2021": [["SIG-2026-0067","18/06/2026 11:18","CB Almeida","Concluído"]]
  };

  let vehicles = [];
  let currentPrefix = "";

  function loadVehicles() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(VEHICLE_STORAGE_KEY));
      vehicles = Array.isArray(stored) && stored.length ? stored : structuredClone(seedVehicles);
    } catch {
      vehicles = structuredClone(seedVehicles);
    }

    vehicles = vehicles.map((vehicle) => ({
      lastChecklist: "Não informado",
      lastDriver: "Não informado",
      notes: "",
      ...vehicle
    }));
  }

  function saveVehicles() {
    sessionStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicles));
  }

  function loadDamages() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(DAMAGE_STORAGE_KEY));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  function currentVehicle() {
    return vehicles.find((vehicle) => vehicle.prefix === currentPrefix) || vehicles[0];
  }

  function formatKm(value) {
    return `${new Intl.NumberFormat("pt-BR").format(Number(value || 0))} km`;
  }

  function renderSelector() {
    const selector = document.getElementById("vehicleSelector");

    selector.innerHTML = vehicles.map((vehicle) => `
      <option value="${vehicle.prefix}">
        ${vehicle.prefix} — ${vehicle.brand} ${vehicle.model}
      </option>
    `).join("");

    const requested = new URLSearchParams(location.search).get("vtr");
    currentPrefix = requested && vehicles.some((vehicle) => vehicle.prefix === requested)
      ? requested
      : vehicles[0]?.prefix;

    selector.value = currentPrefix;
    selector.onchange = () => {
      currentPrefix = selector.value;
      render();
    };
  }

  function render() {
    const vehicle = currentVehicle();
    if (!vehicle) return;

    const damages = loadDamages().filter((item) => item.vehicle === vehicle.prefix);
    const openDamages = damages.filter((item) => item.status !== "RESOLVIDA");
    vehicle.openDamages = openDamages.length;

    document.getElementById("vehicleHeader").innerHTML = `
      <div class="vehicle-icon"><i class="bi bi-truck-front-fill"></i></div>
      <div>
        <h2 class="vehicle-title">${vehicle.prefix}</h2>
        <div class="vehicle-meta">
          ${vehicle.brand} ${vehicle.model} · ${vehicle.plate} · ${vehicle.company}
        </div>
      </div>
      <span class="vehicle-status">${statusLabels[vehicle.status] || vehicle.status}</span>
    `;

    document.getElementById("vehicleKpis").innerHTML = [
      ["Quilometragem", formatKm(vehicle.km)],
      ["Combustível", `${vehicle.fuel}%`],
      ["Checklists", vehicle.checklists || 0],
      ["Avarias abertas", vehicle.openDamages || 0]
    ].map(([label, value]) => `
      <div class="col-6 col-xl-3">
        <article class="record-kpi h-100">
          <div class="record-kpi-label">${label}</div>
          <p class="record-kpi-value">${value}</p>
        </article>
      </div>
    `).join("");

    document.getElementById("summaryContent").innerHTML = `
      <div class="info-grid">
        ${[
          ["Prefixo", vehicle.prefix],
          ["Placa", vehicle.plate],
          ["Marca", vehicle.brand],
          ["Modelo", vehicle.model],
          ["Ano", vehicle.year],
          ["Companhia", vehicle.company],
          ["Último checklist", vehicle.lastChecklist],
          ["Último condutor", vehicle.lastDriver],
          ["Situação", statusLabels[vehicle.status] || vehicle.status],
          ["Observações", vehicle.notes || "Sem observações"]
        ].map(([label, value]) => `
          <div class="info-card">
            <span class="info-label">${label}</span>
            <strong>${value}</strong>
          </div>
        `).join("")}
      </div>
    `;

    document.getElementById("damageContent").innerHTML = damages.length
      ? damages.map((damage) => `
          <article class="damage-card">
            <div class="d-flex justify-content-between gap-3 flex-wrap">
              <div>
                <strong class="d-block">${damage.component || damage.description}</strong>
                <span class="text-secondary small">
                  ${damage.id} · ${damage.description} · ${damage.displayDate}
                </span>
              </div>
              <span class="damage-status ${damage.status === "RESOLVIDA" ? "resolved" : ""}">
                ${damage.status === "RESOLVIDA" ? "Resolvida" : "Aberta"}
              </span>
            </div>
          </article>
        `).join("")
      : '<div class="empty-panel">Nenhuma avaria registrada para esta viatura.</div>';

    const checklists = checklistSeed[vehicle.prefix] || [];
    document.getElementById("checklistContent").innerHTML = checklists.length
      ? `<div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>Protocolo</th><th>Data</th><th>Condutor</th><th>Status</th></tr></thead>
            <tbody>
              ${checklists.map((item) => `
                <tr>
                  <td class="fw-semibold">${item[0]}</td>
                  <td>${item[1]}</td>
                  <td>${item[2]}</td>
                  <td><span class="badge text-bg-success">${item[3]}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>`
      : '<div class="empty-panel">Nenhum checklist disponível.</div>';

    const events = [
      ...checklists.map((item) => ({
        date: item[1],
        icon: "bi-clipboard2-check",
        text: `Checklist ${item[0]} realizado por ${item[2]}.`
      })),
      ...damages.flatMap((damage) =>
        (damage.history || []).map((event) => ({
          date: event.date,
          icon: "bi-tools",
          text: `${damage.id}: ${event.text}`
        }))
      )
    ];

    document.getElementById("historyContent").innerHTML = events.length
      ? `<ul class="event-list">
          ${events.map((event) => `
            <li class="event-item">
              <div class="event-icon"><i class="bi ${event.icon}"></i></div>
              <div>
                <strong class="d-block">${event.date}</strong>
                <span class="text-secondary small">${event.text}</span>
              </div>
            </li>
          `).join("")}
        </ul>`
      : '<div class="empty-panel">Nenhum evento disponível.</div>';
  }

  function openEdit() {
    const vehicle = currentVehicle();
    if (!vehicle) return;

    document.getElementById("recordPrefix").value = vehicle.prefix;
    document.getElementById("recordPlate").value = vehicle.plate;
    document.getElementById("recordYear").value = vehicle.year;
    document.getElementById("recordBrand").value = vehicle.brand;
    document.getElementById("recordModel").value = vehicle.model;
    document.getElementById("recordCompany").value = vehicle.company;
    document.getElementById("recordKm").value = vehicle.km;
    document.getElementById("recordFuel").value = vehicle.fuel;
    document.getElementById("recordStatus").value = vehicle.status;
    document.getElementById("recordNotes").value = vehicle.notes || "";

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("editVehicleRecordModal")
    ).show();
  }

  function saveEdit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const vehicle = currentVehicle();
    if (!vehicle) return;

    const previousPrefix = vehicle.prefix;
    const newPrefix = document.getElementById("recordPrefix").value.trim().toUpperCase();
    const newPlate = document.getElementById("recordPlate").value.trim().toUpperCase();

    const duplicate = vehicles.find((item) =>
      item.id !== vehicle.id &&
      (item.prefix.toUpperCase() === newPrefix || item.plate.toUpperCase() === newPlate)
    );

    if (duplicate) {
      alert("Já existe uma viatura com o mesmo prefixo ou placa.");
      return;
    }

    vehicle.prefix = newPrefix;
    vehicle.plate = newPlate;
    vehicle.year = Number(document.getElementById("recordYear").value);
    vehicle.brand = document.getElementById("recordBrand").value.trim();
    vehicle.model = document.getElementById("recordModel").value.trim();
    vehicle.company = document.getElementById("recordCompany").value.trim();
    vehicle.km = Number(document.getElementById("recordKm").value);
    vehicle.fuel = Number(document.getElementById("recordFuel").value);
    vehicle.status = document.getElementById("recordStatus").value;
    vehicle.notes = document.getElementById("recordNotes").value.trim();

    if (previousPrefix !== newPrefix) {
      const damages = loadDamages();
      damages.forEach((damage) => {
        if (damage.vehicle === previousPrefix) damage.vehicle = newPrefix;
      });
      sessionStorage.setItem(DAMAGE_STORAGE_KEY, JSON.stringify(damages));
    }

    currentPrefix = newPrefix;
    saveVehicles();
    renderSelector();
    document.getElementById("vehicleSelector").value = currentPrefix;
    render();

    bootstrap.Modal.getInstance(
      document.getElementById("editVehicleRecordModal")
    )?.hide();
  }

  function init() {
    if (!AdminLayout.init()) return;

    loadVehicles();
    renderSelector();
    render();

    document.getElementById("editVehicleRecordButton")
      .addEventListener("click", openEdit);

    document.getElementById("editVehicleRecordForm")
      .addEventListener("submit", saveEdit);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", ProntuarioPage.init);
