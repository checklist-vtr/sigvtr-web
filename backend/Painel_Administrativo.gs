/******************************************************************
 * SIGVTR - Painel Administrativo, Alertas e Histórico por Viatura
 * Versão: 1.13.3-rc1
 ******************************************************************/
const ADMIN_ALERT_HEADERS = [
  "ID_ALERTA","Tipo","Tipo Checklist","ID_REFERENCIA","ID_VTR","Prefixo","Condutor",
  "Posto/Graduação","RG PMPA","KM","Título","Descrição","Data","Hora",
  "Data/Hora Registro","Status","Mensagem WhatsApp","Data Visualização",
  "Data Encaminhamento","Data Resolução","Data Arquivamento",
  "Status Notificação","Data Visualização Notificação",
  "ID_ADMIN_ULTIMA_ACAO","Última Atualização"
];
const ADMIN_REVIEW_HEADERS = [
  "ID_REVISAO","ID_VTR","Prefixo","KM Última Revisão","Intervalo KM",
  "Próxima Revisão KM","Antecedência Alerta KM","Data Última Revisão","Status","Observação",
  "Data Realização","KM Realização","Realizada Por","Última Atualização"
];

function ensureAdminSheets_(){
  const ss=getSpreadsheet_();
  const alertSheet=ensureSheetWithHeaders_(ss,"ALERTAS",ADMIN_ALERT_HEADERS);
  migrateAdminNotificationState_(alertSheet);
  ensureSheetWithHeaders_(ss,"REVISOES",ADMIN_REVIEW_HEADERS);
}
function ensureSheetWithHeaders_(ss,name,headers){
  let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  const current=getHeaders_(sh);
  let col=current.length;
  headers.forEach(function(h){if(current.indexOf(h)===-1){col++;sh.getRange(1,col).setValue(h);current.push(h);}});
  sh.getRange(1,1,1,current.length).setFontWeight("bold");sh.setFrozenRows(1);
  return sh;
}
function migrateAdminNotificationState_(sh){
  if(!sh||sh.getLastRow()<2)return;
  const heads=getHeaders_(sh),statusI=heads.indexOf("Status Notificação"),viewI=heads.indexOf("Data Visualização Notificação");
  if(statusI<0)return;
  const rows=sh.getRange(2,1,sh.getLastRow()-1,heads.length).getValues();
  let changed=false;
  rows.forEach(function(row){
    if(!String(row[statusI]||"").trim()){
      row[statusI]="VISUALIZADA";
      if(viewI>=0&&!row[viewI])row[viewI]=row[heads.indexOf("Data/Hora Registro")]||new Date();
      changed=true;
    }
  });
  if(changed)sh.getRange(2,1,rows.length,heads.length).setValues(rows);
}
function createAdminAlert_(payload){
  ensureAdminSheets_();
  const ss=getSpreadsheet_(), sh=requireSheet_(ss,"ALERTAS"), headers=requireHeaders_(sh,ADMIN_ALERT_HEADERS);
  const now=payload.now||new Date(), type=String(payload.tipo||"").trim().toUpperCase();
  const reference=String(payload.idReferencia||"").trim();
  if(reference){const existingId=findAdminAlertId_(sh,type,reference);if(existingId)return existingId;}
  const date=Utilities.formatDate(now,SIGVTR.TIMEZONE,"dd/MM/yyyy"), time=Utilities.formatDate(now,SIGVTR.TIMEZONE,"HH:mm:ss");
  const values={
    "ID_ALERTA":"ALT-"+Utilities.getUuid(),"Tipo":type,"Tipo Checklist":String(payload.tipoChecklist||"CONDUTOR").toUpperCase(),"ID_REFERENCIA":reference,
    "ID_VTR":payload.idVtr||"","Prefixo":payload.prefixo||"","Condutor":payload.condutor||"",
    "Posto/Graduação":payload.postoGraduacao||"","RG PMPA":payload.rg||"","KM":Number(payload.km)||0,
    "Título":payload.titulo||type,"Descrição":payload.descricao||"","Data":date,"Hora":time,
    "Data/Hora Registro":now,"Status":"NOVO","Mensagem WhatsApp":payload.mensagemWhatsApp||buildAdminWhatsAppMessage_(payload,date,time),
    "Data Visualização":"","Data Encaminhamento":"","Data Resolução":"","Data Arquivamento":"",
    "Status Notificação":"NOVA","Data Visualização Notificação":"",
    "ID_ADMIN_ULTIMA_ACAO":"","Última Atualização":now
  };
  appendByHeaders_(sh,headers,values);return values["ID_ALERTA"];
}
function findAdminAlertId_(sh,type,reference){
  if(sh.getLastRow()<2)return "";const values=sh.getDataRange().getValues(),heads=values.shift().map(String),ii=heads.indexOf("ID_ALERTA"),ti=heads.indexOf("Tipo"),ri=heads.indexOf("ID_REFERENCIA");
  for(let i=0;i<values.length;i++)if(String(values[i][ti]).toUpperCase()===type&&String(values[i][ri])===reference)return ii>=0?String(values[i][ii]||""):"";
  return "";
}
function adminAlertExists_(sh,type,reference){return !!findAdminAlertId_(sh,type,reference);}
function buildAdminWhatsAppMessage_(p,date,time){
  const rank=p.postoGraduacao?String(p.postoGraduacao).trim()+" ":"";
  if(String(p.tipo||"").toUpperCase()==="REVISAO")return "🔧 SIGVTR\n\nRevisão preventiva.\n\nViatura:\n"+(p.prefixo||"")+"\n\nKM Atual:\n"+(p.km||0)+"\n\nPróxima revisão:\n"+(p.proximaRevisao||0)+"\n\nFavor verificar no Painel Administrativo.";
  if(String(p.tipo||"").toUpperCase()==="AVARIA"){const damagePerson=String(p.tipoChecklist||"CONDUTOR").toUpperCase()==="FISCAL"?"Fiscal":"Condutor";return "⚠️ SIGVTR\n\nNova avaria registrada.\n\nViatura:\n"+(p.prefixo||"")+"\n\n"+damagePerson+":\n"+rank+(p.condutor||"")+"\n\nData:\n"+date+"\n\nHora:\n"+time+"\n\nKM:\n"+(p.km||0)+"\n\nDescrição:\n"+(p.descricao||"")+"\n\nRegistro disponível no Painel Administrativo.";}
  const personLabel=String(p.tipoChecklist||"CONDUTOR").toUpperCase()==="FISCAL"?"Fiscal":"Condutor";
  return "📋 SIGVTR\n\nNovo checklist do "+personLabel.toLowerCase()+" recebido.\n\nViatura:\n"+(p.prefixo||"")+"\n\n"+personLabel+":\n"+rank+(p.condutor||"")+"\n\nData:\n"+date+"\n\nHora:\n"+time+"\n\nKM:\n"+(p.km||0)+"\n\nRegistro disponível no Painel Administrativo.";
}
function createAlertsForMobileWithdrawal_(c,newEntries){
  const checklistType=String(c.data.tipoChecklist||"CONDUTOR").toUpperCase(),personLabel=checklistType==="FISCAL"?"Fiscal":"Condutor";
  const idAlerta=createAdminAlert_({tipo:"CHECKLIST",tipoChecklist:checklistType,idReferencia:c.idWithdrawal,idVtr:c.vehicle.id,prefixo:c.data.prefixo,condutor:c.data.condutor,postoGraduacao:c.data.postoGraduacao,rg:c.data.rg,km:c.data.kmInicial,titulo:"Novo Checklist do "+personLabel,descricao:"Checklist do "+personLabel.toLowerCase()+" concluído com status "+c.status+".",now:c.now});
  const avariaAlertIds=[];(newEntries||[]).forEach(function(entry,index){const item=typeof entry==="string"?mobileItemName_(entry):(entry.item||mobileItemName_(entry.key)),description=typeof entry==="string"?(c.data.descricoesAlteracoes[entry]||"Alteração registrada."):(entry.description||"Alteração registrada."),ref=typeof entry==="string"?entry:(entry.key+"-"+(entry.occurrence||index+1));const id=createAdminAlert_({tipo:"AVARIA",tipoChecklist:checklistType,idReferencia:c.idWithdrawal+":"+ref,idVtr:c.vehicle.id,prefixo:c.data.prefixo,condutor:c.data.condutor,postoGraduacao:c.data.postoGraduacao,rg:c.data.rg,km:c.data.kmInicial,titulo:"Nova avaria",descricao:item+": "+description,now:c.now});if(id)avariaAlertIds.push(id);});
  checkPreventiveReviewForVehicle_(c.vehicle.id,c.data.prefixo,Number(c.data.kmInicial),c.now);
  return {idAlerta:idAlerta||"",avariaAlertIds:avariaAlertIds};
}
function getActiveReviewForVehicle_(idVtr){
  ensureAdminSheets_();
  const sh=requireSheet_(getSpreadsheet_(),"REVISOES"),rows=readSheetObjects_(sh);
  const active=rows.filter(function(r){return String(r.ID_VTR||"")===String(idVtr||"")&&["REALIZADA","CANCELADA"].indexOf(String(r.Status||"").toUpperCase())<0;});
  active.sort(function(a,b){return dateValue_(b["Última Atualização"])-dateValue_(a["Última Atualização"]);});
  return active[0]||null;
}
function updateReviewRow_(idRevisao,values){
  const sh=requireSheet_(getSpreadsheet_(),"REVISOES"),heads=getHeaders_(sh),rows=sh.getDataRange().getValues(),idI=heads.indexOf("ID_REVISAO");
  for(let i=1;i<rows.length;i++)if(String(rows[i][idI]||"")===String(idRevisao||"")){heads.forEach(function(h,j){if(Object.prototype.hasOwnProperty.call(values,h))sh.getRange(i+1,j+1).setValue(values[h]);});return true;}
  return false;
}
function upsertReviewAlert_(payload){
  ensureAdminSheets_();const sh=requireSheet_(getSpreadsheet_(),"ALERTAS"),id=findAdminAlertId_(sh,"REVISAO",payload.idReferencia);
  if(!id)return createAdminAlert_(payload);
  const heads=getHeaders_(sh),rows=sh.getDataRange().getValues(),idI=heads.indexOf("ID_ALERTA");
  for(let i=1;i<rows.length;i++)if(String(rows[i][idI]||"")===String(id)){const values={"KM":Number(payload.km)||0,"Título":payload.titulo||"Revisão preventiva","Descrição":payload.descricao||"","Mensagem WhatsApp":buildAdminWhatsAppMessage_(payload,Utilities.formatDate(payload.now||new Date(),SIGVTR.TIMEZONE,"dd/MM/yyyy"),Utilities.formatDate(payload.now||new Date(),SIGVTR.TIMEZONE,"HH:mm:ss")),"Última Atualização":payload.now||new Date()};heads.forEach(function(h,j){if(Object.prototype.hasOwnProperty.call(values,h))sh.getRange(i+1,j+1).setValue(values[h]);});return id;}
  return id;
}
function checkPreventiveReviewForVehicle_(idVtr,prefixo,kmAtual,now){
  const review=getActiveReviewForVehicle_(idVtr);if(!review)return {status:"NAO_CONFIGURADA"};
  const next=Number(review["Próxima Revisão KM"]||0),advance=Math.max(0,Number(review["Antecedência Alerta KM"]||200));if(!next)return {status:"NAO_CONFIGURADA"};
  let status="PROGRAMADA";
  if(kmAtual>next)status="VENCIDA";else if(kmAtual===next)status="ATINGIDA";else if(kmAtual>=Math.max(0,next-advance))status="ALERTA";
  updateReviewRow_(review.ID_REVISAO,{"Status":status,"Última Atualização":now});
  if(status==="ALERTA")upsertReviewAlert_({tipo:"REVISAO",idReferencia:"REVISAO_PREVIA:"+review.ID_REVISAO,idVtr:idVtr,prefixo:prefixo,km:kmAtual,proximaRevisao:next,titulo:"Revisão preventiva próxima",descricao:"A viatura entrou na faixa de antecedência. Faltam "+Math.max(0,next-kmAtual)+" km para a revisão programada.",now:now});
  if(status==="ATINGIDA"||status==="VENCIDA")upsertReviewAlert_({tipo:"REVISAO",idReferencia:"REVISAO_LIMITE:"+review.ID_REVISAO,idVtr:idVtr,prefixo:prefixo,km:kmAtual,proximaRevisao:next,titulo:status==="VENCIDA"?"Revisão preventiva vencida":"Revisão programada atingida",descricao:status==="VENCIDA"?"A revisão permanece pendente e vencida até o registro administrativo de realização.":"A viatura atingiu a quilometragem programada para revisão.",now:now});
  return {status:status,proximaRevisao:next,antecedencia:advance};
}
function getAdminDashboard_(){
  ensureAdminSheets_();
  const ss=getSpreadsheet_();
  const withdrawals=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS));
  const damages=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES));
  const alerts=readSheetObjects_(ss.getSheetByName("ALERTAS"));
  const vehicles=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.VEHICLES));
  const reviews=readSheetObjects_(ss.getSheetByName("REVISOES"));
  const today=Utilities.formatDate(new Date(),SIGVTR.TIMEZONE,"dd/MM/yyyy");

  const latestByVehicle={};
  withdrawals.forEach(function(r){
    const id=String(r.ID_VTR||"");
    if(!id)return;
    const time=dateValue_(r["Data/Hora Registro"]);
    if(!latestByVehicle[id]||time>latestByVehicle[id].time){
      latestByVehicle[id]={time:time,row:r};
    }
  });

  const fuelCritical=[],fuelAttention=[],fuelNormal=[];
  Object.keys(latestByVehicle).forEach(function(id){
    const row=latestByVehicle[id].row;
    const fuel=normalizeFuelAdmin_(row["Combustível Inicial"]||"");
    if(["RESERVA","1/4","1/2","3/4","CHEIO"].indexOf(fuel)<0)return;
    const vehicle=vehicles.find(function(v){return String(v["ID-VTR"]||"")===id;})||{};
    const item={prefixo:vehicle.Prefixo||"",combustivel:fuel,dataHora:formatDateForApi_(row["Data/Hora Registro"])};
    if(fuel==="RESERVA"){item.classificacao="CRITICO";fuelCritical.push(item);}
    else if(fuel==="1/4"){item.classificacao="ATENCAO";fuelAttention.push(item);}
    else{item.classificacao="NORMAL";fuelNormal.push(item);}
  });

  let reviewsDue=0,reviewsSoon=0;
  reviews.forEach(function(r){
    const vehicle=vehicles.find(function(v){return String(v["ID-VTR"]||"")===String(r.ID_VTR||"");})||{};
    const current=Number(vehicle["KM Atual"]||0),next=Number(r["Próxima Revisão KM"]||0),status=String(r.Status||"").toUpperCase();
    if(!next||status==="ARQUIVADA"||status==="INATIVA")return;
    if(current>=next)reviewsDue++;
    else if(next-current<=1000)reviewsSoon++;
  });

  const openDamages=damages.filter(function(r){return ["PENDENTE","EM MANUTENÇÃO"].indexOf(String(r["Situação"]||"").toUpperCase())>=0;});
  const activeVehicles=vehicles.filter(function(v){const st=String(v.Status||"").toUpperCase();return st&&st!=="INATIVO";}).length;
  const recentAlerts=getAdminAlerts_({limit:10}).items.map(function(a){return {id:a.ID_ALERTA,tipo:a.Tipo,titulo:a.Título,descricao:a.Descrição,prefixo:a.Prefixo,status:a.Status,data:a.Data,hora:a.Hora};});
  const recentes=getAdminChecklists_({limit:8}).items;
  const timeline=buildAdminGlobalTimeline_(ss,{limit:20});

  return {
    checklistsHoje:withdrawals.filter(function(r){return formatDateForApi_(r["Data/Hora Registro"]).indexOf(today)===0;}).length,
    checklistsTotal:withdrawals.length,
    avariasPendentes:openDamages.length,
    revisoesPendentes:alerts.filter(function(r){return String(r.Tipo).toUpperCase()==="REVISAO"&&["RESOLVIDO","ARQUIVADO"].indexOf(String(r.Status).toUpperCase())<0;}).length,
    alertasNovos:alerts.filter(function(r){return String(r.Status).toUpperCase()==="NOVO";}).length,
    pilares:{
      combustivel:{
        criticos:fuelCritical.length,
        atencao:fuelAttention.length,
        normais:fuelNormal.length,
        alertas:fuelCritical.length+fuelAttention.length,
        itens:fuelCritical.concat(fuelAttention).slice(0,10),
        regraSIGVTR:{critico:["RESERVA"],atencao:["1/4"],normal:["1/2","3/4","CHEIO"]},
        mensagem:(fuelCritical.length||fuelAttention.length)?(fuelCritical.length+" crítico(s) em RESERVA · "+fuelAttention.length+" em atenção com 1/4."):"Nenhum nível crítico ou de atenção registrado."
      },
      quilometragem:{vencidas:reviewsDue,proximas:reviewsSoon,mensagem:reviewsDue?"Há revisão preventiva vencida por quilometragem.":reviewsSoon?"Há viatura a até 1.000 km da revisão.":"Nenhuma revisão próxima ou vencida."},
      avarias:{abertas:openDamages.length,emManutencao:openDamages.filter(function(r){return String(r["Situação"]||"").toUpperCase()==="EM MANUTENÇÃO";}).length,mensagem:openDamages.length?"Avarias permanecem abertas até ação administrativa.":"Nenhuma avaria aberta."},
      frota:{total:vehicles.length,ativas:activeVehicles}
    },
    recentes:recentes,
    ultimosAlertas:recentAlerts,
    timeline:timeline,
    atualizadoEm:Utilities.formatDate(new Date(),SIGVTR.TIMEZONE,"dd/MM/yyyy HH:mm:ss")
  };
}

