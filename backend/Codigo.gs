/******************************************************************
 * SIGVTR - Sistema Integrado de Gestão de Viaturas
 * Arquivo: Código.gs
 * Versão do pacote: 1.20.3-RC1
 * API: 2.0
 * Data: 03/08/2026
 *
 * Arquivo principal do backend. Contém as rotas GET, funções comuns,
 * integração com Google Sheets e Google Drive e o fluxo legado.
 *
 * Compatível com as abas:
 * CONFIG, USUARIOS, VIATURAS, RETIRADAS, EVENTOS, AVARIAS,
 * FOTOS, LOGS e CHECKLIST_ITENS.
 ******************************************************************/

const SIGVTR = {
  PACKAGE_VERSION: "1.20.3-RC1",
  API_VERSION: "2.0",
  TIMEZONE: "America/Belem",
  ROOT_FOLDER_NAME: "SIGVTR - Fotos",
  MAX_PHOTOS: 5,
  SHEETS: {
    CONFIG: "CONFIG",
    USERS: "USUARIOS",
    VEHICLES: "VIATURAS",
    WITHDRAWALS: "RETIRADAS",
    EVENTS: "EVENTOS",
    DAMAGES: "AVARIAS",
    PHOTOS: "FOTOS",
    LOGS: "LOGS",
    ITEMS: "CHECKLIST_ITENS",
    CARDS: "CARTOES",
    STATUS_HISTORY: "HISTORICO_STATUS_VTR"
  }
};

function doGet(e) {
  try {
    const action = String(
      (e && e.parameter && e.parameter.action) || "status"
    ).trim();

    if (action === "avariasPendentes") {
      const prefixo = String(
        (e && e.parameter && e.parameter.prefixo) || ""
      ).trim();

      if (!prefixo) {
        throw new Error("Prefixo não informado.");
      }

      return json_({
        success: true,
        avarias: getPendingDamagesByPrefix_(prefixo)
      });
    }

    if (action === "confirmarRetiradaMobile") {
      const idRequisicao = String(
        (e && e.parameter && e.parameter.idRequisicao) || ""
      ).trim();
      if (!idRequisicao) throw new Error("Identificador da requisição não informado.");
      return json_({success:true,data:confirmMobileWithdrawalByRequestId_(idRequisicao)});
    }

    if (action.indexOf("admin") === 0) {
      return json_({success:false,code:"SESSION_REQUIRED",message:"Operação administrativa exige POST autenticado."});
    }

    if (action === "bootstrap") {
      return json_({
        success: true,
        config: getConfig_(),
        usuarios: getActiveUsers_(),
        viaturas: getActiveVehicles_(),
        itens: getActiveChecklistItems_()
      });
    }

    return json_({
      success: true,
      system: "SIGVTR",
      version: SIGVTR.API_VERSION,
      packageVersion: SIGVTR.PACKAGE_VERSION,
      message: "API operacional"
    });

  } catch (error) {
    console.error(error);

    return json_({
      success: false,
      message: error && error.message
        ? error.message
        : "Erro interno no SIGVTR."
    });
  }
}

function configurarSistema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Abra o Apps Script a partir da planilha SIGVTR - Banco de Dados.");

  validateRequiredSheets_(ss);
  ensureExtraWithdrawalColumns_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS));
  const folder = getRootFolder_();

  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: ss.getId(),
    ROOT_FOLDER_ID: folder.getId()
  });

  return {
    success: true,
    spreadsheet: ss.getUrl(),
    folder: folder.getUrl()
  };
}

