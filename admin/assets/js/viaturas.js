const ViaturasPage = (() => {
  let vehicles = [];
  let filtered = [];
  let selected = null;
  const bulkSelectedIds = new Set();

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const natural = (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'pt-BR', {
    numeric: true,
    sensitivity: 'base'
  });

  const statusMap = {
    ATIVA: ['Ativa', 'vehicle-status-active'],
    RESERVA: ['Reserva', 'vehicle-status-reserve'],
    MANUTENCAO: ['Em manutenção', 'vehicle-status-maintenance'],
    INDISPONIVEL: ['Indisponível', 'vehicle-status-unavailable'],
    BAIXADA: ['Baixada', 'vehicle-status-inactive']
  };

  const normalizeStatus = value => {
    const normalized = String(value || 'ATIVA').trim().toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes('MANUT')) return 'MANUTENCAO';
    if (normalized.includes('RESERV')) return 'RESERVA';
    if (normalized.includes('INDISP')) return 'INDISPONIVEL';
    if (normalized.includes('BAIX') || normalized.includes('INAT')) return 'BAIXADA';
    return 'ATIVA';
  };

  const fmtKm = value => `${new Intl.NumberFormat('pt-BR').format(Number(value || 0))} km`;

  function mapVehicle(value) {
    return {
      id: String(value.id || ''),
      prefix: String(value.prefixo ?? ''),
      plate: String(value.placa ?? ''),
      chassis: String(value.chassi ?? ''),
      engine: String(value.motor ?? ''),
      renavam: String(value.renavam ?? ''),
      brand: String(value.marca ?? ''),
      model: String(value.modelo ?? ''),
      year: String(value.ano ?? ''),
      fuelType: String(value.tipoCombustivel ?? value.combustivel ?? ''),
      type: String(value.tipo ?? ''),
      unit: String(value.lotacao ?? '20º BPM'),
      initialKm: Number(value.kmInicial || 0),
      km: Number(value.kmAtual || 0),
      status: normalizeStatus(value.status),
      registration: String(value.cadastro || 'PENDENTE').toUpperCase(),
      notes: String(value.observacoes || ''),
      openDamages: Number(value.avariasAbertas || 0),
      lastChecklist: value.ultimoChecklist || null,
      updatedAt: value.ultimaAtualizacao || ''
    };
  }

  function kpi(id, label, value, icon, kind) {
    return `<div class="col-6 col-xl"><article class="vehicle-kpi ${kind || ''}" data-filter="${id}" tabindex="0" role="button"><div><div class="vehicle-kpi-label">${label}</div><p class="vehicle-kpi-value">${value}</p></div><i class="bi ${icon}"></i></article></div>`;
  }

  function renderKpis() {
    const counts = { all: vehicles.length, ATIVA: 0, RESERVA: 0, MANUTENCAO: 0, damages: 0 };
    vehicles.forEach(vehicle => {
      if (counts[vehicle.status] != null) counts[vehicle.status]++;
      if (vehicle.openDamages > 0) counts.damages++;
    });

    $('vehicleKpis').innerHTML =
      kpi('', 'Total', counts.all, 'bi-truck-front') +
      kpi('ATIVA', 'Ativas', counts.ATIVA, 'bi-check-circle', 'kpi-green') +
      kpi('RESERVA', 'Reservas', counts.RESERVA, 'bi-p-circle', 'kpi-blue') +
      kpi('MANUTENCAO', 'Em manutenção', counts.MANUTENCAO, 'bi-tools', 'kpi-orange') +
      kpi('COM_AVARIAS', 'Com avarias', counts.damages, 'bi-exclamation-triangle', 'kpi-red');

    document.querySelectorAll('.vehicle-kpi').forEach(card => {
      const activate = () => {
        const filter = card.dataset.filter;
        if (filter === 'COM_AVARIAS') {
          $('vehicleDamageFilter').value = 'COM_AVARIAS';
          $('vehicleStatusFilter').value = '';
        } else {
          $('vehicleStatusFilter').value = filter;
          $('vehicleDamageFilter').value = '';
        }
        applyFilters();
      };
      card.onclick = activate;
      card.onkeydown = event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      };
    });
  }

  function vehicleCard(vehicle) {
    const status = statusMap[vehicle.status] || statusMap.ATIVA;
    const complete = vehicle.registration === 'COMPLETO';
    return `<article class="vehicle-card"><div class="vehicle-card-top"><div class="d-flex align-items-center gap-3"><div class="vehicle-card-icon"><i class="bi bi-truck-front-fill"></i></div><div><h3 class="vehicle-prefix">${esc(vehicle.prefix)}</h3><div class="vehicle-description">${esc(vehicle.model || 'Modelo não informado')} · ${esc(vehicle.plate || 'Placa não informada')}</div></div></div><span class="vehicle-status-chip ${status[1]}">${status[0]}</span></div><div class="registration-chip ${complete ? 'complete' : 'pending'}"><i class="bi ${complete ? 'bi-check-circle' : 'bi-hourglass-split'}"></i>Cadastro ${complete ? 'completo' : 'pendente'}</div><div class="vehicle-data"><div class="vehicle-data-item"><span class="vehicle-data-label">KM atual</span><span class="vehicle-data-value">${fmtKm(vehicle.km)}</span></div><div class="vehicle-data-item"><span class="vehicle-data-label">Avarias abertas</span><span class="vehicle-data-value">${vehicle.openDamages}</span></div><div class="vehicle-data-item"><span class="vehicle-data-label">Chassi</span><span class="vehicle-data-value text-truncate">${esc(vehicle.chassis || 'Não informado')}</span></div><div class="vehicle-data-item"><span class="vehicle-data-label">RENAVAM</span><span class="vehicle-data-value">${esc(vehicle.renavam || 'Não informado')}</span></div></div><div class="vehicle-actions"><button class="btn btn-outline-primary" data-action="detail" data-id="${esc(vehicle.id)}"><i class="bi bi-eye me-1"></i>Detalhes</button><button class="btn btn-primary" data-action="edit" data-id="${esc(vehicle.id)}"><i class="bi bi-pencil me-1"></i>Editar</button><a class="btn btn-outline-secondary" title="Linha do tempo da viatura" href="historico-viatura.html?prefixo=${encodeURIComponent(vehicle.prefix)}"><i class="bi bi-clock-history"></i></a></div></article>`;
  }

  function renderVehicles() {
    const grid = $('vehiclesGrid');
    const empty = $('vehicleEmptyState');
    $('vehicleResultCount').textContent = `${filtered.length} registro${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}`;
    grid.innerHTML = filtered.map(vehicleCard).join('');
    empty.classList.toggle('d-none', filtered.length > 0);
    grid.querySelectorAll('[data-action]').forEach(button => {
      button.onclick = () => {
        const vehicle = vehicles.find(item => item.id === button.dataset.id);
        button.dataset.action === 'edit' ? openForm(vehicle) : openDetail(vehicle);
      };
    });
  }

  function applyFilters() {
    const query = $('vehicleSearch').value.trim().toLowerCase();
    const status = $('vehicleStatusFilter').value;
    const damage = $('vehicleDamageFilter').value;
    const sort = $('vehicleSort').value;

    filtered = vehicles.filter(vehicle => {
      const text = [vehicle.prefix, vehicle.plate, vehicle.chassis, vehicle.engine, vehicle.renavam, vehicle.brand, vehicle.model].join(' ').toLowerCase();
      return (!query || text.includes(query)) &&
        (!status || vehicle.status === status) &&
        (!damage || (damage === 'COM_AVARIAS' ? vehicle.openDamages > 0 : vehicle.openDamages === 0));
    });

    filtered.sort((a, b) => sort === 'PREFIX_DESC' ? natural(b.prefix, a.prefix) :
      sort === 'KM_DESC' ? b.km - a.km :
      sort === 'KM_ASC' ? a.km - b.km : natural(a.prefix, b.prefix));
    renderVehicles();
  }

  async function load() {
    try {
      $('vehicleResultCount').textContent = 'Carregando cadastro mestre...';
      const data = await ApiService.get('adminViaturas', {}, { forceNetwork: true });
      vehicles = (data.items || []).map(mapVehicle);
      renderKpis();
      applyFilters();
    } catch (error) {
      vehicles = [];
      renderKpis();
      applyFilters();
      $('vehicleResultCount').textContent = `Não foi possível carregar as viaturas: ${error.message}`;
    }
  }

  function setValue(id, value = '') {
    $(id).value = value ?? '';
  }

  function openForm(vehicle = null) {
    selected = vehicle;
    setValue('vehicleId', vehicle?.id);
    setValue('vehiclePrefix', vehicle?.prefix);
    setValue('vehicleStatus', vehicle?.status || 'ATIVA');
    setValue('vehiclePlate', vehicle?.plate);
    setValue('vehicleRenavam', vehicle?.renavam);
    setValue('vehicleChassis', vehicle?.chassis);
    setValue('vehicleEngine', vehicle?.engine);
    setValue('vehicleBrand', vehicle?.brand);
    setValue('vehicleModel', vehicle?.model);
    setValue('vehicleYear', vehicle?.year);
    setValue('vehicleFuelType', vehicle?.fuelType);
    setValue('vehicleType', vehicle?.type);
    setValue('vehicleUnit', vehicle?.unit || '20º BPM');
    setValue('vehicleInitialKm', vehicle?.initialKm || '');
    setValue('vehicleCurrentKm', vehicle?.km || '');
    setValue('vehicleNotes', vehicle?.notes);
    $('vehicleModalTitle').textContent = vehicle ? `Editar ${vehicle.prefix}` : 'Nova viatura';
    $('vehiclePrefix').readOnly = Boolean(vehicle);
    bootstrap.Modal.getOrCreateInstance($('vehicleModal')).show();
  }

  function detailField(label, value) {
    return `<div class="detail-field"><span>${label}</span><strong>${esc(value || 'Não informado')}</strong></div>`;
  }

  function openDetail(vehicle) {
    selected = vehicle;
    const status = statusMap[vehicle.status] || statusMap.ATIVA;
    $('vehicleDetailTitle').textContent = vehicle.prefix;
    $('vehicleDetailBody').innerHTML = `<div class="detail-hero"><div><span class="vehicle-status-chip ${status[1]}">${status[0]}</span><h3>${esc(vehicle.prefix)}</h3><p>${esc(vehicle.model || 'Modelo não informado')} · ${esc(vehicle.plate || 'Placa não informada')}</p></div><div class="detail-km"><span>KM atual</span><strong>${fmtKm(vehicle.km)}</strong></div></div><div class="detail-grid">${detailField('Placa', vehicle.plate)}${detailField('Chassi', vehicle.chassis)}${detailField('Nº do motor', vehicle.engine)}${detailField('RENAVAM', vehicle.renavam)}${detailField('Marca', vehicle.brand)}${detailField('Modelo', vehicle.model)}${detailField('Ano', vehicle.year)}${detailField('Combustível', vehicle.fuelType)}${detailField('Tipo', vehicle.type)}${detailField('Lotação', vehicle.unit)}${detailField('KM inicial', fmtKm(vehicle.initialKm))}${detailField('Avarias abertas', vehicle.openDamages)}</div><div class="mt-4"><h4 class="h6">Observações administrativas</h4><p class="text-secondary">${esc(vehicle.notes || 'Nenhuma observação registrada.')}</p></div>`;
    bootstrap.Modal.getOrCreateInstance($('vehicleDetailModal')).show();
  }

  async function save(event) {
    event.preventDefault();
    const prefix = $('vehiclePrefix').value.trim();
    if (!prefix) {
      $('vehiclePrefix').focus();
      return;
    }
    const payload = {
      id: $('vehicleId').value,
      prefixo: prefix,
      status: $('vehicleStatus').value,
      placa: $('vehiclePlate').value.trim(),
      renavam: $('vehicleRenavam').value.trim(),
      chassi: $('vehicleChassis').value.trim(),
      motor: $('vehicleEngine').value.trim(),
      marca: $('vehicleBrand').value.trim(),
      modelo: $('vehicleModel').value.trim(),
      ano: $('vehicleYear').value,
      tipoCombustivel: $('vehicleFuelType').value,
      tipo: $('vehicleType').value.trim(),
      lotacao: $('vehicleUnit').value.trim(),
      kmInicial: $('vehicleInitialKm').value,
      kmAtual: $('vehicleCurrentKm').value,
      observacoes: $('vehicleNotes').value.trim(),
      admin: 'Administrador'
    };
    const button = $('saveVehicleButton');
    button.disabled = true;
    try {
      await ApiService.post('adminSalvarViatura', payload);
      bootstrap.Modal.getInstance($('vehicleModal')).hide();
      await load();
    } catch (error) {
      alert(`Não foi possível salvar: ${error.message}`);
    } finally {
      button.disabled = false;
    }
  }

  async function importFleet() {
    if (!confirm('Importar/atualizar as 21 viaturas oficiais de 50-2001 a 50-2021? Registros existentes serão preservados e apenas os dados cadastrais serão completados.')) return;
    const button = $('importFleetButton');
    button.disabled = true;
    try {
      const result = await ApiService.post('adminImportarFrotaOficial', { admin: 'Administrador' });
      alert(`Importação concluída. Criadas: ${result.criadas || 0}. Atualizadas: ${result.atualizadas || 0}.`);
      await load();
    } catch (error) {
      alert(`Falha na importação: ${error.message}`);
    } finally {
      button.disabled = false;
    }
  }

  function renderBulkValueField() {
    const field = $('bulkField').value;
    const container = $('bulkValueContainer');
    if (field === 'status') {
      container.innerHTML = '<select id="bulkValue" class="form-select" required><option value="">Selecione</option><option value="ATIVA">Ativa</option><option value="RESERVA">Reserva</option><option value="MANUTENCAO">Em manutenção</option><option value="INDISPONIVEL">Indisponível</option><option value="BAIXADA">Baixada</option></select>';
    } else if (field === 'tipoCombustivel') {
      container.innerHTML = '<select id="bulkValue" class="form-select" required><option value="">Selecione</option><option value="DIESEL">Diesel</option><option value="GASOLINA">Gasolina</option><option value="FLEX">Flex</option><option value="ELÉTRICO">Elétrico</option></select>';
    } else if (field === 'observacoes') {
      container.innerHTML = '<textarea id="bulkValue" class="form-control" rows="2" maxlength="500" required placeholder="Observação administrativa comum"></textarea>';
    } else if (field === 'ano') {
      container.innerHTML = '<input id="bulkValue" class="form-control" type="number" min="1980" max="2100" required placeholder="Ex.: 2024">';
    } else {
      container.innerHTML = `<input id="bulkValue" class="form-control" maxlength="120" ${field ? 'required' : 'disabled'} placeholder="${field ? 'Informe o novo valor' : 'Selecione primeiro o campo'}">`;
    }
    const valueField = $('bulkValue');
    if (valueField) valueField.addEventListener('input', updateBulkSummary);
    updateBulkSummary();
  }

  function renderBulkVehicleList() {
    const list = $('bulkVehicleList');
    if (!vehicles.length) {
      list.innerHTML = '<div class="text-secondary text-center py-4">Nenhuma viatura cadastrada.</div>';
      return;
    }
    list.innerHTML = vehicles.slice().sort((a, b) => natural(a.prefix, b.prefix)).map(vehicle => `
      <label class="bulk-vehicle-item ${bulkSelectedIds.has(vehicle.id) ? 'selected' : ''}">
        <input class="form-check-input" type="checkbox" value="${esc(vehicle.id)}" ${bulkSelectedIds.has(vehicle.id) ? 'checked' : ''}>
        <span><strong>${esc(vehicle.prefix)}</strong><small>${esc([vehicle.brand, vehicle.model, vehicle.plate].filter(Boolean).join(' · ') || 'Cadastro pendente')}</small></span>
        <span class="vehicle-status-chip ${(statusMap[vehicle.status] || statusMap.ATIVA)[1]}">${(statusMap[vehicle.status] || statusMap.ATIVA)[0]}</span>
      </label>`).join('');
    list.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        checkbox.checked ? bulkSelectedIds.add(checkbox.value) : bulkSelectedIds.delete(checkbox.value);
        checkbox.closest('.bulk-vehicle-item').classList.toggle('selected', checkbox.checked);
        updateBulkSummary();
      });
    });
  }

  function updateBulkSummary() {
    const count = bulkSelectedIds.size;
    $('bulkSelectionSummary').textContent = count ? `${count} viatura${count === 1 ? '' : 's'} selecionada${count === 1 ? '' : 's'}.` : 'Nenhuma viatura selecionada.';
    const field = $('bulkField').value;
    const value = $('bulkValue') ? String($('bulkValue').value || '').trim() : '';
    $('applyBulkUpdateButton').disabled = !(count && field && value);
  }

  function openBulkEdit() {
    bulkSelectedIds.clear();
    $('bulkEditForm').reset();
    renderBulkValueField();
    renderBulkVehicleList();
    updateBulkSummary();
    bootstrap.Modal.getOrCreateInstance($('bulkEditModal')).show();
  }

  async function applyBulkUpdate(event) {
    event.preventDefault();
    const field = $('bulkField').value;
    const value = String($('bulkValue')?.value || '').trim();
    const ids = Array.from(bulkSelectedIds);
    if (!field || !value || !ids.length) return;

    const fieldLabel = $('bulkField').selectedOptions[0]?.textContent || field;
    if (!confirm(`Confirma a atualização de ${ids.length} viatura(s)?\n\nCampo: ${fieldLabel}\nNovo valor: ${value}\n\nDados individuais, documentos e quilometragem serão preservados.`)) return;

    const button = $('applyBulkUpdateButton');
    button.disabled = true;
    try {
      const result = await ApiService.post('adminAtualizarViaturasEmMassa', {
        ids,
        campo: field,
        valor: value,
        admin: 'Administrador'
      });
      alert(`Atualização concluída. Atualizadas: ${result.atualizadas || 0}. Não localizadas: ${result.naoLocalizadas || 0}.`);
      bootstrap.Modal.getInstance($('bulkEditModal')).hide();
      await load();
    } catch (error) {
      alert(`Não foi possível aplicar a atualização: ${error.message}`);
    } finally {
      button.disabled = false;
    }
  }

  function init() {
    if (!AdminLayout.init()) return;
    $('newVehicleButton').onclick = () => openForm();
    $('refreshVehiclesButton').onclick = load;
    $('importFleetButton').onclick = importFleet;
    $('bulkEditButton').onclick = openBulkEdit;
    $('vehicleForm').onsubmit = save;
    $('bulkEditForm').onsubmit = applyBulkUpdate;
    $('bulkField').addEventListener('change', renderBulkValueField);
    $('selectFilteredVehicles').onclick = () => {
      filtered.forEach(vehicle => bulkSelectedIds.add(vehicle.id));
      renderBulkVehicleList();
      updateBulkSummary();
    };
    $('clearBulkSelection').onclick = () => {
      bulkSelectedIds.clear();
      renderBulkVehicleList();
      updateBulkSummary();
    };
    $('editFromDetailButton').onclick = () => {
      bootstrap.Modal.getInstance($('vehicleDetailModal')).hide();
      openForm(selected);
    };
    ['vehicleSearch', 'vehicleStatusFilter', 'vehicleDamageFilter', 'vehicleSort'].forEach(id => {
      $(id).addEventListener($(id).tagName === 'INPUT' ? 'input' : 'change', applyFilters);
    });
    $('clearVehicleFilters').onclick = () => {
      setValue('vehicleSearch');
      setValue('vehicleStatusFilter');
      setValue('vehicleDamageFilter');
      setValue('vehicleSort', 'PREFIX_ASC');
      applyFilters();
    };
    load();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', ViaturasPage.init);