/** Consulta leve para o monitoramento em tempo real do Dashboard. */
function getAdminRealtimeAlerts_(params){
  ensureAdminSheets_();
  const sh=requireSheet_(getSpreadsheet_(),"ALERTAS");
  if(sh.getLastRow()<2)return {items:[],total:0};
  const headers=getHeaders_(sh).map(function(h){return String(h).trim();});
  const requested=Math.min(Math.max(Number((params||{}).limit)||20,1),50);
  const scan=Math.min(Math.max(requested*5,100),500,sh.getLastRow()-1);
  const start=Math.max(2,sh.getLastRow()-scan+1);
  const values=sh.getRange(start,1,sh.getLastRow()-start+1,headers.length).getValues();
  let rows=values.map(function(row){const o={};headers.forEach(function(h,i){o[h]=row[i];});return o;});
  const notificationStatus=String((params||{}).statusNotificacao||"").trim().toUpperCase();
  if(notificationStatus)rows=rows.filter(function(r){return String(r["Status Notificação"]||"").trim().toUpperCase()===notificationStatus;});
  rows.sort(function(a,b){return dateValue_(b["Data/Hora Registro"])-dateValue_(a["Data/Hora Registro"]);});
  const total=rows.length;
  rows=rows.slice(0,requested).map(adminRealtimeAlertDto_);
  return {items:rows,total:total};
}
function adminRealtimeAlertDto_(r){
  return {ID_ALERTA:r.ID_ALERTA||"",Tipo:r.Tipo||"",Título:r.Título||"",Descrição:r.Descrição||"",Prefixo:r.Prefixo||"",Status:r.Status||"",statusNotificacao:r["Status Notificação"]||"",Data:formatDateOnlyAdmin_(r.Data||r["Data/Hora Registro"]),Hora:formatTimeOnlyAdmin_(r.Hora||r["Data/Hora Registro"])};
}
function consumeAdminNotifications_(data){
  ensureAdminSheets_();
  const sh=requireSheet_(getSpreadsheet_(),"ALERTAS");
  if(sh.getLastRow()<2)return {items:[],total:0};
  const heads=getHeaders_(sh),idI=heads.indexOf("ID_ALERTA"),statusI=heads.indexOf("Status Notificação"),viewI=heads.indexOf("Data Visualização Notificação");
  if(idI<0||statusI<0)throw new Error("Estrutura de notificações do painel indisponível.");
  const requested=Math.min(Math.max(Number((data||{}).limit)||20,1),50),values=sh.getDataRange().getValues(),candidates=[];
  for(let i=1;i<values.length;i++){
    if(String(values[i][statusI]||"").trim().toUpperCase()==="NOVA")candidates.push({sheetRow:i+1,row:values[i]});
  }
  candidates.sort(function(a,b){return dateValue_(a.row[heads.indexOf("Data/Hora Registro")])-dateValue_(b.row[heads.indexOf("Data/Hora Registro")]);});
  const selected=candidates.slice(0,requested),now=new Date();
  selected.forEach(function(item){
    sh.getRange(item.sheetRow,statusI+1).setValue("VISUALIZADA");
    if(viewI>=0)sh.getRange(item.sheetRow,viewI+1).setValue(now);
    item.row[statusI]="VISUALIZADA";
    if(viewI>=0)item.row[viewI]=now;
  });
  const items=selected.map(function(item){const o={};heads.forEach(function(h,i){o[h]=item.row[i];});return adminRealtimeAlertDto_(o);});
  return {items:items,total:Math.max(0,candidates.length-selected.length)};
}


function resolveChecklistTypeAdmin_(row){
  row=row||{};
  let type=String(row["Tipo Checklist"]||"").trim().toUpperCase();
  if(type!=="FISCAL"&&type!=="CONDUTOR"){
    const withdrawalType=String(row.Tipo_Retirada||"").toUpperCase();
    if(withdrawalType.indexOf("FISCAL")>=0)type="FISCAL";
    else if(withdrawalType.indexOf("CONDUTOR")>=0)type="CONDUTOR";
  }
  if(type!=="FISCAL"&&type!=="CONDUTOR"){
    try{
      const parsed=JSON.parse(String(row.ITENS_JSON||"{}"));
      const parsedType=String(parsed.tipoChecklist||"").trim().toUpperCase();
      const origin=String(parsed.origemAplicacao||"").trim().toUpperCase();
      if(parsedType==="FISCAL"||parsedType==="CONDUTOR")type=parsedType;
      else if(origin==="FISCAL_WEB")type="FISCAL";
      else if(origin==="CONDUTOR_WEB")type="CONDUTOR";
    }catch(_){}
  }
  return type==="FISCAL"?"FISCAL":"CONDUTOR";
}