function saveWithdrawal_(data) {
  validateWithdrawal_(data);

  const ss = getSpreadsheet_();
  const now = new Date();
  const idWithdrawal = "RET-" + Utilities.getUuid();
  const protocol = makeProtocol_(now);

  const user = findUserById_(data.idUsuario);
  const vehicle = findVehicleById_(data.idVtr);

  const photoRecords = savePhotos_(
    data.fotos || [],
    vehicle.prefixo,
    now,
    idWithdrawal,
    protocol
  );

  const itemMap = data.itens || {};
  const nonCompliant = Object.keys(itemMap).filter(k => itemMap[k] === "nao");
  const status = nonCompliant.length ? "COM ALTERAÇÃO" : "CONFORME";

  appendWithdrawal_(ss, {
    idWithdrawal,
    user,
    vehicle,
    data,
    status,
    protocol,
    now,
    photoCount: photoRecords.length
  });

  if (nonCompliant.length) {
    appendDamages_(ss, {
      idWithdrawal,
      vehicle,
      user,
      data,
      itemKeys: nonCompliant,
      now
    });
  }

  appendPhotos_(ss, photoRecords, idWithdrawal, now);

  appendLog_(ss, {
    idUsuario: user.id,
    action: "REGISTRO DE RETIRADA",
    referenceId: idWithdrawal,
    description: `Checklist ${status} - ${vehicle.prefixo} - ${protocol}`,
    device: data.dispositivo || {},
    result: "SUCESSO",
    now
  });

  updateVehicleKm_(ss, vehicle.id, Number(data.kmInicial));

  return {
    success: true,
    id: idWithdrawal,
    protocolo: protocol,
    status,
    fotosSalvas: photoRecords.length
  };
}

function appendWithdrawal_(ss, context) {
  const sheet = ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS);
  const headers = getHeaders_(sheet);
  const values = {};

  values["ID_RETIRADA"] = context.idWithdrawal;
  values["ID_USUARIO"] = context.user.id;
  values["ID_VTR"] = context.vehicle.id;
  values["Tipo_Retirada"] = "INÍCIO DE SERVIÇO";
  values["KM Inicial"] = Number(context.data.kmInicial);
  values["Fotos Obrigatórias"] = context.photoCount > 0 ? "SIM" : "NÃO";
  values["Status"] = context.status;
  values["Data/Hora Registro"] = context.now;

  values["Motorista"] = context.data.motorista || context.user.nomeCompleto;
  values["RG PMPA"] = context.user.rg;
  values["Turno"] = context.data.turno;
  values["Equipe"] = context.data.equipe;
  values["Observações"] = context.data.observacoes || "";
  values["Protocolo"] = context.protocol;
  values["Dispositivo"] = (context.data.dispositivo || {}).tipo || "";
  values["Navegador"] = (context.data.dispositivo || {}).navegador || "";
  values["ITENS_JSON"] = JSON.stringify(context.data.itens || {});

  const itemHeaderMap = buildWithdrawalItemHeaderMap_();
  Object.keys(context.data.itens || {}).forEach(function(itemKey) {
    const targetHeader = itemHeaderMap[itemKey];
    if (targetHeader) {
      values[targetHeader] = context.data.itens[itemKey] === "ok" ? "CONFORME" : "NÃO CONFORME";
    }
  });

  appendByHeaders_(sheet, headers, values);
}

function appendDamages_(ss, context) {
  const sheet = ss.getSheetByName(SIGVTR.SHEETS.DAMAGES);
  const headers = getHeaders_(sheet);

  context.itemKeys.forEach(function(itemKey) {
    const values = {
      "ID_AVARIA": "AVA-" + Utilities.getUuid(),
      "ID_RETIRADA_DETECCAO": context.idWithdrawal,
      "ID_RETIRADA_RESPONSAVEL": "",
      "ID_VTR": context.vehicle.id,
      "Item": itemKeyToName_(itemKey),
      "Descrição": context.data.observacoes || "Item marcado como não conforme no checklist.",
      "Data Detecção": context.now,
      "Situação": "PENDENTE",
      "Data Solução": "",
      "Observação Administração": ""
    };
    appendByHeaders_(sheet, headers, values);
  });
}

