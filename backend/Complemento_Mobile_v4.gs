/******************************************************************
 * SIGVTR - Checklist Mobile
 * Arquivo: Complemento_Mobile_v4.gs
 * Versão do pacote: 1.19.7-RC1
 * Checklist do condutor simplificado e avarias persistentes.
 ******************************************************************/
function doPost(e){
  const lock=LockService.getScriptLock();let acquired=false;
  try{lock.waitLock(30000);acquired=true;if(!e||!e.postData||!String(e.postData.contents||"").trim())throw new Error("Requisição sem conteúdo.");
    let payload;try{payload=JSON.parse(e.postData.contents);}catch(_){throw new Error("JSON inválido na requisição.");}
    const action=String(payload.action||"").trim();
    if(action==="salvarChecklistFiscal"){
      const fiscalData=payload.data||{};
      fiscalData.tipoChecklist="FISCAL";
      fiscalData.origemAplicacao="FISCAL_WEB";
      return json_(saveMobileWithdrawal_(fiscalData,"FISCAL"));
    }
    if(action==="salvarRetiradaMobile"){
      const driverData=payload.data||{};
      driverData.tipoChecklist="CONDUTOR";
      driverData.origemAplicacao="CONDUTOR_WEB";
      return json_(saveMobileWithdrawal_(driverData,"CONDUTOR"));
    }
    if(action==="salvarRetirada")return json_(saveWithdrawal_(payload.data||{}));
    if(action==="adminAtualizarStatusAlerta")return json_({success:true,data:updateAdminAlertStatus_(payload.data||{})});
    if(action==="adminSalvarViatura")return json_({success:true,data:saveAdminVehicle_(payload.data||{})});
    if(action==="adminRegistrarRevisaoViatura")return json_({success:true,data:registerAdminVehicleReview_(payload.data||{})});
    if(action==="adminImportarFrotaOficial")return json_({success:true,data:importOfficialFleet_(payload.data||{})});
    if(action==="adminAtualizarViaturasEmMassa")return json_({success:true,data:updateAdminVehiclesBulk_(payload.data||{})});
    if(action==="adminAtualizarAvaria")return json_({success:true,data:updateAdminDamage_(payload.data||{})});
    if(action==="adminGerarPacoteArquivamento")return json_({success:true,data:generateArchiveDataPackage_(payload.data||{})});
    if(action==="adminConfirmarArquivoFisico")return json_({success:true,data:confirmPhysicalArchive_(payload.data||{})});
    throw new Error("Ação não reconhecida.");
  }catch(error){console.error(error);return json_({success:false,message:error&&error.message?error.message:"Erro interno no SIGVTR."});}
  finally{if(acquired)try{lock.releaseLock();}catch(_){}}
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
  const newKeys=nonCompliant.filter(function(k){const normalized=normalizeKey_(k);return knownKeys.indexOf(normalized)===-1&&databaseKeys.indexOf(normalizeKey_(mobileItemName_(k)))===-1;});
  appendMobileDamages_(ss,{idWithdrawal:idWithdrawal,data:data,vehicle:vehicle,itemKeys:newKeys,now:now});
  // O alerta é criado logo após a persistência principal. Assim, mesmo que uma
  // operação secundária demore, o Painel Administrativo recebe a ocorrência.
  const alertResult=createAlertsForMobileWithdrawal_({idWithdrawal:idWithdrawal,data:data,vehicle:vehicle,now:now,status:status},newKeys)||{};
  registerKnownDamageEventsMobile_(ss,{damages:known,idWithdrawal:idWithdrawal,idVtr:vehicle.id||"",rg:data.rg,km:data.kmInicial,condutor:data.condutor,now:now});
  appendMobilePhotos_(ss,photoRecords,idWithdrawal,now);
  appendLog_(ss,{idUsuario:"",action:"CHECKLIST "+data.tipoChecklist,referenceId:idWithdrawal,description:"Checklist "+data.tipoChecklist.toLowerCase()+" "+status+" - "+data.prefixo+" - "+protocol,device:data.dispositivo||{},result:"SUCESSO",now:now});
  if(vehicle.id)updateVehicleKm_(ss,vehicle.id,Number(data.kmInicial));
  invalidateAdminSearchCache_();
  return {success:true,id:idWithdrawal,protocolo:protocol,status:status,tipoChecklist:data.tipoChecklist,backendVersion:"1.19.7-RC1",fotosSalvas:photoRecords.length,novasAvarias:newKeys.length,novosItens:newKeys.map(mobileItemName_),idAlerta:alertResult.idAlerta||""};
}
function sanitizeMobileWithdrawalData_(input){
  if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Dados do checklist não informados.");
  const data={};data.tipoChecklist=sanitizeChecklistType_(input.tipoChecklist);data.origemAplicacao=sanitizeApplicationOrigin_(input.origemAplicacao,data.tipoChecklist);data.idRequisicao=sanitizeRequestId_(input.idRequisicao);data.prefixo=sanitizeVehiclePrefix_(input.prefixo);data.dataCliente=sanitizeDateText_(input.dataCliente);
  data.condutor=sanitizePersonName_(input.condutor,80);data.postoGraduacao=sanitizeRank_(input.postoGraduacao);data.rg=sanitizeDigits_(input.rg,20,"RG");data.kmInicial=sanitizeKm_(input.kmInicial);data.turno=sanitizeMobileShift_(input.turno);data.operacaoOutro=sanitizeOtherOperation_(input.operacaoOutro,data.turno);data.combustivel=sanitizeFuel_(input.combustivel);
  data.itens=sanitizeMobileItems_(input.itens);data.descricoesAlteracoes=sanitizeMobileDescriptions_(input.descricoesAlteracoes,data.itens);
  data.avariasConhecidas=sanitizeKnownDamages_(input.avariasConhecidas);data.fotos=sanitizePhotoMetadata_(input.fotos);data.dispositivo=sanitizeDeviceData_(input.dispositivo);return data;
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
function sanitizePhotoMetadata_(photos){if(!Array.isArray(photos))return [];return photos.map(function(p){if(!p||typeof p!=="object")throw new Error("Fotografia inválida.");const tipo=String(p.tipo||"").trim();if(!/^[a-z0-9_]{1,120}$/.test(tipo)||!String(p.data||"").trim())throw new Error("Fotografia inválida.");return {tipo:tipo,name:sanitizeFilename_(p.name||"foto.jpg"),mimeType:/^image\/(jpeg|png|webp)$/.test(String(p.mimeType||""))?p.mimeType:"image/jpeg",data:String(p.data)};});}
function validateMobileWithdrawal_(data){
  ["prefixo","dataCliente","condutor","postoGraduacao","rg","kmInicial","turno","combustivel"].forEach(function(f){if(data[f]===undefined||data[f]===null||String(data[f]).trim()==="")throw new Error("Campo obrigatório ausente: "+f);});
  const required=["lataria_geral","vidros_para_brisas","iluminacao_externa","pneus_rodas","multimidia","ar_condicionado","painel_instrumentos","freio","buzina","sirene","xadrez","tapete","estepe","macaco","triangulo","chave_roda","nivel_oleo_motor","nivel_oleo_hidraulico","nivel_oleo_freio","nivel_fluido_arrefecimento","nivel_agua_limpador","outras_alteracoes_mecanica"];
  required.forEach(function(k){if(["ok","nao","na"].indexOf(data.itens[k])===-1)throw new Error("Item não avaliado: "+mobileItemName_(k));});
  ["lataria_geral","vidros_para_brisas","iluminacao_externa","pneus_rodas","multimidia","ar_condicionado","painel_instrumentos","freio","buzina","sirene","xadrez","tapete","estepe","nivel_oleo_motor","nivel_oleo_hidraulico","nivel_oleo_freio","nivel_fluido_arrefecimento","nivel_agua_limpador","outras_alteracoes_mecanica"].forEach(function(k){if(data.itens[k]==="na")throw new Error("O item obrigatório não aceita Não se aplica: "+mobileItemName_(k));});
  Object.keys(data.itens).forEach(function(k){if(data.itens[k]==="nao"&&!String(data.descricoesAlteracoes[k]||"").trim())throw new Error("Descreva a alteração do item: "+mobileItemName_(k));});
  const allowed=["continua","agravou","solicitar_verificacao"];data.avariasConhecidas.forEach(function(d){if(!d.idAvaria||allowed.indexOf(d.decisao)===-1)throw new Error("Confirme a situação de todas as avarias já registradas.");});
  const requiredPhotos=["painel_inicial","frontal","traseira","lado_esquerdo","lado_direito"];
  requiredPhotos.forEach(function(t){if(data.fotos.filter(function(p){return p.tipo===t;}).length!==1)throw new Error("Fotografia obrigatória ausente ou duplicada: "+t);});
  Object.keys(data.itens).filter(function(k){return data.itens[k]==="nao";}).forEach(function(k){if(data.fotos.filter(function(p){return p.tipo==="avaria_"+k;}).length!==1)throw new Error("Fotografia da alteração ausente: "+mobileItemName_(k));});
  if(data.fotos.length>30)throw new Error("Quantidade de fotografias acima do permitido.");
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
function appendMobileWithdrawal_(ss,c){const sheet=requireSheet_(ss,SIGVTR.SHEETS.WITHDRAWALS);ensureExtraWithdrawalColumns_(sheet);const headers=requireHeaders_(sheet,["ID_RETIRADA","ID_USUARIO","ID_VTR","Tipo_Retirada","KM Inicial","Fotos Obrigatórias","Status","Data/Hora Registro","Motorista","Posto/Graduação","RG PMPA","ITENS_JSON"]),v={};v["ID_RETIRADA"]=c.idWithdrawal;v["ID_USUARIO"]="";v["ID_VTR"]=c.vehicle.id||"";v["Tipo_Retirada"]="CHECKLIST "+c.data.tipoChecklist;v["KM Inicial"]=Number(c.data.kmInicial);v["Fotos Obrigatórias"]="SIM";v["Status"]=c.status;v["Data/Hora Registro"]=c.now;v["Motorista"]=c.data.condutor;v["Posto/Graduação"]=c.data.postoGraduacao;v["RG PMPA"]=c.data.rg;v["Combustível Inicial"]=c.data.combustivel;v["Turno"]=c.data.turno;v["Operação/Outros"]=c.data.operacaoOutro||"";v["Tipo Checklist"]=c.data.tipoChecklist;v["Observações"]=buildAlterationSummary_(c.data);v["Protocolo"]=c.protocol;v["Dispositivo"]=(c.data.dispositivo||{}).tipo||"";v["Navegador"]=(c.data.dispositivo||{}).navegador||"";v["ITENS_JSON"]=JSON.stringify({idRequisicao:c.data.idRequisicao,tipoChecklist:c.data.tipoChecklist,origemAplicacao:c.data.origemAplicacao,itens:c.data.itens,descricoes:c.data.descricoesAlteracoes,combustivel:c.data.combustivel,turno:c.data.turno,operacaoOutro:c.data.operacaoOutro,postoGraduacao:c.data.postoGraduacao,dataCliente:c.data.dataCliente,prefixo:c.data.prefixo});appendByHeaders_(sheet,headers,v);}
function appendMobileDamages_(ss,c){if(!c.itemKeys.length)return;const sheet=requireSheet_(ss,SIGVTR.SHEETS.DAMAGES),headers=requireHeaders_(sheet,["ID_AVARIA","ID_RETIRADA_DETECCAO","ID_VTR","Item","Descrição","Data Detecção","Situação"]),rows=c.itemKeys.map(function(k){return{"ID_AVARIA":"AVA-"+Utilities.getUuid(),"ID_RETIRADA_DETECCAO":c.idWithdrawal,"ID_RETIRADA_RESPONSAVEL":"","ID_VTR":c.vehicle.id||"","Item":mobileItemName_(k),"Descrição":c.data.descricoesAlteracoes[k]||"Item marcado com alteração.","Data Detecção":c.now,"Situação":"PENDENTE","Data Solução":"","Posição/Local":mobileItemName_(k),"Observação Administração":""};});appendRowsByHeaders_(sheet,headers,rows);}
function saveMobilePhotos_(photos,prefix,date,idWithdrawal,protocol){const root=getRootFolder_(),year=childFolder_(root,Utilities.formatDate(date,SIGVTR.TIMEZONE,"yyyy")),month=childFolder_(year,Utilities.formatDate(date,SIGVTR.TIMEZONE,"MM")),vehicle=childFolder_(month,String(prefix).toUpperCase()),day=childFolder_(vehicle,Utilities.formatDate(date,SIGVTR.TIMEZONE,"yyyy-MM-dd")),record=childFolder_(day,protocol);return photos.map(function(p){const bytes=Utilities.base64Decode(p.data);if(bytes.length>6*1024*1024)throw new Error("Uma fotografia excede 6 MB.");const name=sanitizeFilename_(p.tipo+"_"+(p.name||"foto.jpg")),file=record.createFile(Utilities.newBlob(bytes,p.mimeType||"image/jpeg",name));return{id:"FOTO-"+Utilities.getUuid(),type:p.tipo,name:name,url:file.getUrl(),idWithdrawal:idWithdrawal};});}
function appendMobilePhotos_(ss,records,idWithdrawal,now){if(!records.length)return;const sheet=requireSheet_(ss,SIGVTR.SHEETS.PHOTOS),headers=requireHeaders_(sheet,["ID_FOTO","ID_RETIRADA","Tipo Foto","Nome Arquivo","Link Drive","Data"]),rows=records.map(function(r){return{"ID_FOTO":r.id,"ID_RETIRADA":idWithdrawal,"Tipo Foto":r.type,"Nome Arquivo":r.name,"Link Drive":r.url,"Data":now};});appendRowsByHeaders_(sheet,headers,rows);}
function buildAlterationSummary_(data){const keys=Object.keys(data.descricoesAlteracoes||{});return keys.length?keys.map(function(k){return mobileItemName_(k)+": "+data.descricoesAlteracoes[k];}).join(" | "):"Sem novas alterações registradas.";}
function registerKnownDamageEventsMobile_(ss,c){if(!c.damages.length)return;const sheet=requireSheet_(ss,SIGVTR.SHEETS.EVENTS),headers=requireHeaders_(sheet,["ID_EVENTO","Data","Hora","Tipo do Evento","ID_RETIRADA","RG PMPA","ID_VTR","KM","Motivo","Observação","Status da VTR após Evento"]),labels={continua:"AVARIA JÁ REGISTRADA",agravou:"AGRAVAMENTO DE AVARIA",solicitar_verificacao:"SOLICITAÇÃO DE VERIFICAÇÃO DE AVARIA"},rows=c.damages.map(function(d){return{"ID_EVENTO":"EVT-"+Utilities.getUuid(),"Data":Utilities.formatDate(c.now,SIGVTR.TIMEZONE,"dd/MM/yyyy"),"Hora":Utilities.formatDate(c.now,SIGVTR.TIMEZONE,"HH:mm:ss"),"Tipo do Evento":labels[d.decisao],"ID_RETIRADA":c.idWithdrawal,"RG PMPA":c.rg,"Nome de Guerra":c.condutor,"ID_VTR":c.idVtr,"KM":c.km,"Motivo":"Situação informada pelo condutor no checklist","Observação":"ID da avaria: "+d.idAvaria+" | Item: "+d.item+" | Decisão: "+d.decisao,"Status da VTR após Evento":"COM AVARIA PENDENTE"};});appendRowsByHeaders_(sheet,headers,rows);}
function mobileItemName_(k){const m={lataria_geral:"Lataria Geral",vidros_para_brisas:"Vidros e Para-brisas",iluminacao_externa:"Iluminação Externa",pneus_rodas:"Pneus e Rodas",multimidia:"Multimídia",ar_condicionado:"Ar-condicionado",painel_instrumentos:"Painel de Instrumentos",freio:"Freio",buzina:"Buzina",sirene:"Sirene",xadrez:"Xadrez",tapete:"Tapete",estepe:"Estepe",macaco:"Macaco",triangulo:"Triângulo",chave_roda:"Chave de roda",nivel_oleo_motor:"Nível de óleo do motor",nivel_oleo_hidraulico:"Nível do óleo hidráulico",nivel_oleo_freio:"Nível do óleo de freio",nivel_fluido_arrefecimento:"Nível do fluido de arrefecimento",nivel_agua_limpador:"Nível da água do limpador do para-brisa",outras_alteracoes_mecanica:"Outras alterações mecânicas"};return m[k]||String(k).replace(/_/g," ");}