function invalidateAdminSearchCache_(){
  try{CacheService.getScriptCache().remove("SIGVTR_ADMIN_SEARCH_DOCS_V2");}catch(_){}
}
function getAdminSearchDocuments_(){
  const cache=CacheService.getScriptCache(),key="SIGVTR_ADMIN_SEARCH_DOCS_V2";
  try{const cached=cache.get(key);if(cached)return JSON.parse(cached);}catch(_){}
  const ss=getSpreadsheet_(),vehicles=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.VEHICLES)),withdrawals=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS)),damages=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)),alerts=readSheetObjects_(ss.getSheetByName("ALERTAS")),vehicleById={},withdrawalById={},docs=[];
  vehicles.forEach(function(v){vehicleById[String(v["ID-VTR"]||"")]={prefixo:v.Prefixo||"",placa:v.Placa||"",modelo:v.Modelo||"",km:v["KM Atual"]||0};});
  withdrawals.forEach(function(r){const v=vehicleById[String(r.ID_VTR||"")]||{},prefix=r.Prefixo||v.prefixo||"",condutor=joinRankName_(r["Posto/Graduação"],r.Motorista),protocolo=r.Protocolo||"",tipoChecklist=resolveChecklistTypeAdmin_(r),personLabel=tipoChecklist==="FISCAL"?"Fiscal":"Condutor";withdrawalById[String(r.ID_RETIRADA||"")]={condutor:condutor,protocolo:protocolo,prefixo:prefix,tipoChecklist:tipoChecklist};docs.push({tipo:"CHECKLIST",prefixo:prefix,texto:[protocolo,prefix,condutor,r["RG PMPA"],r.Status,r.Observações,tipoChecklist,personLabel].join(" "),titulo:(protocolo||"Checklist")+" · "+personLabel,subtitulo:prefix+" · "+condutor,descricao:(r.Status||"")+" · "+formatDateForApi_(r["Data/Hora Registro"]),url:"checklists.html?prefixo="+encodeURIComponent(prefix)+"&tipoChecklist="+encodeURIComponent(tipoChecklist)});});
  damages.forEach(function(r){const v=vehicleById[String(r.ID_VTR||"")]||{},w=withdrawalById[String(r.ID_RETIRADA_DETECCAO||"")]||{},prefix=v.prefixo||w.prefixo||"";docs.push({tipo:"AVARIA",prefixo:prefix,texto:[r.ID_AVARIA,prefix,r.Item,r["Posição/Local"],r.Descrição,w.condutor,w.protocolo,r.Situação].join(" "),titulo:r.Item||r.ID_AVARIA||"Avaria",subtitulo:prefix+" · "+(r.Situação||""),descricao:(r.Descrição||"")+" · "+formatDateForApi_(r["Data Detecção"]),url:"avarias.html?busca="+encodeURIComponent(r.ID_AVARIA||prefix)});});
  alerts.forEach(function(r){const prefix=r.Prefixo||"";docs.push({tipo:"ALERTA",prefixo:prefix,texto:[r.ID_ALERTA,r.Tipo,r["Tipo Checklist"],prefix,r.Condutor,r.Título,r.Descrição,r.Status].join(" "),titulo:r.Título||r.Tipo||"Alerta",subtitulo:prefix+" · "+(r.Status||""),descricao:(r.Descrição||"")+" · "+formatDateOnlyAdmin_(r.Data||r["Data/Hora Registro"])+" "+formatTimeOnlyAdmin_(r.Hora||r["Data/Hora Registro"]),url:"alertas.html?prefixo="+encodeURIComponent(prefix)});});
  vehicles.forEach(function(v){const prefix=v.Prefixo||"";docs.push({tipo:"VIATURA",prefixo:prefix,texto:[prefix,v.Placa,v.Modelo].join(" "),titulo:prefix,subtitulo:(v.Modelo||"")+" · "+(v.Placa||""),descricao:"KM atual: "+(v["KM Atual"]||0),url:"historico-viatura.html?prefixo="+encodeURIComponent(prefix)});});
  try{const json=JSON.stringify(docs);if(json.length<95000)cache.put(key,json,60);}catch(_){}
  return docs;
}
function getAdminAlerts_(params){
  ensureAdminSheets_();let rows=readSheetObjects_(getSpreadsheet_().getSheetByName("ALERTAS"));
  const status=String(params.status||"").toUpperCase(),tipo=String(params.tipo||"").toUpperCase(),prefix=normalizeAdminPrefixSearch_(params.prefixo||"");
  if(status)rows=rows.filter(function(r){return String(r.Status).toUpperCase()===status;});if(tipo)rows=rows.filter(function(r){return String(r.Tipo).toUpperCase()===tipo;});if(prefix)rows=rows.filter(function(r){return normalizeAdminPrefixSearch_(r.Prefixo).indexOf(prefix)>=0;});
  rows.sort(function(a,b){return dateValue_(b["Data/Hora Registro"])-dateValue_(a["Data/Hora Registro"]);});
  rows=rows.map(function(r){r.Data=formatDateOnlyAdmin_(r.Data||r["Data/Hora Registro"]);r.Hora=formatTimeOnlyAdmin_(r.Hora||r["Data/Hora Registro"]);return r;});
  return {items:rows.slice(0,Number(params.limit)||200),total:rows.length};
}
function updateAdminAlertStatus_(data){
  ensureAdminSheets_();const allowed=["NOVO","VISUALIZADO","ENCAMINHADO","RESOLVIDO","ARQUIVADO"],id=String(data.idAlerta||"").trim(),status=String(data.status||"").trim().toUpperCase();if(!/^[A-Za-z0-9-]{1,100}$/.test(id)||allowed.indexOf(status)<0)throw new Error("Dados do alerta inválidos.");
  const sh=requireSheet_(getSpreadsheet_(),"ALERTAS"),values=sh.getDataRange().getValues(),heads=values[0].map(String),idI=heads.indexOf("ID_ALERTA"),stI=heads.indexOf("Status"),upI=heads.indexOf("Última Atualização"),adminI=heads.indexOf("ID_ADMIN_ULTIMA_ACAO"),map={VISUALIZADO:"Data Visualização",ENCAMINHADO:"Data Encaminhamento",RESOLVIDO:"Data Resolução",ARQUIVADO:"Data Arquivamento"},now=new Date();
  for(let i=1;i<values.length;i++){if(String(values[i][idI])===id){sh.getRange(i+1,stI+1).setValue(status);if(upI>=0)sh.getRange(i+1,upI+1).setValue(now);if(adminI>=0)sh.getRange(i+1,adminI+1).setValue(String(data.admin||"ADMIN").slice(0,80));const hi=heads.indexOf(map[status]);if(hi>=0)sh.getRange(i+1,hi+1).setValue(now);appendLog_(getSpreadsheet_(),{idUsuario:String(data.admin||"ADMIN"),action:"STATUS DE ALERTA",referenceId:id,description:"Status alterado para "+status,device:{},result:"SUCESSO",now:now});invalidateAdminSearchCache_();return {success:true};}}
  throw new Error("Alerta não encontrado.");
}
function getAdminChecklists_(params){
  params=params||{};
  const ss=getSpreadsheet_(),vehicles=vehicleIndexAdmin_(ss),rows=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS));
  let items=rows.map(function(r){
    const v=vehicles[String(r.ID_VTR)]||{};
    return {id:r.ID_RETIRADA||"",protocolo:r.Protocolo||"",prefixo:v.prefixo||"",tipoChecklist:resolveChecklistTypeAdmin_(r),condutor:joinRankName_(r["Posto/Graduação"],r.Motorista),rg:r["RG PMPA"]||"",km:Number(r["KM Inicial"]||0),combustivel:normalizeFuelAdmin_(r["Combustível Inicial"]),turno:r.Turno||"",status:r.Status||"",dataHora:formatDateForApi_(r["Data/Hora Registro"]),observacoes:r.Observações||"",operacao:r["Operação/Outros"]||"",dispositivo:r.Dispositivo||"",navegador:r.Navegador||"",itensJson:r.ITENS_JSON||""};
  });
  const search=String(params.busca||params.prefixo||"").trim().toLowerCase();
  const normalized=normalizeAdminPrefixSearch_(search),status=String(params.status||"").trim().toUpperCase(),tipoChecklist=String(params.tipoChecklist||"").trim().toUpperCase();
  const startDate=parseIsoDateAdmin_(params.dataInicial,false),endDate=parseIsoDateAdmin_(params.dataFinal,true);
  if(search)items=items.filter(function(i){const hay=[i.protocolo,i.prefixo,i.condutor,i.rg].join(" ").toLowerCase();return hay.indexOf(search)>=0||(normalized&&normalizeAdminPrefixSearch_(i.prefixo).indexOf(normalized)>=0);});
  if(status)items=items.filter(function(i){return String(i.status||"").toUpperCase()===status;});
  if(tipoChecklist)items=items.filter(function(i){return String(i.tipoChecklist||"CONDUTOR").toUpperCase()===tipoChecklist;});
  if(startDate)items=items.filter(function(i){return parseBrazilDate_(i.dataHora)>=startDate;});
  if(endDate)items=items.filter(function(i){return parseBrazilDate_(i.dataHora)<=endDate;});
  items.sort(function(a,b){return parseBrazilDate_(b.dataHora)-parseBrazilDate_(a.dataHora);});
  const total=items.length,page=Math.max(1,Number(params.page)||1),pageSize=Math.min(Math.max(Number(params.pageSize||params.limit)||20,1),200),offset=(page-1)*pageSize;
  return {items:items.slice(offset,offset+pageSize),total:total,page:page,pageSize:pageSize,pages:Math.max(1,Math.ceil(total/pageSize))};
}
function parseIsoDateAdmin_(value,endOfDay){
  const s=String(value||"").trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return 0;
  return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),endOfDay?23:0,endOfDay?59:0,endOfDay?59:0,endOfDay?999:0).getTime();
}
function getAdminChecklistDetail_(id){
  id=String(id||"").trim();if(!id)throw new Error("Identificador do checklist não informado.");
  const ss=getSpreadsheet_(),vehicles=vehicleIndexAdmin_(ss),rows=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS));
  const r=rows.find(function(row){return String(row.ID_RETIRADA||"")===id;});if(!r)throw new Error("Checklist não encontrado.");
  const v=vehicles[String(r.ID_VTR)]||{};
  let parsed={};try{parsed=JSON.parse(String(r.ITENS_JSON||"{}"));}catch(_){parsed={};}
  const checklist={id:r.ID_RETIRADA||"",protocolo:r.Protocolo||"",prefixo:v.prefixo||"",placa:v.placa||"",modelo:v.modelo||"",tipoChecklist:resolveChecklistTypeAdmin_(r),condutor:joinRankName_(r["Posto/Graduação"],r.Motorista),postoGraduacao:r["Posto/Graduação"]||"",rg:r["RG PMPA"]||"",km:Number(r["KM Inicial"]||0),combustivel:normalizeFuelAdmin_(r["Combustível Inicial"]),turno:r.Turno||"",status:r.Status||"",dataHora:formatDateForApi_(r["Data/Hora Registro"]),observacoes:r.Observações||"",operacao:r["Operação/Outros"]||"",dispositivo:r.Dispositivo||"",navegador:r.Navegador||"",itens:parsed,itensJson:r.ITENS_JSON||""};
  const fotos=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.PHOTOS)).filter(function(p){return String(p.ID_RETIRADA||"")===id;}).map(function(p){const driveUrl=String(p["Link Drive"]||"").trim(),fileId=extractDriveFileIdAdmin_(driveUrl);return{id:p.ID_FOTO||"",tipo:p["Tipo Foto"]||"Fotografia",nomeArquivo:p["Nome Arquivo"]||"foto",dataHora:formatDateForApi_(p.Data||r["Data/Hora Registro"]),viewUrl:driveUrl,thumbnailUrl:fileId?buildDriveThumbnailUrlAdmin_(driveUrl):driveUrl,url:driveUrl};});
  const avarias=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)).filter(function(a){return String(a.ID_RETIRADA_DETECCAO||"")===id;}).map(function(a){return{id:a.ID_AVARIA||"",item:a.Item||"",descricao:a.Descrição||"",situacao:a.Situação||"",local:a["Posição/Local"]||a.Item||"",data:formatDateForApi_(a["Data Detecção"])};});
  return {checklist:checklist,fotos:fotos,avarias:avarias};
}