function appendPhotos_(ss, records, idWithdrawal, now) {
  if (!records.length) return;
  const sheet = ss.getSheetByName(SIGVTR.SHEETS.PHOTOS);
  const headers = getHeaders_(sheet);

  records.forEach(function(record) {
    appendByHeaders_(sheet, headers, {
      "ID_FOTO": record.id,
      "ID_RETIRADA": idWithdrawal,
      "Tipo Foto": "CHECKLIST",
      "Nome Arquivo": record.name,
      "Link Drive": record.url,
      "Data": now
    });
  });
}

function appendLog_(ss, log) {
  const sheet = ss.getSheetByName(SIGVTR.SHEETS.LOGS);
  const headers = getHeaders_(sheet);

  appendByHeaders_(sheet, headers, {
    "ID_LOG": "LOG-" + Utilities.getUuid(),
    "Data": Utilities.formatDate(log.now, SIGVTR.TIMEZONE, "dd/MM/yyyy"),
    "Hora": Utilities.formatDate(log.now, SIGVTR.TIMEZONE, "HH:mm:ss"),
    "ID_USUARIO": log.idUsuario,
    "Ação": log.action,
    "ID_REFERENCIA": log.referenceId,
    "Descrição": log.description,
    "Dispositivo": log.device.tipo || "",
    "Navegador": log.device.navegador || "",
    "Resultado": log.result
  });
}

function getConfig_() {
  const sheet = getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.CONFIG);
  const rows = sheet.getDataRange().getValues();
  const result = {};

  rows.slice(1).forEach(function(row) {
    if (row[0]) result[String(row[0]).trim()] = row[1];
  });

  return result;
}

function getActiveUsers_() {
  const sheet = getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift().map(String);

  return data
    .filter(row => String(valueByHeader_(headers, row, "Status")).toLowerCase() === "ativo")
    .map(row => ({
      id: valueByHeader_(headers, row, "ID_USUARIO"),
      rg: valueByHeader_(headers, row, "RG PMPA"),
      nomeCompleto: valueByHeader_(headers, row, "Nome Completo"),
      nomeGuerra: valueByHeader_(headers, row, "Nome de Guerra"),
      postoGraduacao: valueByHeader_(headers, row, "Posto/Graduação"),
      perfil: valueByHeader_(headers, row, "Perfil")
    }));
}

function getActiveVehicles_() {
  const sheet = getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.VEHICLES);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift().map(String);

  return data
    .filter(row => {
      const status = String(valueByHeader_(headers, row, "Status")).toLowerCase();
      return status !== "inativo" && status !== "";
    })
    .map(row => ({
      id: valueByHeader_(headers, row, "ID-VTR"),
      prefixo: valueByHeader_(headers, row, "Prefixo"),
      placa: valueByHeader_(headers, row, "Placa"),
      modelo: valueByHeader_(headers, row, "Modelo"),
      ano: valueByHeader_(headers, row, "Ano"),
      combustivel: valueByHeader_(headers, row, "Combustível"),
      kmAtual: valueByHeader_(headers, row, "KM Atual"),
      status: valueByHeader_(headers, row, "Status"),
      chassi: valueByHeader_(headers, row, "Chassi"),
      motor: valueByHeader_(headers, row, "Nº do Motor"),
      renavam: valueByHeader_(headers, row, "RENAVAM"),
      marca: valueByHeader_(headers, row, "Marca"),
      tipoCombustivel: valueByHeader_(headers, row, "Tipo Combustível"),
      tipo: valueByHeader_(headers, row, "Tipo"),
      lotacao: valueByHeader_(headers, row, "Lotação"),
      kmInicial: valueByHeader_(headers, row, "KM Inicial"),
      cadastro: valueByHeader_(headers, row, "Cadastro"),
      observacoes: valueByHeader_(headers, row, "Observações")
    }));
}

function getActiveChecklistItems_() {
  const sheet = getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.ITEMS);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift().map(String);

  return data
    .filter(row => String(valueByHeader_(headers, row, "Ativo")).toLowerCase() === "sim")
    .map(row => ({
      id: valueByHeader_(headers, row, "ID_ITEM"),
      nome: valueByHeader_(headers, row, "Nome_Item"),
      ordem: Number(valueByHeader_(headers, row, "Ordem")) || 999,
      categoria: valueByHeader_(headers, row, "Categoria"),
      key: normalizeKey_(valueByHeader_(headers, row, "Nome_Item"))
    }))
    .sort((a, b) => a.ordem - b.ordem);
}

