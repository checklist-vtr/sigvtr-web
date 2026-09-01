/******************************************************************
 * SIGVTR - Checklist Mobile
 * Arquivo: Complemento_Mobile_v4.gs
 * Versão do pacote: 1.20.25-RC1
 * Checklist do condutor simplificado e avarias persistentes.
 ******************************************************************/
function doPost(e){
  let payload;
  try{
    if(!e||!e.postData||!String(e.postData.contents||"").trim())throw new Error("Requisição sem conteúdo.");
    try{payload=JSON.parse(e.postData.contents);}catch(_){throw new Error("JSON inválido na requisição.");}
    const action=String(payload.action||"").trim(),data=payload.data||{},token=String(payload.token||"");

    // Autenticação: estas rotas gerenciam o próprio LockService quando necessário.
    if(action==="adminLogin")return json_(adminLogin_(data));
    if(action==="adminValidarSessao")return json_({success:true,data:adminSessionInfo_(token)});
    if(action==="adminLogout")return json_({success:true,data:adminLogout_(token)});
    if(action==="adminAlterarMinhaSenha")return json_({success:true,data:adminChangePassword_(token,data)});
    if(action==="adminListarUsuarios")return json_({success:true,data:adminListUsers_(token)});
    if(action==="adminSalvarUsuario")return json_({success:true,data:adminUpsertUser_(token,data)});
    if(action==="adminRedefinirSenha")return json_({success:true,data:adminResetPassword_(token,data)});
    if(action==="adminAtivarDesativarUsuario")return json_({success:true,data:adminSetUserActive_(token,data)});
    if(action==="adminEncerrarSessoes")return json_({success:true,data:adminEndUserSessions_(token,data)});

    // Controle da Guarda: confirmação pública recebe SOMENTE token opaco.
    // A leitura pública não usa sessão; a confirmação pública passa pelo lock geral abaixo.
    const guardaPublicAction=(action==="guardaPublicoTokenInfo"||action==="guardaPublicoConfirmarRetirada"||action==="guardaPublicoConfirmarDevolucao");
    if(action==="guardaPublicoTokenInfo")return json_({success:true,data:getGuardPublicTokenInfo_(data)});

    // Demais ações da Guarda reutilizam a sessão administrativa existente, sem token na URL.
    let guardaRequestCtx=null;
    if(action.indexOf("guarda")===0&&!guardaPublicAction){
      guardaRequestCtx=guardRequireOperator_(token);
      const guardaUser=guardaRequestCtx.user;
      if(action==="guardaContexto")return json_({success:true,data:getGuardContext_(guardaUser)});
      if(action==="guardaListarViaturas")return json_({success:true,data:{viaturas:getGuardVehicles_()}});
      if(action==="guardaPesquisarMilitar")return json_({success:true,data:{militares:searchGuardMilitary_(data.query||data.q||"",data.limit||20)}});
      if(action==="guardaPrepararRetirada")return json_({success:true,data:prepareGuardWithdrawal_(data)});
      if(action==="guardaStatusMovimentacao")return json_({success:true,data:getGuardMovementStatus_(data)});
      if(action==="guardaPreviaFechamento")return json_({success:true,data:getGuardClosePreview_(data)});
      if(action==="guardaListarMovimentacoes")return json_({success:true,data:{movimentacoes:listGuardShiftMovements_()}});
    }

    // Consultas administrativas agora também usam POST para que o token nunca vá para a URL.
    // A autorização é calculada uma única vez e reutilizada se a ação for de escrita.
    let adminRequestCtx=null;
    if(action.indexOf("admin")===0){
      const passiveAdminAction=(action==='adminAlertasRecentes'||action==='adminConsumirNotificacoesNovas'||data.passive===true||String(data.passive||'')==='1');
      adminRequestCtx=passiveAdminAction?adminAuthorize_(token,action,false,true):adminAuthorize_(token,action);
      const adminReadCtx=adminRequestCtx;
      if(action==="adminDashboard")return json_({success:true,data:getAdminDashboard_(data)});
      if(action==="adminAlertas")return json_({success:true,data:getAdminAlerts_(data)});
      if(action==="adminAlertasRecentes")return json_({success:true,data:getAdminRealtimeAlerts_(data)});
      if(action==="adminChecklists")return json_({success:true,data:getAdminChecklists_(data)});
      if(action==="adminChecklistDetalhe")return json_({success:true,data:getAdminChecklistDetail_(String(data.id||""))});
      if(action==="adminAvarias")return json_({success:true,data:getAdminDamages_(data)});
      if(action==="adminAvariaDetalhe")return json_({success:true,data:getAdminDamageDetail_(String(data.id||""))});
      if(action==="adminViaturas")return json_({success:true,data:getAdminVehicles_(data)});
      if(action==="adminViaturaDetalhe")return json_({success:true,data:getAdminVehicleDetail_(String(data.id||""),String(data.prefixo||""))});
      if(action==="adminHistoricoViatura")return json_({success:true,data:getAdminVehicleHistory_(String(data.prefixo||""))});
      if(action==="adminBuscaGlobal")return json_({success:true,data:globalAdminSearch_(data)});
      if(action==="adminRelatorios")return json_({success:true,data:getAdminReports_(data)});
      if(action==="adminAiAsk")return json_({success:true,data:adminAiAsk_(data,adminReadCtx.user)});
      if(action==="adminCapacidade")return json_({success:true,data:getAdminCapacityStatus_()});
      if(action==="adminCartoes")return json_({success:true,data:getAdminCards_(adminReadCtx.user)});
    }

    const lock=LockService.getScriptLock();let acquired=false;
    try{
      lock.waitLock(30000);acquired=true;
      if(action==="salvarChecklistFiscal"){
        const fiscalData=data;fiscalData.tipoChecklist="FISCAL";fiscalData.origemAplicacao="FISCAL_WEB";
        return json_(saveMobileWithdrawal_(fiscalData,"FISCAL"));
      }
      if(action==="salvarRetiradaMobile"){
        const driverData=data;driverData.tipoChecklist="CONDUTOR";driverData.origemAplicacao="CONDUTOR_WEB";
        return json_(saveMobileWithdrawal_(driverData,"CONDUTOR"));
      }
      if(action==="salvarRetirada")return json_(saveWithdrawal_(data));

      if(action==="guardaPublicoConfirmarRetirada")return json_({success:true,data:confirmGuardWithdrawalPublic_(data)});
      if(action==="guardaPublicoConfirmarDevolucao")return json_({success:true,data:confirmGuardReturnPublic_(data)});

      if(action.indexOf("guarda")===0&&!guardaPublicAction){
        const guardaWriteCtx=guardaRequestCtx||guardRequireOperator_(token);
        if(action==="guardaIniciarTurno")return json_({success:true,data:openGuardShift_(guardaWriteCtx.user)});
        if(action==="guardaIniciarNovoTurno")return json_({success:true,data:openGuardShift_(guardaWriteCtx.user,{forceNew:true})});
        if(action==="guardaSalvarMilitar")return json_({success:true,data:{militar:saveGuardMilitary_(data)}});
        if(action==="guardaCriarRetirada")return json_({success:true,data:createGuardWithdrawal_(data,guardaWriteCtx.user)});
        if(action==="guardaIniciarDevolucao")return json_({success:true,data:startGuardReturn_(data,guardaWriteCtx.user)});
        if(action==="guardaFecharTurno")return json_({success:true,data:closeGuardShift_(data,guardaWriteCtx.user)});
        if(action==="guardaEncerrarTurnoPendente")return json_({success:true,data:closePendingGuardShift_(data,guardaWriteCtx.user)});
      }

      if(action.indexOf("admin")===0){
        const adminWriteCtx=adminRequestCtx||adminAuthorize_(token,action);
        if(action==="adminAtualizarStatusAlerta")return json_({success:true,data:updateAdminAlertStatus_(data)});
        if(action==="adminConsumirNotificacoesNovas")return json_({success:true,data:consumeAdminNotifications_(data)});
        if(action==="adminSalvarViatura"){
          const vehicleData=Object.assign({},data,{
            admin:String(adminWriteCtx.user.name||adminWriteCtx.user.login||"Administrador"),
            adminId:String(adminWriteCtx.user.id||adminWriteCtx.user.login||""),
            adminPerfil:String(adminWriteCtx.user.role||""),
            origemStatus:"EDICAO_INDIVIDUAL"
          });
          return json_({success:true,data:saveAdminVehicle_(vehicleData)});
        }
        if(action==="adminRegistrarRevisaoViatura"){
          const reviewData=Object.assign({},data,{admin:String(adminWriteCtx.user.name||adminWriteCtx.user.login||"Administrador")});
          return json_({success:true,data:registerAdminVehicleReview_(reviewData)});
        }
        if(action==="adminImportarFrotaOficial"){
          const importData=Object.assign({},data,{admin:String(adminWriteCtx.user.name||adminWriteCtx.user.login||"Administrador"),adminId:String(adminWriteCtx.user.id||adminWriteCtx.user.login||""),adminPerfil:String(adminWriteCtx.user.role||""),origemStatus:"IMPORTACAO_FROTA_OFICIAL"});
          return json_({success:true,data:importOfficialFleet_(importData)});
        }
        if(action==="adminAtualizarViaturasEmMassa"){
          const bulkData=Object.assign({},data,{admin:String(adminWriteCtx.user.name||adminWriteCtx.user.login||"Administrador"),adminId:String(adminWriteCtx.user.id||adminWriteCtx.user.login||""),adminPerfil:String(adminWriteCtx.user.role||"")});
          return json_({success:true,data:updateAdminVehiclesBulk_(bulkData)});
        }
        if(action==="adminAtualizarAvaria")return json_({success:true,data:updateAdminDamage_(data)});
        if(action==="adminGerarPacoteArquivamento")return json_({success:true,data:generateArchiveDataPackage_(data)});
        if(action==="adminConfirmarArquivoFisico")return json_({success:true,data:confirmPhysicalArchive_(data)});
        if(action==="adminSalvarCartao")return json_({success:true,data:saveAdminCard_(data,adminWriteCtx.user)});
      }
      throw new Error("Ação não reconhecida.");
    }finally{if(acquired)try{lock.releaseLock();}catch(_){}}
  }catch(error){
    console.error(error);
    const code=String(error&&error.message||"");
    const aiSafe=(typeof aiPublicErrorMessage_==="function")?aiPublicErrorMessage_(code):"";
    const safe=(code==="FORBIDDEN")?"Acesso negado.":(/^SESSION_/.test(code)?"Sessão inválida ou expirada.":(aiSafe||(error&&error.message?error.message:"Erro interno no SIGVTR.")));
    return json_({success:false,code:code,message:safe});
  }
}
function saveMobileWithdrawal_(input,expectedType){
  const data=sanitizeMobileWithdrawalData_(input);
  expectedType=sanitizeChecklistType_(expectedType||data.tipoChecklist);
  if(data.tipoChecklist!==expectedType)throw new Error("Tipo de checklist divergente da rota de envio.");
  validateMobileWithdrawal_(data);
  const ss=getSpreadsheet_(),existing=findMobileWithdrawalByRequestId_(ss,data.idRequisicao);
  if(existing){
    if(existing.tipoChecklist&&existing.tipoChecklist!==expectedType)throw new Error("O identificador desta requisição já pertence a um Checklist do "+(existing.tipoChecklist==="FISCAL"?"Fiscal":"Condutor")+". Gere uma nova requisição antes de reenviar.");
    const confirmed=confirmMobileWithdrawalByRequestId_(data.idRequisicao);
    return confirmed&&confirmed.found?confirmed:{success:true,id:existing.id,protocolo:existing.protocolo,status:existing.status,tipoChecklist:expectedType,fotosSalvas:existing.fotosSalvas||0,novasAvarias:existing.novasAvarias||0,repetido:true};
  }
  const now=new Date(),idWithdrawal="RET-"+Utilities.getUuid(),protocol=makeProtocol_(now);
  const vehicle=getOrCreateVehicleByPrefixMobile_(data.prefixo,Number(data.kmInicial));
  const photoRecords=saveMobilePhotos_(data.fotos,data.prefixo,now,idWithdrawal,protocol);
  const nonCompliant=Object.keys(data.itens).filter(function(k){return data.itens[k]==="nao";});
  const status=nonCompliant.length?"COM ALTERAÇÃO":"SEM ALTERAÇÃO";
  appendMobileWithdrawal_(ss,{idWithdrawal:idWithdrawal,protocol:protocol,data:data,vehicle:vehicle,now:now,status:status,photoCount:photoRecords.length});

  const known=data.avariasConhecidas||[];
  const knownKeys=known.map(function(d){return normalizeKey_(d.itemKey||d.item||"");}).filter(Boolean);
  const databaseKeys=getPendingDamageKeysByVehicleIdMobile_(ss,vehicle.id||"");
  const newDamageEntries=[];
  nonCompliant.forEach(function(k){
    if(isMultipleAlterationKey_(k)){
      (data.alteracoesMultiplas[k]||[]).forEach(function(entry,index){newDamageEntries.push({key:k,item:mobileItemName_(k),description:entry.descricao,photoType:entry.fotoTipo,occurrence:index+1});});
      return;
    }
    const normalized=normalizeKey_(k);
    if(knownKeys.indexOf(normalized)===-1&&databaseKeys.indexOf(normalizeKey_(mobileItemName_(k)))===-1)newDamageEntries.push({key:k,item:mobileItemName_(k),description:data.descricoesAlteracoes[k]||"Item marcado com alteração.",photoType:"avaria_"+k,occurrence:1});
  });
  appendMobileDamages_(ss,{idWithdrawal:idWithdrawal,data:data,vehicle:vehicle,entries:newDamageEntries,now:now});
  // O alerta é criado logo após a persistência principal. Assim, mesmo que uma
  // operação secundária demore, o Painel Administrativo recebe a ocorrência.
  const alertResult=createAlertsForMobileWithdrawal_({idWithdrawal:idWithdrawal,data:data,vehicle:vehicle,now:now,status:status},newDamageEntries)||{};
  registerKnownDamageEventsMobile_(ss,{damages:known,idWithdrawal:idWithdrawal,idVtr:vehicle.id||"",rg:data.rg,km:data.kmInicial,condutor:data.condutor,now:now});
  appendMobilePhotos_(ss,photoRecords,idWithdrawal,now);
  appendLog_(ss,{idUsuario:"",action:"CHECKLIST "+data.tipoChecklist,referenceId:idWithdrawal,description:"Checklist "+data.tipoChecklist.toLowerCase()+" "+status+" - "+data.prefixo+" - "+protocol,device:data.dispositivo||{},result:"SUCESSO",now:now});
  if(vehicle.id)updateVehicleKm_(ss,vehicle.id,Number(data.kmInicial));
  invalidateAdminSearchCache_();
  return {success:true,id:idWithdrawal,protocolo:protocol,status:status,tipoChecklist:data.tipoChecklist,backendVersion:"1.20.1-RC1",fotosSalvas:photoRecords.length,novasAvarias:newDamageEntries.length,novosItens:newDamageEntries.map(function(entry){return entry.item;}),idAlerta:alertResult.idAlerta||""};
}
function sanitizeMobileWithdrawalData_(input){
  if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Dados do checklist não informados.");
  const data={};data.tipoChecklist=sanitizeChecklistType_(input.tipoChecklist);data.origemAplicacao=sanitizeApplicationOrigin_(input.origemAplicacao,data.tipoChecklist);data.idRequisicao=sanitizeRequestId_(input.idRequisicao);data.prefixo=sanitizeVehiclePrefix_(input.prefixo);data.dataCliente=sanitizeDateText_(input.dataCliente);
  data.condutor=sanitizePersonName_(input.condutor,80);data.postoGraduacao=sanitizeRank_(input.postoGraduacao);data.rg=sanitizeDigits_(input.rg,20,"RG");data.kmInicial=sanitizeKm_(input.kmInicial);data.turno=sanitizeMobileShift_(input.turno);data.operacaoOutro=sanitizeOtherOperation_(input.operacaoOutro,data.turno);data.combustivel=sanitizeFuel_(input.combustivel);
  data.itens=sanitizeMobileItems_(input.itens);data.descricoesAlteracoes=sanitizeMobileDescriptions_(input.descricoesAlteracoes,data.itens);data.alteracoesMultiplas=sanitizeMultipleAlterations_(input.alteracoesMultiplas,data.itens);
  data.avariasConhecidas=sanitizeKnownDamages_(input.avariasConhecidas);data.fotos=sanitizePhotoMetadata_(input.fotos);normalizeLegacyMultipleAlterations_(data);data.dispositivo=sanitizeDeviceData_(input.dispositivo);return data;
}
function sanitizeChecklistType_(v){const t=String(v||"CONDUTOR").trim().toUpperCase();if(["CONDUTOR","FISCAL"].indexOf(t)<0)throw new Error("Tipo de checklist inválido.");return t;}
function sanitizeApplicationOrigin_(v,type){const expected=type==="FISCAL"?"FISCAL_WEB":"CONDUTOR_WEB",origin=String(v||expected).trim().toUpperCase();if(origin!==expected)throw new Error("Origem da aplicação divergente do tipo de checklist.");return origin;}
function sanitizeRequestId_(v){const t=String(v||"").trim();if(!/^[A-Za-z0-9-]{10,100}$/.test(t))throw new Error("Identificador da requisição inválido.");return t;}
function findMobileWithdrawalByRequestId_(ss,requestId){
  const sheet=requireSheet_(ss,SIGVTR.SHEETS.WITHDRAWALS);if(sheet.getLastRow()<2)return null;
  const data=sheet.getDataRange().getValues(),headers=data.shift().map(function(h){return String(h).trim();}),jsonIndex=headers.indexOf("ITENS_JSON"),idIndex=headers.indexOf("ID_RETIRADA"),protocolIndex=headers.indexOf("Protocolo"),statusIndex=headers.indexOf("Status"),typeIndex=headers.indexOf("Tipo Checklist");
  if(jsonIndex<0)return null;
  for(let i=data.length-1;i>=0;i--){
    const raw=String(data[i][jsonIndex]||"");if(raw.indexOf(requestId)===-1)continue;
    try{const parsed=JSON.parse(raw);if(parsed.idRequisicao===requestId){const type=sanitizeChecklistType_(parsed.tipoChecklist||(typeIndex>=0?data[i][typeIndex]:"CONDUTOR"));return{id:idIndex>=0?data[i][idIndex]:"",protocolo:protocolIndex>=0?data[i][protocolIndex]:"",status:statusIndex>=0?data[i][statusIndex]:"",tipoChecklist:type,fotosSalvas:0,novasAvarias:0};}}catch(_){}
  }
  return null;
}
function confirmMobileWithdrawalByRequestId_(requestId){
  const safe=sanitizeRequestId_(requestId),ss=getSpreadsheet_(),sheet=requireSheet_(ss,SIGVTR.SHEETS.WITHDRAWALS);
  if(sheet.getLastRow()<2)return {found:false};
  const values=sheet.getDataRange().getValues(),headers=values.shift().map(function(h){return String(h).trim();});
  const idx={};headers.forEach(function(h,i){idx[h]=i;});
  const jsonIndex=idx["ITENS_JSON"];if(jsonIndex===undefined)return {found:false};
  for(let i=values.length-1;i>=0;i--){
    const raw=String(values[i][jsonIndex]||"");if(raw.indexOf(safe)===-1)continue;
    try{
      const parsed=JSON.parse(raw);if(parsed.idRequisicao!==safe)continue;
      const row=values[i],id=optionalCell_(row,idx,"ID_RETIRADA")||"",protocol=optionalCell_(row,idx,"Protocolo")||"",status=optionalCell_(row,idx,"Status")||"";
      const idVtr=optionalCell_(row,idx,"ID_VTR")||"",vehicle=findVehicleByIdAdminSafe_(ss,idVtr),prefix=parsed.prefixo||vehicle.prefixo||"";
      const alertId=createAdminAlert_({tipo:"CHECKLIST",tipoChecklist:String(parsed.tipoChecklist||optionalCell_(row,idx,"Tipo Checklist")||"CONDUTOR").toUpperCase(),idReferencia:id,idVtr:idVtr,prefixo:prefix,condutor:optionalCell_(row,idx,"Motorista")||"",postoGraduacao:optionalCell_(row,idx,"Posto/Graduação")||parsed.postoGraduacao||"",rg:optionalCell_(row,idx,"RG PMPA")||"",km:optionalCell_(row,idx,"KM Inicial")||0,titulo:"Novo Checklist do "+(String(parsed.tipoChecklist||optionalCell_(row,idx,"Tipo Checklist")||"CONDUTOR").toUpperCase()==="FISCAL"?"Fiscal":"Condutor"),descricao:"Checklist do "+String(parsed.tipoChecklist||optionalCell_(row,idx,"Tipo Checklist")||"CONDUTOR").toLowerCase()+" concluído com status "+status+".",now:optionalCell_(row,idx,"Data/Hora Registro")||new Date()});
      const confirmedType=String(parsed.tipoChecklist||optionalCell_(row,idx,"Tipo Checklist")||"").trim().toUpperCase();
      return {found:true,success:true,id:id,protocolo:protocol,status:status,tipoChecklist:confirmedType==="FISCAL"?"FISCAL":"CONDUTOR",fotosSalvas:0,novasAvarias:0,repetido:true,confirmacaoRecuperada:true,idAlerta:alertId||""};
    }catch(_){}
  }
  return {found:false};
}
function findVehicleByIdAdminSafe_(ss,idVtr){
  const sh=ss.getSheetByName(SIGVTR.SHEETS.VEHICLES);if(!sh||sh.getLastRow()<2)return {prefixo:""};
  const data=sh.getDataRange().getValues(),heads=data.shift().map(function(h){return String(h).trim();}),ii=heads.indexOf("ID-VTR"),pi=heads.indexOf("Prefixo");
  for(let i=0;i<data.length;i++)if(String(data[i][ii]||"")===String(idVtr||""))return {prefixo:pi>=0?data[i][pi]:""};
  return {prefixo:""};
}
function getPendingDamageKeysByVehicleIdMobile_(ss,idVtr){if(!idVtr)return[];const sheet=requireSheet_(ss,SIGVTR.SHEETS.DAMAGES);if(sheet.getLastRow()<2)return[];const data=sheet.getDataRange().getValues(),headers=data.shift().map(function(h){return String(h).trim();}),idIndex=headers.indexOf("ID_VTR"),itemIndex=headers.indexOf("Item"),statusIndex=headers.indexOf("Situação");if(idIndex<0||itemIndex<0||statusIndex<0)return[];return data.filter(function(row){const status=String(row[statusIndex]||"").trim().toUpperCase();return String(row[idIndex]||"")===String(idVtr)&&(status==="PENDENTE"||status==="EM MANUTENÇÃO");}).map(function(row){return normalizeKey_(row[itemIndex]);}).filter(Boolean);}
function sanitizeMobileItems_(items){if(!items||typeof items!=="object"||Array.isArray(items))return {};const safe={};Object.keys(items).forEach(function(k){const key=sanitizeItemKey_(k),v=String(items[k]||"").trim();if(!key||["ok","nao","na"].indexOf(v)===-1)throw new Error("Item de checklist inválido.");safe[key]=v;});return safe;}
function sanitizeMobileDescriptions_(descriptions,items){const safe={};if(!descriptions||typeof descriptions!=="object"||Array.isArray(descriptions))return safe;Object.keys(descriptions).forEach(function(k){const key=sanitizeItemKey_(k);if(!key||!Object.prototype.hasOwnProperty.call(items,key))throw new Error("Descrição vinculada a item inválido.");safe[key]=sanitizeOperationalDescription_(descriptions[k],300);});return safe;}
function isMultipleAlterationKey_(key){return ["outras_alteracoes_externas","outras_alteracoes_internas","outras_alteracoes_mecanica"].indexOf(String(key||""))>=0;}
function normalizeLegacyMultipleAlterations_(data){["outras_alteracoes_externas","outras_alteracoes_internas","outras_alteracoes_mecanica"].forEach(function(key){if(data.itens[key]!=="nao"||(data.alteracoesMultiplas[key]||[]).length)return;const descricao=String(data.descricoesAlteracoes[key]||"").trim(),fotoTipo="avaria_"+key;if(descricao&&data.fotos.some(function(photo){return photo.tipo===fotoTipo;}))data.alteracoesMultiplas[key]=[{id:"1",descricao:descricao,fotoTipo:fotoTipo,legacy:true}];});}
function sanitizeMultipleAlterations_(input,items){const safe={};if(input===undefined||input===null)return safe;if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Estrutura de múltiplas alterações inválida.");Object.keys(input).forEach(function(rawKey){const key=sanitizeItemKey_(rawKey);if(!key||!isMultipleAlterationKey_(key)||!Object.prototype.hasOwnProperty.call(items,key))throw new Error("Múltipla alteração vinculada a item inválido.");const list=input[rawKey];if(!Array.isArray(list)||!list.length)throw new Error("Informe ao menos uma ocorrência em "+mobileItemName_(key)+".");if(list.length>50)throw new Error("Quantidade de alterações acima do permitido em "+mobileItemName_(key)+".");const ids={};safe[key]=list.map(function(entry,index){if(!entry||typeof entry!=="object"||Array.isArray(entry))throw new Error("Ocorrência de alteração inválida.");const id=String(entry.id||index+1).trim();if(!/^\d{1,6}$/.test(id)||ids[id])throw new Error("Identificador de ocorrência inválido.");ids[id]=true;const descricao=sanitizeOperationalDescription_(entry.descricao,300),fotoTipo=String(entry.fotoTipo||"").trim(),expected="avaria_"+key+"_"+id;if(fotoTipo!==expected)throw new Error("Fotografia vinculada incorretamente à ocorrência.");return{id:id,descricao:descricao,fotoTipo:fotoTipo};});});return safe;}
function sanitizePhotoMetadata_(photos){if(!Array.isArray(photos))return [];return photos.map(function(p){if(!p||typeof p!=="object")throw new Error("Fotografia inválida.");const tipo=String(p.tipo||"").trim();if(!/^[a-z0-9_]{1,120}$/.test(tipo)||!String(p.data||"").trim())throw new Error("Fotografia inválida.");return {tipo:tipo,name:sanitizeFilename_(p.name||"foto.jpg"),mimeType:/^image\/(jpeg|png|webp)$/.test(String(p.mimeType||""))?p.mimeType:"image/jpeg",data:String(p.data)};});}
function validateMobileWithdrawal_(data){
  ["prefixo","dataCliente","condutor","postoGraduacao","rg","kmInicial","turno","combustivel"].forEach(function(f){if(data[f]===undefined||data[f]===null||String(data[f]).trim()==="")throw new Error("Campo obrigatório ausente: "+f);});
  const required=["lataria_geral","vidros_para_brisas","iluminacao_externa","pneus_rodas","outras_alteracoes_externas","multimidia","ar_condicionado","painel_instrumentos","freio","buzina","sirene","xadrez","tapete","estepe","macaco","triangulo","chave_roda","outras_alteracoes_internas","nivel_oleo_motor","nivel_oleo_hidraulico","nivel_oleo_freio","nivel_fluido_arrefecimento","nivel_agua_limpador","outras_alteracoes_mecanica"];
  required.forEach(function(k){if(["ok","nao","na"].indexOf(data.itens[k])===-1)throw new Error("Item não avaliado: "+mobileItemName_(k));});
  ["lataria_geral","vidros_para_brisas","iluminacao_externa","pneus_rodas","outras_alteracoes_externas","multimidia","ar_condicionado","painel_instrumentos","freio","buzina","sirene","xadrez","tapete","estepe","outras_alteracoes_internas","nivel_oleo_motor","nivel_oleo_hidraulico","nivel_oleo_freio","nivel_fluido_arrefecimento","nivel_agua_limpador","outras_alteracoes_mecanica"].forEach(function(k){if(data.itens[k]==="na")throw new Error("O item obrigatório não aceita Não se aplica: "+mobileItemName_(k));});
  Object.keys(data.itens).forEach(function(k){if(data.itens[k]!=="nao")return;if(isMultipleAlterationKey_(k)){const list=data.alteracoesMultiplas[k]||[];if(!list.length)throw new Error("Informe ao menos uma ocorrência em: "+mobileItemName_(k));list.forEach(function(entry){if(!String(entry.descricao||"").trim())throw new Error("Descreva todas as ocorrências em: "+mobileItemName_(k));});}else if(!String(data.descricoesAlteracoes[k]||"").trim())throw new Error("Descreva a alteração do item: "+mobileItemName_(k));});
  const allowed=["continua","agravou","solicitar_verificacao"];data.avariasConhecidas.forEach(function(d){if(!d.idAvaria||allowed.indexOf(d.decisao)===-1)throw new Error("Confirme a situação de todas as avarias já registradas.");});
  const requiredPhotos=["painel_inicial","frontal","traseira","lado_esquerdo","lado_direito"];
  requiredPhotos.forEach(function(t){if(data.fotos.filter(function(p){return p.tipo===t;}).length!==1)throw new Error("Fotografia obrigatória ausente ou duplicada: "+t);});
  Object.keys(data.itens).filter(function(k){return data.itens[k]==="nao";}).forEach(function(k){if(isMultipleAlterationKey_(k)){(data.alteracoesMultiplas[k]||[]).forEach(function(entry){if(data.fotos.filter(function(p){return p.tipo===entry.fotoTipo;}).length!==1)throw new Error("Fotografia da ocorrência ausente: "+mobileItemName_(k));});}else if(data.fotos.filter(function(p){return p.tipo==="avaria_"+k;}).length!==1)throw new Error("Fotografia da alteração ausente: "+mobileItemName_(k));});
  if(data.fotos.length>60)throw new Error("Quantidade de fotografias acima do permitido.");
}
function sanitizeMobileShift_(v){
  var raw=String(v||"").trim().toUpperCase();
  var normalized=raw.normalize ? raw.normalize("NFD").replace(/[\u0300-\u036f]/g,"") : raw;
  normalized=normalized.replace(/[º°]/g,"O").replace(/\s+/g," ");
  var aliases={
    "TURNO_1":"1º TURNO",
    "1":"1º TURNO",
    "1O TURNO":"1º TURNO",
    "1 TURNO":"1º TURNO",
    "PRIMEIRO TURNO":"1º TURNO",
    "TURNO_2":"2º TURNO",
    "2":"2º TURNO",
    "2O TURNO":"2º TURNO",
    "2 TURNO":"2º TURNO",
    "SEGUNDO TURNO":"2º TURNO",
    "EXTRAORDINARIO":"EXTRAORDINÁRIO",
    "OUTROS":"OUTROS"
  };
  if(!aliases[normalized])throw new Error("Turno inválido.");
  return aliases[normalized];
}
function sanitizeRank_(v){var t=String(v||"").trim().toUpperCase();var map={SD:"SD",CB:"CB","3_SGT":"3º SGT","2_SGT":"2º SGT","1_SGT":"1º SGT",SUB_TEN:"SUB TEN","2_TEN":"2º TEN","1_TEN":"1º TEN",CAP:"CAP",MAJ:"MAJ",TEN_CEL:"TEN CEL",CEL:"CEL"};if(!map[t])throw new Error("Posto/Graduação inválido.");return map[t];}
function sanitizeOtherOperation_(v,turno){var t=normalizeSecureSpaces_(v);if(turno!=="OUTROS")return "";if(t.length<3||t.length>100||!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;()\/-]+$/.test(t))throw new Error("Informe corretamente a operação ou turno em Outros.");rejectSpreadsheetFormula_(t,"operação");return t;}
function sanitizeVehiclePrefix_(v){const p=String(v||"").trim().toUpperCase();if(isFixedFleetPrefix_(p))return p;return sanitizeDigits_(p,20,"prefixo externo");}
function isFixedFleetPrefix_(v){return /^50-(200[1-9]|201[0-9]|202[0-1])$/.test(String(v||"").trim().toUpperCase());}
function sanitizeDigits_(v,max,label){const t=String(v==null?"":v).trim();if(!/^\d+$/.test(t)||t.length>max)throw new Error("O campo "+label+" deve conter somente números.");return t;}
function sanitizeKm_(v){const t=String(v==null?"":v).trim();if(!/^\d{1,9}$/.test(t))throw new Error("O KM deve conter somente números inteiros.");return Number(t);}
function sanitizePersonName_(v,max){const t=normalizeSecureSpaces_(v);if(t.length<2||t.length>max||!/^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/.test(t))throw new Error("O nome de guerra deve conter somente letras e espaços.");rejectSpreadsheetFormula_(t,"nome de guerra");return t;}
function sanitizeFuel_(v){const t=String(v||"").trim().toUpperCase();if(["RESERVA","1/4","1/2","3/4","CHEIO"].indexOf(t)===-1)throw new Error("Nível de combustível inválido.");return t;}
function sanitizeOperationalDescription_(v,max){const t=normalizeSecureSpaces_(v);if(t.length<3||t.length>max||!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;()\/-]+$/.test(t))throw new Error("A descrição contém caracteres não permitidos.");rejectSpreadsheetFormula_(t,"descrição");return t;}
function sanitizeDateText_(v){const t=String(v||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(t))throw new Error("Data inválida.");return t;}
function sanitizeItemKey_(v){const t=String(v||"").trim();return /^[a-z0-9_]{1,120}$/.test(t)?t:"";}
function sanitizeKnownDamages_(items){if(!Array.isArray(items))return [];const allowed=["continua","agravou","solicitar_verificacao"];return items.map(function(i){if(!i||typeof i!=="object")throw new Error("Avaria conhecida inválida.");const id=String(i.idAvaria||"").trim(),dec=String(i.decisao||"").trim();if(!/^[A-Za-z0-9-]{1,100}$/.test(id)||allowed.indexOf(dec)===-1)throw new Error("Avaria conhecida inválida.");return {idAvaria:id,item:sanitizeOptionalOperationalText_(i.item,160),itemKey:sanitizeItemKey_(i.itemKey||normalizeKey_(i.item||"")),decisao:dec};});}
function sanitizeOptionalOperationalText_(v,max){const t=normalizeSecureSpaces_(v);if(!t)return "";if(t.length>max||!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;()\/-]+$/.test(t))throw new Error("Texto operacional inválido.");return t;}
function sanitizeDeviceData_(d){if(!d||typeof d!=="object"||Array.isArray(d))return {};const s={};["tipo","sistema","navegador","idioma","resolucao"].forEach(function(k){const v=String(d[k]||"").replace(/[\u0000-\u001F\u007F]/g,"").trim().slice(0,100);if(v&&/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;()_\/-]+$/.test(v))s[k]=v;});return s;}
function normalizeSecureSpaces_(v){return String(v==null?"":v).replace(/[\u0000-\u001F\u007F]/g," ").replace(/\s+/g," ").trim();}
function rejectSpreadsheetFormula_(v,label){if(/^[=+\-@]/.test(String(v||"").trim()))throw new Error("O campo "+label+" não pode iniciar com caractere de fórmula.");}
function findVehicleByPrefixMobile_(prefix){const normalized=String(prefix||"").trim().toUpperCase(),numeric=/^\d+$/.test(normalized)?String(Number(normalized)):"",sheet=requireSheet_(getSpreadsheet_(),SIGVTR.SHEETS.VEHICLES),data=sheet.getDataRange().getValues(),headers=data.shift().map(function(h){return String(h).trim();});requireHeaders_(sheet,["ID-VTR","Prefixo"]);const pi=headers.indexOf("Prefixo"),ii=headers.indexOf("ID-VTR"),ki=headers.indexOf("KM Atual"),si=headers.indexOf("Status");for(let i=0;i<data.length;i++){const stored=String(data[i][pi]).trim().toUpperCase(),storedNumeric=/^\d+$/.test(stored)?String(Number(stored)):"";if(stored===normalized||(numeric&&storedNumeric===numeric))return{id:data[i][ii]||"",prefixo:data[i][pi],kmAtual:ki>=0?data[i][ki]:"",status:si>=0?data[i][si]:"",found:true};}return{id:"",prefixo:normalized,found:false};}
function getOrCreateVehicleByPrefixMobile_(prefix,km){const normalized=sanitizeVehiclePrefix_(prefix),existing=findVehicleByPrefixMobile_(normalized);if(existing.id)return existing;const sheet=requireSheet_(getSpreadsheet_(),SIGVTR.SHEETS.VEHICLES),headers=requireHeaders_(sheet,["ID-VTR","Prefixo"]),fixed=isFixedFleetPrefix_(normalized),id=(fixed?"VTR-FIXA-":"VTR-EXT-")+Utilities.getUuid();const values={"ID-VTR":id,"Prefixo":normalized,"Placa":"","Modelo":fixed?"FROTA FIXA - CADASTRO PENDENTE":"VIATURA EXTERNA / RESERVA","Ano":"","Combustível":"","KM Atual":Number(km)||0,"Status":"ATIVO","Tipo":fixed?"FROTA FIXA":"EXTERNA / RESERVA","Origem":fixed?"20º BPM":"CONCESSIONÁRIA"};appendByHeaders_(sheet,headers,values);return{id:id,prefixo:normalized,created:true};}
function sincronizarFrotaFixa(){const created=[],existing=[];for(let n=2001;n<=2021;n++){const p="50-"+n,v=findVehicleByPrefixMobile_(p);if(v.id)existing.push(p);else{getOrCreateVehicleByPrefixMobile_(p,0);created.push(p);}}return{success:true,criadas:created,jaExistentes:existing};}
function appendMobileWithdrawal_(ss,c){const sheet=requireSheet_(ss,SIGVTR.SHEETS.WITHDRAWALS);ensureExtraWithdrawalColumns_(sheet);const headers=requireHeaders_(sheet,["ID_RETIRADA","ID_USUARIO","ID_VTR","Tipo_Retirada","KM Inicial","Fotos Obrigatórias","Status","Data/Hora Registro","Motorista","Posto/Graduação","RG PMPA","ITENS_JSON"]),v={};v["ID_RETIRADA"]=c.idWithdrawal;v["ID_USUARIO"]="";v["ID_VTR"]=c.vehicle.id||"";v["Tipo_Retirada"]="CHECKLIST "+c.data.tipoChecklist;v["KM Inicial"]=Number(c.data.kmInicial);v["Fotos Obrigatórias"]="SIM";v["Status"]=c.status;v["Data/Hora Registro"]=c.now;v["Motorista"]=c.data.condutor;v["Posto/Graduação"]=c.data.postoGraduacao;v["RG PMPA"]=c.data.rg;v["Combustível Inicial"]=c.data.combustivel;v["Turno"]=c.data.turno;v["Operação/Outros"]=c.data.operacaoOutro||"";v["Tipo Checklist"]=c.data.tipoChecklist;v["Observações"]=buildAlterationSummary_(c.data);v["Protocolo"]=c.protocol;v["Dispositivo"]=(c.data.dispositivo||{}).tipo||"";v["Navegador"]=(c.data.dispositivo||{}).navegador||"";v["ITENS_JSON"]=JSON.stringify({idRequisicao:c.data.idRequisicao,tipoChecklist:c.data.tipoChecklist,origemAplicacao:c.data.origemAplicacao,itens:c.data.itens,descricoes:c.data.descricoesAlteracoes,alteracoesMultiplas:c.data.alteracoesMultiplas||{},combustivel:c.data.combustivel,turno:c.data.turno,operacaoOutro:c.data.operacaoOutro,postoGraduacao:c.data.postoGraduacao,dataCliente:c.data.dataCliente,prefixo:c.data.prefixo});appendByHeaders_(sheet,headers,v);}
function appendMobileDamages_(ss,c){const entries=c.entries||[];if(!entries.length)return;const sheet=requireSheet_(ss,SIGVTR.SHEETS.DAMAGES),headers=requireHeaders_(sheet,["ID_AVARIA","ID_RETIRADA_DETECCAO","ID_VTR","Item","Descrição","Data Detecção","Situação"]),rows=entries.map(function(entry){return{"ID_AVARIA":"AVA-"+Utilities.getUuid(),"ID_RETIRADA_DETECCAO":c.idWithdrawal,"ID_RETIRADA_RESPONSAVEL":"","ID_VTR":c.vehicle.id||"","Item":entry.item||mobileItemName_(entry.key),"Descrição":entry.description||"Item marcado com alteração.","Data Detecção":c.now,"Situação":"PENDENTE","Data Solução":"","Posição/Local":entry.item||mobileItemName_(entry.key),"Observação Administração":""};});appendRowsByHeaders_(sheet,headers,rows);}
function saveMobilePhotos_(photos,prefix,date,idWithdrawal,protocol){const root=getRootFolder_(),year=childFolder_(root,Utilities.formatDate(date,SIGVTR.TIMEZONE,"yyyy")),month=childFolder_(year,Utilities.formatDate(date,SIGVTR.TIMEZONE,"MM")),vehicle=childFolder_(month,String(prefix).toUpperCase()),day=childFolder_(vehicle,Utilities.formatDate(date,SIGVTR.TIMEZONE,"yyyy-MM-dd")),record=childFolder_(day,protocol);return photos.map(function(p){const bytes=Utilities.base64Decode(p.data);if(bytes.length>6*1024*1024)throw new Error("Uma fotografia excede 6 MB.");const name=sanitizeFilename_(p.tipo+"_"+(p.name||"foto.jpg")),file=record.createFile(Utilities.newBlob(bytes,p.mimeType||"image/jpeg",name)),publicUrl=prepareSigvtrPhotoForLinkAccess_(file);return{id:"FOTO-"+Utilities.getUuid(),type:p.tipo,name:name,url:publicUrl,idWithdrawal:idWithdrawal};});}
function appendMobilePhotos_(ss,records,idWithdrawal,now){if(!records.length)return;const sheet=requireSheet_(ss,SIGVTR.SHEETS.PHOTOS),headers=requireHeaders_(sheet,["ID_FOTO","ID_RETIRADA","Tipo Foto","Nome Arquivo","Link Drive","Data"]),rows=records.map(function(r){return{"ID_FOTO":r.id,"ID_RETIRADA":idWithdrawal,"Tipo Foto":r.type,"Nome Arquivo":r.name,"Link Drive":r.url,"Data":now};});appendRowsByHeaders_(sheet,headers,rows);}
function buildAlterationSummary_(data){const parts=[];Object.keys(data.descricoesAlteracoes||{}).forEach(function(k){if(isMultipleAlterationKey_(k))return;parts.push(mobileItemName_(k)+": "+data.descricoesAlteracoes[k]);});Object.keys(data.alteracoesMultiplas||{}).forEach(function(k){(data.alteracoesMultiplas[k]||[]).forEach(function(entry,index){parts.push(mobileItemName_(k)+" — Alteração "+(index+1)+": "+entry.descricao);});});return parts.length?parts.join(" | "):"Sem novas alterações registradas.";}
function registerKnownDamageEventsMobile_(ss,c){if(!c.damages.length)return;const sheet=requireSheet_(ss,SIGVTR.SHEETS.EVENTS),headers=requireHeaders_(sheet,["ID_EVENTO","Data","Hora","Tipo do Evento","ID_RETIRADA","RG PMPA","ID_VTR","KM","Motivo","Observação","Status da VTR após Evento"]),labels={continua:"AVARIA JÁ REGISTRADA",agravou:"AGRAVAMENTO DE AVARIA",solicitar_verificacao:"SOLICITAÇÃO DE VERIFICAÇÃO DE AVARIA"},rows=c.damages.map(function(d){return{"ID_EVENTO":"EVT-"+Utilities.getUuid(),"Data":Utilities.formatDate(c.now,SIGVTR.TIMEZONE,"dd/MM/yyyy"),"Hora":Utilities.formatDate(c.now,SIGVTR.TIMEZONE,"HH:mm:ss"),"Tipo do Evento":labels[d.decisao],"ID_RETIRADA":c.idWithdrawal,"RG PMPA":c.rg,"Nome de Guerra":c.condutor,"ID_VTR":c.idVtr,"KM":c.km,"Motivo":"Situação informada pelo condutor no checklist","Observação":"ID da avaria: "+d.idAvaria+" | Item: "+d.item+" | Decisão: "+d.decisao,"Status da VTR após Evento":"COM AVARIA PENDENTE"};});appendRowsByHeaders_(sheet,headers,rows);}
function mobileItemName_(k){const m={lataria_geral:"Lataria Geral",vidros_para_brisas:"Vidros e Para-brisas",iluminacao_externa:"Iluminação Externa",pneus_rodas:"Pneus e Rodas",outras_alteracoes_externas:"Outras alterações externas",multimidia:"Multimídia",ar_condicionado:"Ar-condicionado",painel_instrumentos:"Painel de Instrumentos",freio:"Freio",buzina:"Buzina",sirene:"Sirene",xadrez:"Xadrez",tapete:"Tapete",estepe:"Estepe",macaco:"Macaco",triangulo:"Triângulo",chave_roda:"Chave de roda",outras_alteracoes_internas:"Outras alterações internas",nivel_oleo_motor:"Nível de óleo do motor",nivel_oleo_hidraulico:"Nível do óleo hidráulico",nivel_oleo_freio:"Nível do óleo de freio",nivel_fluido_arrefecimento:"Nível do fluido de arrefecimento",nivel_agua_limpador:"Nível da água do limpador do para-brisa",outras_alteracoes_mecanica:"Outras alterações mecânicas"};return m[k]||String(k).replace(/_/g," ");}