function getAdminDamages_(params){
  const ss=getSpreadsheet_(),vehicles=vehicleIndexAdmin_(ss),withdrawals=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS)),people={};
  withdrawals.forEach(function(r){people[String(r.ID_RETIRADA||"")]={condutor:joinRankName_(r["Posto/Graduação"],r.Motorista),protocolo:r.Protocolo||""};});
  let rows=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)).map(function(r){const v=vehicles[String(r.ID_VTR)]||{},p=people[String(r.ID_RETIRADA_DETECCAO||"")]||{};return {id:r.ID_AVARIA||"",prefixo:v.prefixo||"",item:r.Item||"",descricao:r.Descrição||"",data:formatDateForApi_(r["Data Detecção"]),situacao:r.Situação||"",registradoPor:p.condutor||"",protocolo:p.protocolo||"",local:r["Posição/Local"]||r.Item||"",responsavel:r["Responsável Administração"]||"",observacaoAdministracao:r["Observação Administração"]||"",dataUltimaAtualizacao:formatDateForApi_(r["Data da Última Atualização"]),fotosCount:0,historicoCount:0};});
  const photoRows=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.PHOTOS)),logRows=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.LOGS));
  rows.forEach(function(item){const source=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)).find(function(d){return String(d.ID_AVARIA||"")===String(item.id);})||{};item.fotosCount=photoRows.filter(function(p){return String(p.ID_RETIRADA||"")===String(source.ID_RETIRADA_DETECCAO||"");}).length;item.historicoCount=logRows.filter(function(l){return String(l.ID_REFERENCIA||"")===String(item.id);}).length+1;});
  const prefix=normalizeAdminPrefixSearch_(params.prefixo||""),status=String(params.status||"").trim().toUpperCase(),search=String(params.busca||"").trim().toLowerCase();
  if(prefix)rows=rows.filter(function(r){return normalizeAdminPrefixSearch_(r.prefixo).indexOf(prefix)>=0;});
  if(status)rows=rows.filter(function(r){return String(r.situacao).toUpperCase()===status;});
  if(search)rows=rows.filter(function(r){return [r.id,r.prefixo,r.item,r.descricao,r.registradoPor,r.protocolo].join(" ").toLowerCase().indexOf(search)>=0;});
  rows.sort(function(a,b){return parseBrazilDate_(b.data)-parseBrazilDate_(a.data);});return {items:rows.slice(0,Number(params.limit)||500),total:rows.length};
}
function formatDateOnlyAdmin_(v){if(v instanceof Date&&!isNaN(v.getTime()))return Utilities.formatDate(v,SIGVTR.TIMEZONE,"dd/MM/yyyy");const s=String(v||"");const m=s.match(/(\d{2})\/(\d{2})\/(\d{4})/);if(m)return m[0];const d=new Date(s);return isNaN(d.getTime())?s:Utilities.formatDate(d,SIGVTR.TIMEZONE,"dd/MM/yyyy");}
function formatTimeOnlyAdmin_(v){if(v instanceof Date&&!isNaN(v.getTime()))return Utilities.formatDate(v,SIGVTR.TIMEZONE,"HH:mm:ss");const s=String(v||"");const m=s.match(/(\d{2}):(\d{2})(?::(\d{2}))?/);if(m)return m[0];const d=new Date(s);return isNaN(d.getTime())?s:Utilities.formatDate(d,SIGVTR.TIMEZONE,"HH:mm:ss");}
function getAdminVehicleHistory_(prefixo){
  const query=normalizeAdminPrefixSearch_(prefixo);if(!query)throw new Error("Informe o prefixo da viatura.");const ss=getSpreadsheet_(),vehicles=getActiveVehicles_(),vehicle=vehicles.find(function(v){return normalizeAdminPrefixSearch_(v.prefixo)===query||normalizeAdminPrefixSearch_(v.prefixo).endsWith(query);});if(!vehicle)throw new Error("Viatura não encontrada.");
  const checklists=getAdminChecklists_({prefixo:vehicle.prefixo,limit:1000}).items,damages=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)).filter(function(r){return String(r.ID_VTR)===String(vehicle.id);}),events=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.EVENTS)).filter(function(r){return String(r.ID_VTR)===String(vehicle.id);}),alerts=getAdminAlerts_({prefixo:vehicle.prefixo,limit:1000}).items,photos=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.PHOTOS));const withdrawalIds={},checklistById={};checklists.forEach(function(c){withdrawalIds[c.id]=true;checklistById[String(c.id)]={protocolo:c.protocolo||"",dataHora:c.dataHora||""};});const relatedPhotos=photos.filter(function(p){return withdrawalIds[String(p.ID_RETIRADA)];}).map(function(p){const driveUrl=String(p["Link Drive"]||"").trim(),fileId=extractDriveFileIdAdmin_(driveUrl),checklist=checklistById[String(p.ID_RETIRADA)]||{};return {id:p.ID_FOTO||"",idRetirada:p.ID_RETIRADA||"",tipo:p["Tipo Foto"]||"Fotografia",nomeArquivo:p["Nome Arquivo"]||"foto",dataHora:formatDateForApi_(p.Data||checklist.dataHora),protocolo:checklist.protocolo||"",viewUrl:driveUrl,thumbnailUrl:fileId?buildDriveThumbnailUrlAdmin_(driveUrl):driveUrl,url:driveUrl};});
  const timeline=[];checklists.forEach(function(c){timeline.push({tipo:"CHECKLIST",dataHora:c.dataHora,titulo:"Checklist "+(c.tipoChecklist==="FISCAL"?"do Fiscal ":"do Condutor ")+c.protocolo,descricao:c.condutor+" · "+c.km+" km · "+c.status});});damages.forEach(function(d){timeline.push({tipo:"AVARIA",dataHora:formatDateForApi_(d["Data Detecção"]),titulo:d.Item||"Avaria",descricao:(d.Descrição||"")+" · "+(d.Situação||"")});});events.forEach(function(e){timeline.push({tipo:"EVENTO",dataHora:String(e.Data||"")+" "+String(e.Hora||""),titulo:e["Tipo do Evento"]||"Evento",descricao:e.Observação||e.Motivo||""});});alerts.forEach(function(a){timeline.push({tipo:"ALERTA",dataHora:formatDateForApi_(a["Data/Hora Registro"]),titulo:a.Título||a.Tipo,descricao:a.Descrição||""});});timeline.sort(function(a,b){return parseBrazilDate_(b.dataHora)-parseBrazilDate_(a.dataHora);});
  return {viatura:vehicle,resumo:{checklists:checklists.length,avariasPendentes:damages.filter(function(d){return ["PENDENTE","EM MANUTENÇÃO"].indexOf(String(d.Situação).toUpperCase())>=0;}).length,avariasResolvidas:damages.filter(function(d){return String(d.Situação).toUpperCase()==="RESOLVIDA";}).length,alertas:alerts.length,fotos:relatedPhotos.length},checklists:checklists,avarias:damages,eventos:events,alertas:alerts,fotos:relatedPhotos,timeline:timeline};
}

/** Extrai com segurança o ID de links de arquivos do Google Drive. */
function extractDriveFileIdAdmin_(url){
  const s=String(url||"").trim();
  if(!s)return "";
  const patterns=[/\/d\/([A-Za-z0-9_-]{10,})/,/[?&]id=([A-Za-z0-9_-]{10,})/,/open\?id=([A-Za-z0-9_-]{10,})/];
  for(let i=0;i<patterns.length;i++){const m=s.match(patterns[i]);if(m)return m[1];}
  return /^[A-Za-z0-9_-]{10,}$/.test(s)?s:"";
}

function extractDriveResourceKeyAdmin_(url){
  const s=String(url||"").trim(),m=s.match(/[?&]resourcekey=([^&#]+)/i);
  if(!m)return "";
  try{return decodeURIComponent(m[1]);}catch(_){return m[1];}
}

function buildDriveThumbnailUrlAdmin_(url){
  const fileId=extractDriveFileIdAdmin_(url);
  if(!fileId)return String(url||"");
  const key=extractDriveResourceKeyAdmin_(url);
  return "https://drive.google.com/thumbnail?id="+encodeURIComponent(fileId)+"&sz=w1600"+(key?"&resourcekey="+encodeURIComponent(key):"");
}

function readSheetObjects_(sh){if(!sh||sh.getLastRow()<2)return[];const values=sh.getDataRange().getValues(),heads=values.shift().map(function(h){return String(h).trim();});return values.map(function(row){const o={};heads.forEach(function(h,i){o[h]=row[i];});return o;});}
function vehicleIndexAdmin_(ss){const rows=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.VEHICLES)),o={};rows.forEach(function(r){o[String(r["ID-VTR"])]= {prefixo:r.Prefixo||"",placa:r.Placa||"",modelo:r.Modelo||""};});return o;}
function normalizeAdminPrefixSearch_(v){return String(v||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"");}
function joinRankName_(rank,name){return [String(rank||"").trim(),String(name||"").trim()].filter(Boolean).join(" ");}
function dateValue_(v){return v instanceof Date?v.getTime():parseBrazilDate_(formatDateForApi_(v));}
function parseBrazilDate_(v){const s=String(v||"").trim(),m=s.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);if(!m)return 0;return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),Number(m[4]||0),Number(m[5]||0),Number(m[6]||0)).getTime();}


function buildAdminGlobalTimeline_(ss,params){
  const limit=Math.min(Math.max(Number((params||{}).limit)||30,1),200), vehicles=vehicleIndexAdmin_(ss), items=[];
  readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS)).forEach(function(r){const v=vehicles[String(r.ID_VTR)]||{},tipoChecklist=resolveChecklistTypeAdmin_(r),personLabel=tipoChecklist==="FISCAL"?"Fiscal":"Condutor";items.push({tipo:"CHECKLIST",subtipo:tipoChecklist,dataHora:formatDateForApi_(r["Data/Hora Registro"]),prefixo:v.prefixo||"",titulo:"Checklist do "+personLabel,descricao:joinRankName_(r["Posto/Graduação"],r.Motorista)+" · "+(r.Status||""),referencia:r.Protocolo||r.ID_RETIRADA||""});});
  readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)).forEach(function(r){const v=vehicles[String(r.ID_VTR)]||{};items.push({tipo:"AVARIA",dataHora:formatDateForApi_(r["Data Detecção"]),prefixo:v.prefixo||"",titulo:r.Item||"Nova avaria",descricao:(r.Descrição||"")+" · "+(r.Situação||""),referencia:r.ID_AVARIA||""});});
  readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.EVENTS)).forEach(function(r){const v=vehicles[String(r.ID_VTR)]||{};items.push({tipo:"EVENTO",dataHora:String(r.Data||"")+" "+String(r.Hora||""),prefixo:v.prefixo||"",titulo:r["Tipo do Evento"]||"Evento operacional",descricao:r.Observação||r.Motivo||"",referencia:r.ID_EVENTO||""});});
  readSheetObjects_(ss.getSheetByName("ALERTAS")).forEach(function(r){items.push({tipo:"ALERTA",subtipo:r.Tipo||"",dataHora:formatDateForApi_(r["Data/Hora Registro"]),prefixo:r.Prefixo||"",titulo:r.Título||r.Tipo||"Alerta",descricao:r.Descrição||"",referencia:r.ID_ALERTA||"",status:r.Status||""});});
  items.sort(function(a,b){return parseBrazilDate_(b.dataHora)-parseBrazilDate_(a.dataHora);});return items.slice(0,limit);
}
function globalAdminSearch_(params){
  const q=normalizeSecureSpaces_((params||{}).q||"");
  if(q.length<2||q.length>100)throw new Error("Informe ao menos 2 caracteres para pesquisar.");
  rejectSpreadsheetFormula_(q,"pesquisa");
  const lower=q.toLowerCase(),normalized=normalizeAdminPrefixSearch_(q),docs=getAdminSearchDocuments_(),results=[];
  docs.forEach(function(d){const text=String(d.texto||"").toLowerCase(),np=normalizeAdminPrefixSearch_(d.prefixo||"");if(text.indexOf(lower)<0&&(!normalized||np.indexOf(normalized)<0))return;let score=3;if(np===normalized)score=0;else if(normalized&&(np.endsWith(normalized)||np.indexOf(normalized)>=0))score=1;else if(text.indexOf(lower)===0)score=2;results.push({tipo:d.tipo,titulo:d.titulo,subtitulo:d.subtitulo,descricao:d.descricao,url:d.url,_score:score});});
  results.sort(function(a,b){return a._score-b._score;});results.forEach(function(r){delete r._score;});
  return {query:q,total:results.length,items:results.slice(0,300),cacheSegundos:60};
}

function normalizeFuelAdmin_(value){
  if(value instanceof Date&&!isNaN(value.getTime())){const m=value.getMonth()+1,d=value.getDate();if(m===4&&d===1)return "1/4";if(m===2&&d===1)return "1/2";if(m===4&&d===3)return "3/4";}
  const t=String(value==null?"":value).trim().toUpperCase();return ["RESERVA","1/4","1/2","3/4","CHEIO"].indexOf(t)>=0?t:t;
}

/**
 * ETAPA 5 — Gestão de Avarias
 * Consulta o prontuário completo de uma avaria, incluindo fotos da retirada
 * que originou a ocorrência e histórico administrativo persistido em LOGS.
 */