function findUserById_(id) {
  const users = getActiveUsers_();
  const user = users.find(u => String(u.id) === String(id));
  if (!user) throw new Error("Usuário não encontrado ou inativo.");
  return user;
}

function findVehicleById_(id) {
  const vehicles = getActiveVehicles_();
  const vehicle = vehicles.find(v => String(v.id) === String(id));
  if (!vehicle) throw new Error("Viatura não encontrada ou indisponível.");
  return vehicle;
}

function validateWithdrawal_(data) {
  ["idUsuario", "idVtr", "turno", "equipe", "kmInicial"].forEach(function(field) {
    if (data[field] === undefined || data[field] === null || String(data[field]).trim() === "") {
      throw new Error("Campo obrigatório ausente: " + field);
    }
  });

  if (!Number.isFinite(Number(data.kmInicial)) || Number(data.kmInicial) < 0) {
    throw new Error("KM inicial inválido.");
  }

  const activeItems = getActiveChecklistItems_();
  const submittedItems = data.itens || {};

  if (Object.keys(submittedItems).length !== activeItems.length) {
    throw new Error("Todos os itens ativos devem ser avaliados.");
  }

  activeItems.forEach(function(item) {
    if (submittedItems[item.key] !== "ok" && submittedItems[item.key] !== "nao") {
      throw new Error("Situação inválida no item: " + item.nome);
    }
  });

  if ((data.fotos || []).length > SIGVTR.MAX_PHOTOS) {
    throw new Error("Máximo de 5 fotografias.");
  }
}

function savePhotos_(photos, prefix, date, idWithdrawal, protocol) {
  if (!photos.length) return [];

  const root = getRootFolder_();
  const year = childFolder_(root, Utilities.formatDate(date, SIGVTR.TIMEZONE, "yyyy"));
  const month = childFolder_(year, Utilities.formatDate(date, SIGVTR.TIMEZONE, "MM"));
  const vehicle = childFolder_(month, String(prefix || "SEM_PREFIXO"));
  const day = childFolder_(vehicle, Utilities.formatDate(date, SIGVTR.TIMEZONE, "yyyy-MM-dd"));
  const record = childFolder_(day, protocol);

  return photos.slice(0, SIGVTR.MAX_PHOTOS).map(function(photo, index) {
    const bytes = Utilities.base64Decode(photo.data);
    if (bytes.length > 6 * 1024 * 1024) {
      throw new Error("Uma fotografia excede 6 MB.");
    }

    const name = sanitizeFilename_(
      String(index + 1).padStart(2, "0") + "_" + (photo.name || "foto.jpg")
    );

    const file = record.createFile(
      Utilities.newBlob(bytes, photo.mimeType || "image/jpeg", name)
    );

    const publicUrl = prepareSigvtrPhotoForLinkAccess_(file);

    return {
      id: "FOTO-" + Utilities.getUuid(),
      name,
      url: publicUrl,
      idWithdrawal
    };
  });
}

function updateVehicleKm_(ss, vehicleId, km) {
  const sheet = ss.getSheetByName(SIGVTR.SHEETS.VEHICLES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(String);
  const idIndex = headers.indexOf("ID-VTR");
  const kmIndex = headers.indexOf("KM Atual");

  if (idIndex < 0 || kmIndex < 0) return;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(vehicleId)) {
      const current = Number(data[i][kmIndex]) || 0;
      const informed = Number(km) || 0;
      const nextKm = Math.max(current, informed);
      if (nextKm !== current) sheet.getRange(i + 1, kmIndex + 1).setValue(nextKm);
      return;
    }
  }
}

