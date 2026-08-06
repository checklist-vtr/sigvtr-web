/******************************************************************
 * SIGVTR - Limpeza Controlada da Base de Testes
 * Branch: feature/painel-administrativo-v1
 * Versão do pacote: 1.9.13
 *
 * ATENÇÃO: operação destrutiva e irreversível.
 * Preserva CONFIG, USUARIOS, VIATURAS e CHECKLIST_ITENS.
 * Remove registros operacionais, fotos e redefine o KM Atual.
 ******************************************************************/
function limparBaseDeTestesSIGVTR(confirmacao) {
  const FRASE_CONFIRMACAO = "LIMPAR BASE DE TESTES SIGVTR";
  if (String(confirmacao || "").trim() !== FRASE_CONFIRMACAO) {
    throw new Error(
      'Confirmação inválida. Execute limparBaseDeTestesSIGVTR("' +
      FRASE_CONFIRMACAO + '").'
    );
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = getSpreadsheet_();
    const resumo = {
      executadoEm: new Date(),
      abasLimpas: {},
      fotosEnviadasParaLixeira: 0,
      pastasEnviadasParaLixeira: 0,
      viaturasComKmRedefinido: 0
    };

    [
      SIGVTR.SHEETS.WITHDRAWALS,
      SIGVTR.SHEETS.EVENTS,
      SIGVTR.SHEETS.DAMAGES,
      SIGVTR.SHEETS.PHOTOS,
      SIGVTR.SHEETS.LOGS
    ].forEach(function(sheetName) {
      resumo.abasLimpas[sheetName] = clearSheetDataKeepingHeader_(ss, sheetName);
    });

    resumo.viaturasComKmRedefinido = resetVehicleCurrentKmForTests_(ss);

    const driveResult = clearSigvtrPhotoFolderForTests_();
    resumo.fotosEnviadasParaLixeira = driveResult.files;
    resumo.pastasEnviadasParaLixeira = driveResult.folders;

    appendCleanupAuditLog_(ss, resumo);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: "Base de testes limpa com sucesso.",
      resumo: resumo
    };
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function clearSheetDataKeepingHeader_(ss, sheetName) {
  const sheet = requireSheet_(ss, sheetName);
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) return 0;

  const rowsRemoved = lastRow - 1;
  sheet.getRange(2, 1, rowsRemoved, lastColumn).clearContent();
  return rowsRemoved;
}

function resetVehicleCurrentKmForTests_(ss) {
  const sheet = requireSheet_(ss, SIGVTR.SHEETS.VEHICLES);
  if (sheet.getLastRow() < 2) return 0;

  const headers = getHeaders_(sheet).map(function(header) {
    return String(header).trim();
  });
  const kmIndex = headers.indexOf("KM Atual");
  if (kmIndex < 0) return 0;

  const rowCount = sheet.getLastRow() - 1;
  sheet.getRange(2, kmIndex + 1, rowCount, 1).clearContent();
  return rowCount;
}

function clearSigvtrPhotoFolderForTests_() {
  const root = getRootFolder_();
  let files = 0;
  let folders = 0;

  const rootFiles = root.getFiles();
  while (rootFiles.hasNext()) {
    rootFiles.next().setTrashed(true);
    files++;
  }

  const childFolders = root.getFolders();
  while (childFolders.hasNext()) {
    childFolders.next().setTrashed(true);
    folders++;
  }

  return { files: files, folders: folders };
}

function appendCleanupAuditLog_(ss, resumo) {
  const sheet = requireSheet_(ss, SIGVTR.SHEETS.LOGS);
  const headers = getHeaders_(sheet);
  const now = new Date();

  appendByHeaders_(sheet, headers, {
    "ID_LOG": "LOG-" + Utilities.getUuid(),
    "Data": Utilities.formatDate(now, SIGVTR.TIMEZONE, "dd/MM/yyyy"),
    "Hora": Utilities.formatDate(now, SIGVTR.TIMEZONE, "HH:mm:ss"),
    "ID_USUARIO": "SISTEMA",
    "Ação": "LIMPEZA CONTROLADA DA BASE DE TESTES",
    "ID_REFERENCIA": "RESET-" + Utilities.getUuid(),
    "Descrição": JSON.stringify({
      abasLimpas: resumo.abasLimpas,
      fotosEnviadasParaLixeira: resumo.fotosEnviadasParaLixeira,
      pastasEnviadasParaLixeira: resumo.pastasEnviadasParaLixeira,
      viaturasComKmRedefinido: resumo.viaturasComKmRedefinido
    }),
    "Dispositivo": "APPS SCRIPT",
    "Navegador": "EDITOR",
    "Resultado": "SUCESSO"
  });
}
/*
function executarLimpezaBaseDeTestesSIGVTR() {
  return limparBaseDeTestesSIGVTR("LIMPAR BASE DE TESTES SIGVTR");
}
*/