function getAdminDamageDetail_(id){
  id=String(id||"").trim();
  if(!id)throw new Error("Identificador da avaria não informado.");
  const ss=getSpreadsheet_(),vehicles=vehicleIndexAdmin_(ss);
  const rows=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES));
  const r=rows.find(function(row){return String(row.ID_AVARIA||"")===id;});
  if(!r)throw new Error("Avaria não encontrada.");
  const vehicle=vehicles[String(r.ID_VTR||"")]||{};
  const withdrawals=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS));
  const withdrawal=withdrawals.find(function(row){return String(row.ID_RETIRADA||"")===String(r.ID_RETIRADA_DETECCAO||"");})||{};
  const photos=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.PHOTOS)).filter(function(photo){return String(photo.ID_RETIRADA||"")===String(r.ID_RETIRADA_DETECCAO||"");}).map(function(photo){
    const driveUrl=String(photo["Link Drive"]||"").trim(),fileId=extractDriveFileIdAdmin_(driveUrl);
    return {id:photo.ID_FOTO||"",tipo:photo["Tipo Foto"]||"Fotografia",nomeArquivo:photo["Nome Arquivo"]||"foto",dataHora:formatDateForApi_(photo.Data||r["Data Detecção"]),viewUrl:driveUrl,thumbnailUrl:fileId?buildDriveThumbnailUrlAdmin_(driveUrl):driveUrl,url:driveUrl};
  });
  const history=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.LOGS)).filter(function(log){return String(log.ID_REFERENCIA||"")===id;}).map(function(log){
    const description=String(log.Descrição||"");
    const statusMatch=description.match(/Situação:\s*([^|]+)/i);
    const obsMatch=description.match(/Observação:\s*([^|]+)/i);
    return {dataHora:[log.Data||"",log.Hora||""].join(" ").trim(),acao:log.Ação||"ATUALIZAÇÃO",situacao:statusMatch?statusMatch[1].trim():"",responsavel:log.ID_USUARIO||"ADMINISTRADOR",observacao:obsMatch?obsMatch[1].trim():description,resultado:log.Resultado||""};
  });
  history.unshift({dataHora:formatDateForApi_(r["Data Detecção"]),acao:"DETECÇÃO",situacao:"PENDENTE",responsavel:joinRankName_(withdrawal["Posto/Graduação"],withdrawal.Motorista)||"CONDUTOR",observacao:r.Descrição||"Avaria detectada no checklist."});
  history.sort(function(a,b){return parseBrazilDate_(b.dataHora)-parseBrazilDate_(a.dataHora);});
  return {avaria:{id:r.ID_AVARIA||"",prefixo:vehicle.prefixo||"",placa:vehicle.placa||"",modelo:vehicle.modelo||"",item:r.Item||"",descricao:r.Descrição||"",local:r["Posição/Local"]||r.Item||"",data:formatDateForApi_(r["Data Detecção"]),situacao:r.Situação||"PENDENTE",registradoPor:joinRankName_(withdrawal["Posto/Graduação"],withdrawal.Motorista),protocolo:withdrawal.Protocolo||"",idRetirada:r.ID_RETIRADA_DETECCAO||"",responsavel:r["Responsável Administração"]||"",observacaoAdministracao:r["Observação Administração"]||"",dataUltimaAtualizacao:formatDateForApi_(r["Data da Última Atualização"]),dataInicioManutencao:formatDateForApi_(r["Data Início Manutenção"]),dataSolucao:formatDateForApi_(r["Data Solução"]),dataArquivamento:formatDateForApi_(r["Data Arquivamento"]),dataExclusao:formatDateForApi_(r["Data Exclusão"]),motivoExclusao:r["Motivo Exclusão"]||""},fotos:photos,historico:history};
}

/** Atualiza o ciclo de vida de uma avaria sem exclusão física. */
function updateAdminDamage_(input){
  const data=input&&typeof input==="object"?input:{};
  const id=String(data.id||"").trim(),status=normalizeDamageStatusAdmin_(data.status),responsavel=sanitizeDamageAdminText_(data.responsavel,100,"Responsável"),observacao=sanitizeDamageAdminText_(data.observacao,1000,"Observação administrativa"),motivoExclusao=String(data.motivoExclusao||"").trim(),admin=sanitizeDamageAdminText_(data.admin||"ADMINISTRADOR",100,"Administrador");
  if(!id)throw new Error("Identificador da avaria não informado.");
  if(status==="EXCLUÍDA"&&!motivoExclusao)throw new Error("Informe a justificativa da exclusão lógica.");
  const ss=getSpreadsheet_(),sheet=requireSheet_(ss,SIGVTR.SHEETS.DAMAGES);
  ensureAdminDamageColumns_(sheet);
  const values=sheet.getDataRange().getValues(),headers=values[0].map(function(h){return String(h).trim();}),idx={};headers.forEach(function(h,i){idx[h]=i;});
  const rowIndex=values.findIndex(function(row,i){return i>0&&String(row[idx.ID_AVARIA]||"")===id;});
  if(rowIndex<1)throw new Error("Avaria não encontrada.");
  const now=new Date(),previous=String(values[rowIndex][idx["Situação"]]||"PENDENTE").trim().toUpperCase();
  sheet.getRange(rowIndex+1,idx["Situação"]+1).setValue(status);
  sheet.getRange(rowIndex+1,idx["Responsável Administração"]+1).setValue(responsavel);
  sheet.getRange(rowIndex+1,idx["Observação Administração"]+1).setValue(observacao);
  sheet.getRange(rowIndex+1,idx["Data da Última Atualização"]+1).setValue(now);
  if(status==="EM MANUTENÇÃO"&&!values[rowIndex][idx["Data Início Manutenção"]])sheet.getRange(rowIndex+1,idx["Data Início Manutenção"]+1).setValue(now);
  if(status==="RESOLVIDA")sheet.getRange(rowIndex+1,idx["Data Solução"]+1).setValue(now);
  if(status==="ARQUIVADA")sheet.getRange(rowIndex+1,idx["Data Arquivamento"]+1).setValue(now);
  if(status==="EXCLUÍDA"){
    sheet.getRange(rowIndex+1,idx["Data Exclusão"]+1).setValue(now);
    sheet.getRange(rowIndex+1,idx["Motivo Exclusão"]+1).setValue(sanitizeDamageAdminText_(motivoExclusao,500,"Motivo da exclusão"));
  }
  appendLog_(ss,{idUsuario:admin,action:"ATUALIZAÇÃO DE AVARIA",referenceId:id,description:"Situação: "+status+" | Situação anterior: "+previous+" | Responsável: "+responsavel+" | Observação: "+observacao+(status==="EXCLUÍDA"?" | Motivo exclusão: "+motivoExclusao:""),device:{},result:"SUCESSO",now:now});
  invalidateAdminSearchCache_();
  return {id:id,situacao:status,situacaoAnterior:previous,responsavel:responsavel,dataHora:formatDateForApi_(now),exclusaoLogica:status==="EXCLUÍDA"};
}

function normalizeDamageStatusAdmin_(value){
  const raw=String(value||"").trim().toUpperCase(),map={"PENDENTE":"PENDENTE","EM MANUTENCAO":"EM MANUTENÇÃO","EM MANUTENÇÃO":"EM MANUTENÇÃO","RESOLVIDA":"RESOLVIDA","ARQUIVADA":"ARQUIVADA","EXCLUIDA":"EXCLUÍDA","EXCLUÍDA":"EXCLUÍDA"};
  const normalized=raw.normalize?raw.normalize("NFD").replace(/[\u0300-\u036f]/g,""):raw;
  const result=map[raw]||map[normalized];
  if(!result)throw new Error("Situação de avaria inválida.");
  return result;
}
function sanitizeDamageAdminText_(value,max,label){const text=String(value||"").replace(/[\u0000-\u001F\u007F]/g," ").replace(/\s+/g," ").trim();if(!text)throw new Error(label+" não informado.");if(text.length>max)throw new Error(label+" acima do limite permitido.");if(/^[=+\-@]/.test(text))throw new Error(label+" possui conteúdo inválido.");return text;}
function ensureAdminDamageColumns_(sheet){
  const required=["Responsável Administração","Observação Administração","Data da Última Atualização","Data Início Manutenção","Data Solução","Data Arquivamento","Data Exclusão","Motivo Exclusão"];
  const last=Math.max(sheet.getLastColumn(),1),headers=sheet.getRange(1,1,1,last).getValues()[0].map(function(h){return String(h).trim();});
  required.forEach(function(header){if(headers.indexOf(header)<0){sheet.getRange(1,headers.length+1).setValue(header);headers.push(header);}});
}


/* ===== Gestão de Viaturas v1.18.0-RC1 ===== */
const ADMIN_VEHICLE_HEADERS=["ID-VTR","Prefixo","Placa","Chassi","Nº do Motor","RENAVAM","Marca","Modelo","Ano","Combustível","Tipo Combustível","Tipo","Lotação","KM Inicial","KM Atual","Próxima Revisão KM","Antecedência Alerta KM","Status","Data do Status","Cadastro","Observações","Data Cadastro","Última Atualização","Atualizado Por"];
const OFFICIAL_FLEET_20BPM=[
["50-2001","SZX0G91","9BG148DK0RC417163","LWNF232191102","1377719461"],["50-2002","SZF6I21","9BG148DK0RC424825","LWNF233251071","1377179289"],["50-2003","QER1B71","9BG148DK0RC415135","LWNF232001098","1376601327"],["50-2004","SZE1J91","9BG148DK0RC416238","LWNF232191009","1376605004"],["50-2005","QEQ8J61","9BG148DK0RC418395","LWNF232341103","1376607228"],["50-2006","SZL7J32","9BG148DK0RC42625","LWNF233401080","1386871700"],["50-2007","SZE3H61","9BG148DK0RC414511","LWNF232001145","1376598598"],["50-2008","SZF0B61","98G148DK0RC424639","LWNF233251072","1377179807"],["50-2009","SZB4H01","9BG148DK0RC419494","LWNF232401080","1376653327"],["50-2010","SZA4C21","9BG148DK0RC419823","LWNF232411151","1376602994"],["50-2011","QVG9D91","9BG148DK0RC419612","LWNF232341117","1376669312"],["50-2012","SZD9D11","9BG148DK0RC416136","LWNF232191008","1376607740"],["50-2013","SZE5J61","9BG148DK0RC419616","LWNF232411162","1376670850"],["50-2014","SZC9F10","9BG148DK0RC415850","LWNF232131132","1373865315"],["50-2015","SZI2E81","9BG148DK0RC420324","LWNF232481155","1380360584"],["50-2016","SZI4C31","9BG148DK0RC416134","LWNF232171127","1380496451"],["50-2017","QED2J01","9BG148DK0RC416894","LWNF232271097","1374165406"],["50-2018","SZA8A90","9BG148DK0RC415315","LWNF232061015","1371854448"],["50-2019","SZD8G29","9BG148DK0RC416847","LWNF232191178","1374180022"],["50-2020","SZC2G58","9BG148DK0RC416968","LWNF232131163","1373020617"],["50-2021","SZI4B71","93YHJD207RJ738115","H4MK7430055707","1355573081"]];
function ensureAdminVehicleSheet_(){const ss=getSpreadsheet_(),sh=ensureSheetWithHeaders_(ss,SIGVTR.SHEETS.VEHICLES,ADMIN_VEHICLE_HEADERS);sh.getRange(2,Math.max(1,getHeaders_(sh).indexOf("Prefixo")+1),Math.max(1,sh.getMaxRows()-1),1).setNumberFormat("@");return sh;}
function normalizeVehiclePrefix_(v){return String(v==null?"":v).trim().replace(/\s+/g,"").replace(/^(50)-(\d{4})$/,"$1-$2");}
function vehicleRegistrationStatus_(r){const required=[r.Placa,r.Chassi,r["Nº do Motor"],r.RENAVAM];return required.every(function(v){return String(v||"").trim();})?"COMPLETO":"PENDENTE";}
function getAdminVehicles_(){const ss=getSpreadsheet_(),sh=ensureAdminVehicleSheet_(),rows=readSheetObjects_(sh),damages=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)),withdrawals=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS)),reviews=readSheetObjects_(ss.getSheetByName("REVISOES"));return {items:rows.filter(function(r){return String(r.Prefixo||"").trim();}).map(function(r){const id=String(r["ID-VTR"]||""),prefix=String(r.Prefixo||"");const open=damages.filter(function(d){return String(d.ID_VTR||"")===id&&["PENDENTE","EM MANUTENÇÃO"].indexOf(String(d["Situação"]||"").toUpperCase())>=0;}).length;let last=null;withdrawals.forEach(function(w){if(String(w.ID_VTR||"")!==id)return;const t=dateValue_(w["Data/Hora Registro"]);if(!last||t>last.time)last={time:t,km:Number(w["KM Inicial"]||0),dataHora:formatDateForApi_(w["Data/Hora Registro"]),protocolo:w.Protocolo||""};});const active=reviews.filter(function(rv){return String(rv.ID_VTR||"")===id&&["REALIZADA","CANCELADA"].indexOf(String(rv.Status||"").toUpperCase())<0;}).sort(function(a,b){return dateValue_(b["Última Atualização"])-dateValue_(a["Última Atualização"]);})[0]||{};return {id:id,prefixo:prefix,placa:r.Placa||"",chassi:r.Chassi||"",motor:r["Nº do Motor"]||"",renavam:r.RENAVAM||"",marca:r.Marca||"",modelo:r.Modelo||"",ano:r.Ano||"",combustivel:r.Combustível||"",tipoCombustivel:r["Tipo Combustível"]||"",tipo:r.Tipo||"",lotacao:r.Lotação||"",kmInicial:Number(r["KM Inicial"]||0),kmAtual:Number(r["KM Atual"]||0),proximaRevisao:Number(active["Próxima Revisão KM"]||r["Próxima Revisão KM"]||0),antecedenciaAlerta:Number(active["Antecedência Alerta KM"]||r["Antecedência Alerta KM"]||200),statusRevisao:String(active.Status||"NAO_CONFIGURADA").toUpperCase(),idRevisao:active.ID_REVISAO||"",status:r.Status||"ATIVA",dataStatus:formatDateForApi_(r["Data do Status"]),cadastro:r.Cadastro||vehicleRegistrationStatus_(r),observacoes:r.Observações||"",ultimaAtualizacao:formatDateForApi_(r["Última Atualização"]),avariasAbertas:open,ultimoChecklist:last};})};}
function getAdminVehicleDetail_(id,prefixo){const data=getAdminVehicles_().items;const p=normalizeVehiclePrefix_(prefixo);const vehicle=data.find(function(v){return (id&&String(v.id)===String(id))||(p&&normalizeVehiclePrefix_(v.prefixo)===p);});if(!vehicle)throw new Error("Viatura não encontrada.");return vehicle;}
function saveAdminVehicle_(p){const sh=ensureAdminVehicleSheet_(),headers=getHeaders_(sh),rows=sh.getDataRange().getValues(),prefix=normalizeVehiclePrefix_(p.prefixo);if(!prefix)throw new Error("Informe o prefixo.");let rowIndex=-1;const idCol=headers.indexOf("ID-VTR"),preCol=headers.indexOf("Prefixo");for(let i=1;i<rows.length;i++){if((p.id&&String(rows[i][idCol])===String(p.id))||normalizeVehiclePrefix_(rows[i][preCol])===prefix){rowIndex=i+1;break;}}const now=new Date(),id=rowIndex>0?String(sh.getRange(rowIndex,idCol+1).getValue()||""):"VTR-"+Utilities.getUuid(),oldStatus=rowIndex>0?String(sh.getRange(rowIndex,headers.indexOf("Status")+1).getValue()||"ATIVA").trim().toUpperCase():"",newStatus=String(p.status||"ATIVA").trim().toUpperCase(),next=Math.max(0,Number(p.proximaRevisao||0)),advance=Math.max(0,Number(p.antecedenciaAlerta===""||p.antecedenciaAlerta==null?200:p.antecedenciaAlerta));const values={"ID-VTR":id,"Prefixo":prefix,"Placa":String(p.placa||"").toUpperCase(),"Chassi":String(p.chassi||"").toUpperCase(),"Nº do Motor":String(p.motor||"").toUpperCase(),"RENAVAM":String(p.renavam||""),"Marca":p.marca||"","Modelo":p.modelo||"","Ano":p.ano||"","Tipo Combustível":p.tipoCombustivel||"","Tipo":p.tipo||"","Lotação":p.lotacao||"20º BPM","KM Inicial":Number(p.kmInicial||0),"KM Atual":Number(p.kmAtual||0),"Próxima Revisão KM":next,"Antecedência Alerta KM":advance,"Status":newStatus,"Data do Status":(!rowIndex||rowIndex<0||oldStatus!==newStatus)?now:(rowIndex>0&&headers.indexOf("Data do Status")>=0?sh.getRange(rowIndex,headers.indexOf("Data do Status")+1).getValue():""),"Observações":p.observacoes||"","Última Atualização":now,"Atualizado Por":p.admin||"Administrador"};values.Cadastro=vehicleRegistrationStatus_(values);if(rowIndex<0){values["Data Cadastro"]=now;appendByHeaders_(sh,headers,values);rowIndex=sh.getLastRow();}else{headers.forEach(function(h,i){if(Object.prototype.hasOwnProperty.call(values,h))sh.getRange(rowIndex,i+1).setValue(values[h]);});}sh.getRange(rowIndex,preCol+1).setNumberFormat("@").setValue(prefix);
  if(next>0){ensureAdminSheets_();let review=getActiveReviewForVehicle_(id);if(review)updateReviewRow_(review.ID_REVISAO,{"Prefixo":prefix,"Próxima Revisão KM":next,"Antecedência Alerta KM":advance,"Status":"PROGRAMADA","Última Atualização":now});else appendByHeaders_(requireSheet_(getSpreadsheet_(),"REVISOES"),requireHeaders_(requireSheet_(getSpreadsheet_(),"REVISOES"),ADMIN_REVIEW_HEADERS),{"ID_REVISAO":"REV-"+Utilities.getUuid(),"ID_VTR":id,"Prefixo":prefix,"KM Última Revisão":0,"Intervalo KM":0,"Próxima Revisão KM":next,"Antecedência Alerta KM":advance,"Data Última Revisão":"","Status":"PROGRAMADA","Observação":"Programação inicial cadastrada pela Administração.","Última Atualização":now});checkPreventiveReviewForVehicle_(id,prefix,Number(p.kmAtual||0),now);}
  appendLog_(getSpreadsheet_(),{idUsuario:p.admin||"ADMIN",action:"CADASTRO DE VIATURA",referenceId:id,description:"Cadastro atualizado - "+prefix,device:{},result:"SUCESSO",now:now});return {id:id,prefixo:prefix,cadastro:values.Cadastro};}