function ensureExtraWithdrawalColumns_(sheet) {
  const required = [
    "Motorista", "Posto/Graduação", "RG PMPA", "Combustível Inicial",
    "Turno", "Operação/Outros", "Tipo Checklist", "Observações",
    "Protocolo", "Dispositivo", "Navegador", "ITENS_JSON"
  ];

  const headers = getHeaders_(sheet);
  let lastColumn = headers.length;

  required.forEach(function(header) {
    if (!headers.includes(header)) {
      lastColumn++;
      sheet.getRange(1, lastColumn).setValue(header);
      headers.push(header);
    }
  });

  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function buildWithdrawalItemHeaderMap_() {
  return {
    "pneus": "Pneus",
    "farois": "Farol",
    "giroflex": "Giroflex",
    "sirene": "Sirene",
    "radio": "Rádio",
    "estepe": "Estepe",
    "macaco": "Macaco",
    "triangulo": "Triângulo",
    "retrovisor_direito": "Retrovisor D",
    "retrovisor_esquerdo": "Retrovisor E",
    "limpador_de_para_brisa": "Limpador",
    "lanterna": "Lanterna",
    "freio": "Freio"
  };
}

function itemKeyToName_(key) {
  const items = getActiveChecklistItems_();
  const item = items.find(i => i.key === key);
  return item ? item.nome : key.replace(/_/g, " ");
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (id) return SpreadsheetApp.openById(id);

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error("Execute configurarSistema() primeiro.");
  return active;
}

function validateRequiredSheets_(ss) {
  Object.keys(SIGVTR.SHEETS).forEach(function(key) {
    const name = SIGVTR.SHEETS[key];
    if (!ss.getSheetByName(name)) throw new Error("Aba obrigatória não encontrada: " + name);
  });
}


/**
 * Libera somente uma fotografia do SIGVTR para leitura por link.
 * A pasta continua privada; apenas o arquivo fotográfico recebe VIEW.
 * Mantém a resource key do Google Drive quando ela existir.
 */
function prepareSigvtrPhotoForLinkAccess_(file) {
  if (!file) throw new Error("Arquivo de fotografia não informado.");

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (error) {
    throw new Error(
      "Não foi possível liberar a fotografia para visualização por link. " +
      "Verifique se a conta proprietária permite compartilhamento 'qualquer pessoa com o link'. " +
      (error && error.message ? error.message : "")
    );
  }

  return buildSigvtrDriveViewUrl_(file);
}

/** Gera link canônico do Drive preservando resource key quando exigida. */
function buildSigvtrDriveViewUrl_(file) {
  const id = String(file.getId() || "").trim();
  if (!id) return String(file.getUrl() || "");

  let key = "";
  try { key = String(file.getResourceKey() || "").trim(); } catch (_) {}

  return "https://drive.google.com/file/d/" + encodeURIComponent(id) +
    "/view?usp=drivesdk" +
    (key ? "&resourcekey=" + encodeURIComponent(key) : "");
}

/** Extrai ID de links do Drive usados historicamente no SIGVTR. */
function extractSigvtrDriveFileId_(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  const patterns = [
    /\/d\/([A-Za-z0-9_-]{10,})/,
    /[?&]id=([A-Za-z0-9_-]{10,})/,
    /open\?id=([A-Za-z0-9_-]{10,})/
  ];
  for (let i = 0; i < patterns.length; i++) {
    const match = s.match(patterns[i]);
    if (match) return match[1];
  }
  return /^[A-Za-z0-9_-]{10,}$/.test(s) ? s : "";
}

/**
 * Migração manual e idempotente das fotos já registradas na aba FOTOS.
 * NÃO percorre a pasta raiz e NÃO altera documentos fora do índice FOTOS.
 * Pode ser executada novamente com segurança.
 */
function liberarAcessoFotosExistentesSIGVTR() {
  const ss = getSpreadsheet_();
  const sheet = requireSheet_(ss, SIGVTR.SHEETS.PHOTOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return {success:true, processadas:0, liberadas:0, jaLiberadas:0, falhas:0, mensagem:"Nenhuma fotografia cadastrada."};
  }

  const headers = getHeaders_(sheet).map(function(h){ return String(h).trim(); });
  const linkIndex = headers.indexOf("Link Drive");
  if (linkIndex < 0) throw new Error("Cabeçalho 'Link Drive' não encontrado na aba FOTOS.");

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  let processadas = 0, liberadas = 0, jaLiberadas = 0, falhas = 0;
  const erros = [];

  values.forEach(function(row, idx) {
    const originalUrl = String(row[linkIndex] || "").trim();
    const fileId = extractSigvtrDriveFileId_(originalUrl);
    if (!fileId) return;
    processadas++;

    try {
      const file = DriveApp.getFileById(fileId);
      const alreadyPublic =
        file.getSharingAccess() === DriveApp.Access.ANYONE_WITH_LINK &&
        file.getSharingPermission() === DriveApp.Permission.VIEW;

      const canonicalUrl = prepareSigvtrPhotoForLinkAccess_(file);
      if (canonicalUrl && canonicalUrl !== originalUrl) {
        sheet.getRange(idx + 2, linkIndex + 1).setValue(canonicalUrl);
      }

      if (alreadyPublic) jaLiberadas++;
      else liberadas++;
    } catch (error) {
      falhas++;
      if (erros.length < 20) {
        erros.push({linha: idx + 2, idArquivo: fileId, erro: String(error && error.message || error)});
      }
    }
  });

  return {
    success: falhas === 0,
    processadas: processadas,
    liberadas: liberadas,
    jaLiberadas: jaLiberadas,
    falhas: falhas,
    erros: erros
  };
}

function getRootFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("ROOT_FOLDER_ID");

  if (id) {
    try { return DriveApp.getFolderById(id); } catch (_) {}
  }

  const folders = DriveApp.getFoldersByName(SIGVTR.ROOT_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(SIGVTR.ROOT_FOLDER_NAME);
  props.setProperty("ROOT_FOLDER_ID", folder.getId());
  return folder;
}

function childFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(String);
}