function registerAdminVehicleReview_(p){
  const id=String(p.id||"").trim(),prefix=normalizeVehiclePrefix_(p.prefixo),review=getActiveReviewForVehicle_(id);if(!id||!review)throw new Error("Revisão ativa não encontrada para a viatura.");
  const km=Number(p.kmRealizacao||0),next=Number(p.proximaRevisao||0),advance=Math.max(0,Number(p.antecedenciaAlerta===""||p.antecedenciaAlerta==null?200:p.antecedenciaAlerta));if(km<=0)throw new Error("Informe o KM da revisão realizada.");if(next<=km)throw new Error("A próxima revisão deve ser maior que o KM da revisão realizada.");
  const now=new Date(),admin=String(p.admin||"Administrador");updateReviewRow_(review.ID_REVISAO,{"Status":"REALIZADA","Data Realização":p.dataRealizacao?new Date(String(p.dataRealizacao)+"T12:00:00"):now,"KM Realização":km,"Realizada Por":admin,"Observação":String(p.observacao||""),"Última Atualização":now});
  const alertSh=requireSheet_(getSpreadsheet_(),"ALERTAS"),heads=getHeaders_(alertSh),rows=alertSh.getDataRange().getValues(),refI=heads.indexOf("ID_REFERENCIA"),stI=heads.indexOf("Status"),resI=heads.indexOf("Data Resolução"),upI=heads.indexOf("Última Atualização"),adminI=heads.indexOf("ID_ADMIN_ULTIMA_ACAO");for(let i=1;i<rows.length;i++){const ref=String(rows[i][refI]||"");if(ref==="REVISAO_PREVIA:"+review.ID_REVISAO||ref==="REVISAO_LIMITE:"+review.ID_REVISAO){alertSh.getRange(i+1,stI+1).setValue("RESOLVIDO");if(resI>=0)alertSh.getRange(i+1,resI+1).setValue(now);if(upI>=0)alertSh.getRange(i+1,upI+1).setValue(now);if(adminI>=0)alertSh.getRange(i+1,adminI+1).setValue(admin);}}
  const sh=requireSheet_(getSpreadsheet_(),"REVISOES"),headers=requireHeaders_(sh,ADMIN_REVIEW_HEADERS),newId="REV-"+Utilities.getUuid();appendByHeaders_(sh,headers,{"ID_REVISAO":newId,"ID_VTR":id,"Prefixo":prefix,"KM Última Revisão":km,"Intervalo KM":next-km,"Próxima Revisão KM":next,"Antecedência Alerta KM":advance,"Data Última Revisão":p.dataRealizacao?new Date(String(p.dataRealizacao)+"T12:00:00"):now,"Status":"PROGRAMADA","Observação":"Novo ciclo iniciado após revisão realizada.","Última Atualização":now});
  appendLog_(getSpreadsheet_(),{idUsuario:admin,action:"REVISÃO REALIZADA",referenceId:id,description:"Revisão registrada em "+km+" km. Próxima: "+next+" km.",device:{},result:"SUCESSO",now:now});invalidateAdminSearchCache_();return {success:true,idRevisao:newId,status:"PROGRAMADA",proximaRevisao:next};
}
function importOfficialFleet_(p){let criadas=0,atualizadas=0;OFFICIAL_FLEET_20BPM.forEach(function(v){const existing=getAdminVehicles_().items.find(function(x){return normalizeVehiclePrefix_(x.prefixo)===normalizeVehiclePrefix_(v[0]);});saveAdminVehicle_({id:existing?existing.id:"",prefixo:v[0],placa:v[1],chassi:v[2],motor:v[3],renavam:v[4],status:existing?existing.status:"ATIVA",marca:existing?existing.marca:"",modelo:existing?existing.modelo:"",ano:existing?existing.ano:"",tipoCombustivel:existing?existing.tipoCombustivel:"",tipo:existing?existing.tipo:"",lotacao:"20º BPM",kmInicial:existing?existing.kmInicial:0,kmAtual:existing?existing.kmAtual:0,observacoes:existing?existing.observacoes:"Importado da relação oficial da frota do 20º BPM.",admin:p.admin||"Administrador"});existing?atualizadas++:criadas++;});return {criadas:criadas,atualizadas:atualizadas,total:OFFICIAL_FLEET_20BPM.length};}


/** Atualiza, com auditoria, um campo administrativo comum em várias viaturas. */
function updateAdminVehiclesBulk_(input){
  const data=input&&typeof input==="object"?input:{};
  const ids=Array.isArray(data.ids)?data.ids.map(function(id){return String(id||"").trim();}).filter(Boolean):[];
  const field=String(data.campo||"").trim();
  const rawValue=String(data.valor==null?"":data.valor).trim();
  const admin=String(data.admin||"Administrador").trim()||"Administrador";
  if(!ids.length)throw new Error("Selecione ao menos uma viatura.");
  if(ids.length>200)throw new Error("A atualização em massa está limitada a 200 viaturas por operação.");
  const allowed={marca:"Marca",modelo:"Modelo",ano:"Ano",tipoCombustivel:"Tipo Combustível",tipo:"Tipo",lotacao:"Lotação",status:"Status",observacoes:"Observações"};
  const header=allowed[field];
  if(!header)throw new Error("Campo não permitido para atualização em massa.");
  if(!rawValue)throw new Error("Informe o novo valor.");
  let value=rawValue;
  if(field==="ano"){const year=Number(rawValue);if(!Number.isInteger(year)||year<1980||year>2100)throw new Error("Ano inválido.");value=year;}
  if(field==="status"){const st=String(rawValue).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");const map={ATIVA:"ATIVA",RESERVA:"RESERVA",MANUTENCAO:"MANUTENCAO",INDISPONIVEL:"INDISPONIVEL",BAIXADA:"BAIXADA"};if(!map[st])throw new Error("Situação operacional inválida.");value=map[st];}
  if(field==="tipoCombustivel"){value=String(rawValue).toUpperCase();if(["DIESEL","GASOLINA","FLEX","ELÉTRICO"].indexOf(value)<0)throw new Error("Tipo de combustível inválido.");}
  if(String(value).length>(field==="observacoes"?500:120))throw new Error("O valor informado excede o limite permitido.");
  if(/^[=+@]/.test(String(value)))throw new Error("O valor informado possui conteúdo inválido.");

  const sh=ensureAdminVehicleSheet_(),headers=getHeaders_(sh),idCol=headers.indexOf("ID-VTR"),targetCol=headers.indexOf(header);
  if(idCol<0||targetCol<0)throw new Error("Estrutura da aba VIATURAS incompatível com a atualização em massa.");
  const lastRow=sh.getLastRow();
  if(lastRow<2)return {atualizadas:0,naoLocalizadas:ids.length};
  const rows=sh.getRange(2,1,lastRow-1,headers.length).getValues();
  const wanted={};ids.forEach(function(id){wanted[id]=true;});
  let updated=0;const found={};const now=new Date();
  rows.forEach(function(row,index){const id=String(row[idCol]||"").trim();if(!wanted[id])return;found[id]=true;sh.getRange(index+2,targetCol+1).setValue(value);if(field==="status"){const dsCol=headers.indexOf("Data do Status");if(dsCol>=0&&String(row[targetCol]||"").trim().toUpperCase()!==String(value).trim().toUpperCase())sh.getRange(index+2,dsCol+1).setValue(now);}const updCol=headers.indexOf("Última Atualização"),userCol=headers.indexOf("Atualizado Por");if(updCol>=0)sh.getRange(index+2,updCol+1).setValue(now);if(userCol>=0)sh.getRange(index+2,userCol+1).setValue(admin);updated++;appendLog_(getSpreadsheet_(),{idUsuario:admin,action:"ATUALIZAÇÃO EM MASSA DE VIATURA",referenceId:id,description:"Campo: "+header+" | Novo valor: "+String(value),device:{},result:"SUCESSO",now:now});});
  return {atualizadas:updated,naoLocalizadas:ids.filter(function(id){return !found[id];}).length,campo:header,valor:value};
}

/******************************************************************
 * SIGVTR - Relatórios operacionais e gerenciais
 * Versão do módulo: 1.20.6-RC1
 ******************************************************************/
function getAdminReports_(params){
  params=params||{};
  if(String(params.tipoRelatorio||'').trim())return getAdminReportsV2_(params);
  const ss=getSpreadsheet_(),vehicles=vehicleIndexAdmin_(ss),withdrawalRows=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS)),damageRows=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES));
  const startDate=parseIsoDateAdmin_(params.dataInicial,false),endDate=parseIsoDateAdmin_(params.dataFinal,true),type=String(params.tipoChecklist||'').trim().toUpperCase(),fuel=normalizeReportFuel_(params.combustivel),prefixQuery=normalizeAdminPrefixSearch_(params.prefixo||'');
  const maxRows=10000;
  let records=withdrawalRows.map(function(r){
    const v=vehicles[String(r.ID_VTR||'')]||{},date=formatDateForApi_(r['Data/Hora Registro']),checkType=resolveChecklistTypeAdmin_(r),normalizedFuel=normalizeFuelAdmin_(r['Combustível Inicial']);
    let parsed={};try{parsed=JSON.parse(String(r.ITENS_JSON||'{}'));}catch(_){parsed={};}
    return {id:String(r.ID_RETIRADA||''),idVtr:String(r.ID_VTR||''),protocolo:String(r.Protocolo||''),prefixo:String(v.prefixo||r.Prefixo||''),tipoChecklist:checkType,condutor:joinRankName_(r['Posto/Graduação'],r.Motorista),rg:String(r['RG PMPA']||''),km:Number(r['KM Inicial']||0),combustivel:normalizedFuel,turno:String(r.Turno||''),status:String(r.Status||''),dataHora:date,operacao:String(r['Operação/Outros']||''),itens:parsed&&parsed.itens&&typeof parsed.itens==='object'?parsed.itens:{}};
  }).filter(function(r){
    const time=parseBrazilDate_(r.dataHora);
    if(startDate&&time<startDate)return false;if(endDate&&time>endDate)return false;
    if(type&&r.tipoChecklist!==type)return false;if(fuel&&r.combustivel!==fuel)return false;
    if(prefixQuery&&normalizeAdminPrefixSearch_(r.prefixo).indexOf(prefixQuery)<0)return false;
    return true;
  }).sort(function(a,b){return parseBrazilDate_(b.dataHora)-parseBrazilDate_(a.dataHora);});

  const totalUntruncated=records.length,truncated=records.length>maxRows;if(truncated)records=records.slice(0,maxRows);
  const ids={};records.forEach(function(r){ids[r.id]=true;});
  const damages=damageRows.filter(function(d){return ids[String(d.ID_RETIRADA_DETECCAO||'')];});
  const damageCountByWithdrawal={};damages.forEach(function(d){const id=String(d.ID_RETIRADA_DETECCAO||'');damageCountByWithdrawal[id]=(damageCountByWithdrawal[id]||0)+1;});
  records.forEach(function(r){r.avarias=damageCountByWithdrawal[r.id]||0;});

  const fuelOrder=['RESERVA','1/4','1/2','3/4','CHEIO'],fuelDistribution={};fuelOrder.forEach(function(k){fuelDistribution[k]=0;});
  const byVehicle={},byDay={},itemCounts={};let driverCount=0,fiscalCount=0,withDamage=0;
  records.forEach(function(r){
    if(r.tipoChecklist==='FISCAL')fiscalCount++;else driverCount++;
    if(r.avarias>0)withDamage++;
    if(Object.prototype.hasOwnProperty.call(fuelDistribution,r.combustivel))fuelDistribution[r.combustivel]++;
    const key=r.idVtr||r.prefixo||'SEM_VIATURA';if(!byVehicle[key])byVehicle[key]={idVtr:r.idVtr,prefixo:r.prefixo,checklists:0,condutor:0,fiscal:0,avarias:0,kms:[],latestTime:0,ultimoCombustivel:''};
    const v=byVehicle[key];v.checklists++;r.tipoChecklist==='FISCAL'?v.fiscal++:v.condutor++;v.avarias+=r.avarias;if(Number.isFinite(r.km))v.kms.push(r.km);
    const t=parseBrazilDate_(r.dataHora);if(t>v.latestTime){v.latestTime=t;v.ultimoCombustivel=r.combustivel;}
    const day=String(r.dataHora||'').match(/\d{2}\/\d{2}\/\d{4}/);const dk=day?day[0]:'Sem data';if(!byDay[dk])byDay[dk]={data:dk,total:0,condutor:0,fiscal:0,avarias:0};byDay[dk].total++;r.tipoChecklist==='FISCAL'?byDay[dk].fiscal++:byDay[dk].condutor++;byDay[dk].avarias+=r.avarias;
    Object.keys(r.itens||{}).forEach(function(itemKey){if(String(r.itens[itemKey])!=='nao')return;const label=typeof mobileItemName_==='function'?mobileItemName_(itemKey):itemKey;itemCounts[label]=(itemCounts[label]||0)+1;});
  });

  const vehicleRows=Object.keys(byVehicle).map(function(k){const v=byVehicle[k],kms=v.kms.filter(function(n){return Number.isFinite(n);});const min=kms.length?Math.min.apply(null,kms):0,max=kms.length?Math.max.apply(null,kms):0;return {prefixo:v.prefixo,checklists:v.checklists,condutor:v.condutor,fiscal:v.fiscal,kmInicial:min,kmFinal:max,kmPercorrido:Math.max(0,max-min),avarias:v.avarias,ultimoCombustivel:v.ultimoCombustivel};}).sort(function(a,b){return String(a.prefixo).localeCompare(String(b.prefixo),'pt-BR',{numeric:true});});
  const dayRows=Object.keys(byDay).map(function(k){return byDay[k];}).sort(function(a,b){return parseBrazilDate_(b.data)-parseBrazilDate_(a.data);});
  const recurringItems=Object.keys(itemCounts).map(function(k){return {item:k,quantidade:itemCounts[k]};}).sort(function(a,b){return b.quantidade-a.quantidade||String(a.item).localeCompare(String(b.item),'pt-BR');}).slice(0,30);
  const openDamages=damages.filter(function(d){return ['PENDENTE','EM MANUTENÇÃO'].indexOf(String(d.Situação||'').toUpperCase())>=0;}).length;
  const resolvedDamages=damages.filter(function(d){return String(d.Situação||'').toUpperCase()==='RESOLVIDA';}).length;
  const fuelRows=fuelOrder.map(function(k){return {nivel:k,quantidade:fuelDistribution[k]||0,percentual:records.length?Math.round((fuelDistribution[k]||0)*1000/records.length)/10:0};});
  const latestFuel=records.map(function(r){return {dataHora:r.dataHora,protocolo:r.protocolo,prefixo:r.prefixo,tipoChecklist:r.tipoChecklist,responsavel:r.condutor,km:r.km,combustivel:r.combustivel,status:r.status,avarias:r.avarias};});

  return {filtros:{dataInicial:String(params.dataInicial||''),dataFinal:String(params.dataFinal||''),prefixo:String(params.prefixo||''),tipoChecklist:type,combustivel:fuel},resumo:{checklists:records.length,condutor:driverCount,fiscal:fiscalCount,comAvaria:withDamage,avarias:damages.length,avariasAbertas:openDamages,avariasResolvidas:resolvedDamages,viaturas:vehicleRows.length},combustivel:{distribuicao:fuelRows,registros:latestFuel},viaturas:vehicleRows,atividade:dayRows,itensRecorrentes:recurringItems,registros:latestFuel,totalSemLimite:totalUntruncated,truncado:truncated,geradoEm:Utilities.formatDate(new Date(),SIGVTR.TIMEZONE,'dd/MM/yyyy HH:mm:ss')};
}
function normalizeReportFuel_(value){const v=String(value||'').trim().toUpperCase();return ['RESERVA','1/4','1/2','3/4','CHEIO'].indexOf(v)>=0?v:'';}


/******************************************************************
 * SIGVTR - Relatórios 2.0
 * Extensão somente leitura. Mantém getAdminReports_ legado para o
 * Assistente IA e clientes que não enviam tipoRelatorio.
 ******************************************************************/