function appendByHeaders_(sheet, headers, values) {
  appendRowsByHeaders_(sheet, headers, [values]);
}

/**
 * Insere uma ou várias linhas em uma única operação no Google Sheets.
 * Reduz chamadas repetidas a appendRow() e melhora o tempo de resposta.
 */
function appendRowsByHeaders_(sheet, headers, valuesList) {
  if (!sheet) throw new Error("Aba de destino não encontrada.");
  if (!Array.isArray(headers) || !headers.length) {
    throw new Error("A aba " + sheet.getName() + " não possui cabeçalhos válidos.");
  }
  if (!Array.isArray(valuesList) || !valuesList.length) return;

  const rows = valuesList.map(function(values) {
    return headers.map(function(header) {
      return Object.prototype.hasOwnProperty.call(values, header)
        ? values[header]
        : "";
    });
  });

  sheet
    .getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length)
    .setValues(rows);
}

function requireSheet_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Aba obrigatória não encontrada: " + sheetName);
  return sheet;
}

function requireHeaders_(sheet, requiredHeaders) {
  const headers = getHeaders_(sheet).map(function(header) {
    return String(header).trim();
  });

  const missing = requiredHeaders.filter(function(header) {
    return headers.indexOf(header) === -1;
  });

  if (missing.length) {
    throw new Error(
      "Cabeçalho(s) ausente(s) na aba " + sheet.getName() + ": " + missing.join(", ")
    );
  }

  return headers;
}

function valueByHeader_(headers, row, header) {
  const index = headers.indexOf(header);
  return index >= 0 ? row[index] : "";
}

function makeProtocol_(date) {
  return "VTR-" +
    Utilities.formatDate(date, SIGVTR.TIMEZONE, "yyyyMMdd-HHmmss") +
    "-" + Math.floor(1000 + Math.random() * 9000);
}

function normalizeKey_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function sanitizeFilename_(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