function getAdminReportsV2_(params){
  params=params||{};
  const type=String(params.tipoRelatorio||'CHECKLISTS').trim().toUpperCase();
  const allowed=['CHECKLISTS','FROTA','CARTOES','AVARIAS','COMBUSTIVEL','QUILOMETRAGEM','PERSONALIZADO'];
  if(allowed.indexOf(type)<0)throw new Error('Tipo de relatório inválido.');
  const builders={CHECKLISTS:buildReportChecklistsV2_,FROTA:buildReportFleetV2_,CARTOES:buildReportCardsV2_,AVARIAS:buildReportDamagesV2_,COMBUSTIVEL:buildReportFuelV2_,QUILOMETRAGEM:buildReportReviewsV2_,PERSONALIZADO:buildReportCustomV2_};
  const result=builders[type](params)||{};
  result.tipoRelatorio=type;
  result.geradoEm=Utilities.formatDate(new Date(),SIGVTR.TIMEZONE,'dd/MM/yyyy HH:mm:ss');
  result.somenteLeitura=true;
  return result;
}
function reportDateRangeV2_(p){return {start:parseIsoDateAdmin_(p.dataInicial,false),end:parseIsoDateAdmin_(p.dataFinal,true)};}
function reportInRangeV2_(value,range){const t=dateValue_(value);if(range.start&&t<range.start)return false;if(range.end&&t>range.end)return false;return true;}
function reportFuelClassV2_(fuel){const f=normalizeFuelAdmin_(fuel);return f==='RESERVA'?'CRÍTICO':f==='1/4'?'ATENÇÃO':(['1/2','3/4','CHEIO'].indexOf(f)>=0?'NORMAL':'');}
function reportReviewClassV2_(v){const km=Number(v.kmAtual||0),next=Number(v.proximaRevisao||0),advance=Math.max(0,Number(v.antecedenciaAlerta||200));if(next<=0)return 'NÃO CONFIGURADA';if(km>=next)return 'VENCIDA';if(km>=Math.max(0,next-advance))return 'PRÓXIMA';return 'NORMAL';}
function reportColumnsV2_(defs){return defs.map(function(d){return {key:d[0],label:d[1]};});}
function reportSelectColumnsV2_(defs,requested){const valid={};defs.forEach(function(d){valid[d[0]]=true;});const req=Array.isArray(requested)?requested.map(String).filter(function(k){return valid[k];}):[];return req.length?req:defs.map(function(d){return d[0];});}
function reportFinishV2_(title,defs,rows,p,summary){const selected=reportSelectColumnsV2_(defs,p.colunas);return {titulo:title,colunasDisponiveis:reportColumnsV2_(defs),colunasSelecionadas:selected,registros:rows,resumo:summary||{registros:rows.length},filtros:{dataInicial:String(p.dataInicial||''),dataFinal:String(p.dataFinal||''),prefixo:String(p.prefixo||''),tipoChecklist:String(p.tipoChecklist||''),combustivel:String(p.combustivel||''),classificacaoCombustivel:String(p.classificacaoCombustivel||''),statusFrota:String(p.statusFrota||''),tipoCartao:String(p.tipoCartao||''),statusCartao:String(p.statusCartao||''),statusAvaria:String(p.statusAvaria||''),itemAvaria:String(p.itemAvaria||''),statusRevisao:String(p.statusRevisao||'')}};}
function reportWithdrawalRowsV2_(p){
  const ss=getSpreadsheet_(),vehicles=vehicleIndexAdmin_(ss),damages=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)),range=reportDateRangeV2_(p),prefix=normalizeAdminPrefixSearch_(p.prefixo||''),checkType=String(p.tipoChecklist||'').toUpperCase(),fuel=normalizeReportFuel_(p.combustivel),fuelClass=String(p.classificacaoCombustivel||'').toUpperCase();
  const damageCount={};damages.forEach(function(d){const id=String(d.ID_RETIRADA_DETECCAO||'');damageCount[id]=(damageCount[id]||0)+1;});
  return readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS)).map(function(r){const v=vehicles[String(r.ID_VTR||'')]||{},f=normalizeFuelAdmin_(r['Combustível Inicial']),t=resolveChecklistTypeAdmin_(r);return {dataHora:formatDateForApi_(r['Data/Hora Registro']),protocolo:String(r.Protocolo||''),prefixo:String(v.prefixo||r.Prefixo||''),placa:String(v.placa||''),tipoChecklist:t,responsavel:joinRankName_(r['Posto/Graduação'],r.Motorista),rg:String(r['RG PMPA']||''),km:Number(r['KM Inicial']||0),combustivel:f,classificacaoCombustivel:reportFuelClassV2_(f),turno:String(r.Turno||''),status:String(r.Status||''),operacao:String(r['Operação/Outros']||''),avarias:Number(damageCount[String(r.ID_RETIRADA||'')]||0),_date:r['Data/Hora Registro']};}).filter(function(r){if(!reportInRangeV2_(r._date,range))return false;if(prefix&&normalizeAdminPrefixSearch_(r.prefixo).indexOf(prefix)<0)return false;if(checkType&&r.tipoChecklist!==checkType)return false;if(fuel&&r.combustivel!==fuel)return false;if(fuelClass&&r.classificacaoCombustivel!==fuelClass)return false;delete r._date;return true;}).sort(function(a,b){return parseBrazilDate_(b.dataHora)-parseBrazilDate_(a.dataHora);});
}
function buildReportChecklistsV2_(p){const defs=[['dataHora','Data/Hora'],['protocolo','Protocolo'],['prefixo','Viatura'],['placa','Placa'],['tipoChecklist','Tipo'],['responsavel','Responsável'],['rg','RG PMPA'],['km','KM'],['combustivel','Combustível'],['classificacaoCombustivel','Classificação'],['turno','Turno'],['status','Status'],['operacao','Operação/Outros'],['avarias','Avarias']];const rows=reportWithdrawalRowsV2_(p);return reportFinishV2_('Checklists / Relatório operacional',defs,rows,p,{registros:rows.length,condutor:rows.filter(function(r){return r.tipoChecklist==='CONDUTOR';}).length,fiscal:rows.filter(function(r){return r.tipoChecklist==='FISCAL';}).length,comAvaria:rows.filter(function(r){return r.avarias>0;}).length});}
function buildReportFuelV2_(p){const defs=[['dataHora','Data/Hora'],['prefixo','Viatura'],['placa','Placa'],['tipoChecklist','Tipo'],['responsavel','Responsável'],['km','KM'],['combustivel','Combustível'],['classificacaoCombustivel','Classificação'],['status','Status']];const rows=reportWithdrawalRowsV2_(p);return reportFinishV2_('Combustível',defs,rows,p,{registros:rows.length,critico:rows.filter(function(r){return r.classificacaoCombustivel==='CRÍTICO';}).length,atencao:rows.filter(function(r){return r.classificacaoCombustivel==='ATENÇÃO';}).length,normal:rows.filter(function(r){return r.classificacaoCombustivel==='NORMAL';}).length});}
function reportFleetRowsV2_(p){const prefix=normalizeAdminPrefixSearch_(p.prefixo||''),status=String(p.statusFrota||'').trim().toUpperCase();return getAdminVehicles_().items.filter(function(v){if(prefix&&normalizeAdminPrefixSearch_(v.prefixo).indexOf(prefix)<0)return false;if(status&&String(v.status||'').toUpperCase()!==status)return false;return true;}).map(function(v){const rc=reportReviewClassV2_(v);return {prefixo:v.prefixo,placa:v.placa,chassi:v.chassi,motor:v.motor,renavam:v.renavam,marca:v.marca,modelo:v.modelo,ano:v.ano,tipo:v.tipo,tipoCombustivel:v.tipoCombustivel,lotacao:v.lotacao,status:v.status,dataStatus:v.dataStatus,cadastro:v.cadastro,kmInicial:v.kmInicial,kmAtual:v.kmAtual,proximaRevisao:v.proximaRevisao,distanciaRevisao:Number(v.proximaRevisao||0)>0?Number(v.proximaRevisao||0)-Number(v.kmAtual||0):'',statusRevisao:rc,avariasAbertas:v.avariasAbertas,ultimoChecklist:v.ultimoChecklist?v.ultimoChecklist.dataHora:'',observacoes:v.observacoes};}).sort(function(a,b){return String(a.prefixo).localeCompare(String(b.prefixo),'pt-BR',{numeric:true});});}
function buildReportFleetV2_(p){const defs=[['prefixo','Prefixo'],['placa','Placa'],['chassi','Chassi'],['motor','Nº do Motor'],['renavam','RENAVAM'],['marca','Marca'],['modelo','Modelo'],['ano','Ano'],['tipo','Tipo'],['tipoCombustivel','Tipo Combustível'],['lotacao','Lotação'],['status','Status'],['dataStatus','Data do Status'],['cadastro','Cadastro'],['kmInicial','KM Inicial'],['kmAtual','Último KM'],['proximaRevisao','KM Próxima Revisão'],['distanciaRevisao','Distância p/ Revisão'],['statusRevisao','Situação Revisão'],['avariasAbertas','Avarias Abertas'],['ultimoChecklist','Último Checklist'],['observacoes','Observações']];const rows=reportFleetRowsV2_(p);return reportFinishV2_('Frota / Viaturas',defs,rows,p,{registros:rows.length,ativas:rows.filter(function(r){return String(r.status).toUpperCase()==='ATIVA';}).length,baixadas:rows.filter(function(r){return String(r.status).toUpperCase()==='BAIXADA';}).length,reservas:rows.filter(function(r){return String(r.status).toUpperCase()==='RESERVA'||(/\breserva\b/i.test(String(r.observacoes||''))&&String(r.status).toUpperCase()==='ATIVA');}).length,baixadasComReserva:rows.filter(function(r){return String(r.status).toUpperCase()==='BAIXADA'&&/reserva\s+disponibilizada|reserva disponibilizada/i.test(String(r.observacoes||''))&&!/sem\s+reserva/i.test(String(r.observacoes||''));}).length,baixadasSemReserva:rows.filter(function(r){return String(r.status).toUpperCase()==='BAIXADA'&&/sem\s+reserva/i.test(String(r.observacoes||''));}).length});}
function buildReportCardsV2_(p){const defs=[['numeroFormatado','Nº do Cartão'],['tipo','Tipo'],['prefixo','Viatura'],['placa','Placa'],['situacao','Situação'],['observacao','Observação'],['alteradoEm','Última Alteração']];const prefix=normalizeAdminPrefixSearch_(p.prefixo||''),type=String(p.tipoCartao||'').toUpperCase(),status=String(p.statusCartao||'').toUpperCase();let rows=getAdminCards_().items.filter(function(c){if(prefix&&normalizeAdminPrefixSearch_(c.prefixo).indexOf(prefix)<0)return false;if(type&&c.tipo!==type)return false;if(status&&c.situacao!==status)return false;return true;});return reportFinishV2_('Cartões',defs,rows,p,{registros:rows.length,titulares:rows.filter(function(r){return r.tipo==='TITULAR';}).length,reserva:rows.filter(function(r){return r.tipo==='RESERVA';}).length,ativos:rows.filter(function(r){return r.situacao==='ATIVO';}).length});}
function buildReportDamagesV2_(p){const defs=[['data','Data Detecção'],['prefixo','Viatura'],['item','Item'],['descricao','Descrição'],['situacao','Situação'],['registradoPor','Registrado por'],['protocolo','Protocolo'],['local','Posição/Local'],['responsavel','Responsável Administração'],['observacaoAdministracao','Observação Administração'],['dataUltimaAtualizacao','Última Atualização']];const range=reportDateRangeV2_(p),prefix=normalizeAdminPrefixSearch_(p.prefixo||''),status=String(p.statusAvaria||'').toUpperCase(),item=String(p.itemAvaria||'').trim().toLowerCase();let rows=getAdminDamages_({limit:100000}).items.filter(function(r){if(!reportInRangeV2_(r.data,range))return false;if(prefix&&normalizeAdminPrefixSearch_(r.prefixo).indexOf(prefix)<0)return false;if(status==='ABERTAS'&&['PENDENTE','EM MANUTENÇÃO'].indexOf(String(r.situacao).toUpperCase())<0)return false;if(status&&status!=='ABERTAS'&&String(r.situacao).toUpperCase()!==status)return false;if(item&&[r.item,r.descricao,r.local].join(' ').toLowerCase().indexOf(item)<0)return false;return true;});return reportFinishV2_('Avarias',defs,rows,p,{registros:rows.length,abertas:rows.filter(function(r){return ['PENDENTE','EM MANUTENÇÃO'].indexOf(String(r.situacao).toUpperCase())>=0;}).length,resolvidas:rows.filter(function(r){return String(r.situacao).toUpperCase()==='RESOLVIDA';}).length});}
function buildReportReviewsV2_(p){const defs=[['prefixo','Prefixo'],['placa','Placa'],['kmAtual','Último KM'],['proximaRevisao','KM Próxima Revisão'],['distanciaRevisao','Distância Restante'],['statusRevisao','Situação Revisão'],['antecedenciaAlerta','Antecedência Alerta'],['statusFrota','Status Frota']];const prefix=normalizeAdminPrefixSearch_(p.prefixo||''),status=String(p.statusRevisao||'').toUpperCase();let rows=getAdminVehicles_().items.map(function(v){return {prefixo:v.prefixo,placa:v.placa,kmAtual:v.kmAtual,proximaRevisao:v.proximaRevisao,distanciaRevisao:Number(v.proximaRevisao||0)>0?Number(v.proximaRevisao||0)-Number(v.kmAtual||0):'',statusRevisao:reportReviewClassV2_(v),antecedenciaAlerta:v.antecedenciaAlerta,statusFrota:v.status};}).filter(function(r){if(prefix&&normalizeAdminPrefixSearch_(r.prefixo).indexOf(prefix)<0)return false;if(status&&r.statusRevisao!==status)return false;return true;});return reportFinishV2_('Quilometragem / Revisões',defs,rows,p,{registros:rows.length,vencidas:rows.filter(function(r){return r.statusRevisao==='VENCIDA';}).length,proximas:rows.filter(function(r){return r.statusRevisao==='PRÓXIMA';}).length,normais:rows.filter(function(r){return r.statusRevisao==='NORMAL';}).length});}
function buildReportCustomV2_(p){const defs=[['prefixo','Prefixo'],['placa','Placa'],['chassi','Chassi'],['marca','Marca'],['modelo','Modelo'],['ano','Ano'],['status','Status'],['dataStatus','Data do Status'],['numeroCartao','Nº do Cartão'],['tipoCartao','Tipo do Cartão'],['kmAtual','Último KM'],['proximaRevisao','KM de Revisão'],['statusRevisao','Situação Revisão'],['ultimoCombustivel','Último Combustível'],['classificacaoCombustivel','Classificação Combustível'],['avariasAbertas','Avarias Abertas'],['ultimoChecklist','Último Checklist']];const ss=getSpreadsheet_(),withdrawals=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS)),cards=getAdminCards_().items,latest={};withdrawals.forEach(function(w){const id=String(w.ID_VTR||''),t=dateValue_(w['Data/Hora Registro']);if(!latest[id]||t>latest[id].t)latest[id]={t:t,data:formatDateForApi_(w['Data/Hora Registro']),fuel:normalizeFuelAdmin_(w['Combustível Inicial'])};});const prefix=normalizeAdminPrefixSearch_(p.prefixo||''),status=String(p.statusFrota||'').toUpperCase();let rows=getAdminVehicles_().items.filter(function(v){if(prefix&&normalizeAdminPrefixSearch_(v.prefixo).indexOf(prefix)<0)return false;if(status&&String(v.status).toUpperCase()!==status)return false;return true;}).map(function(v){const vc=cards.filter(function(c){return c.ativo&&String(c.idVtr||'')===String(v.id);}),lc=latest[String(v.id)]||{},nums=vc.map(function(c){return c.numeroFormatado;}).join(' / '),types=vc.map(function(c){return c.tipo;}).filter(function(x,i,a){return a.indexOf(x)===i;}).join(' / ');return {prefixo:v.prefixo,placa:v.placa,chassi:v.chassi,marca:v.marca,modelo:v.modelo,ano:v.ano,status:v.status,dataStatus:v.dataStatus,numeroCartao:nums,tipoCartao:types,kmAtual:v.kmAtual,proximaRevisao:v.proximaRevisao,statusRevisao:reportReviewClassV2_(v),ultimoCombustivel:lc.fuel||'',classificacaoCombustivel:reportFuelClassV2_(lc.fuel||''),avariasAbertas:v.avariasAbertas,ultimoChecklist:lc.data||''};});return reportFinishV2_('Relatório personalizado',defs,rows,p,{registros:rows.length});}
