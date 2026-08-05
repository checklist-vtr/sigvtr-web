/******************************************************************
 * SIGVTR - Painel Administrativo, Alertas e Histórico por Viatura
 * Versão: 1.13.1-rc1
 ******************************************************************/
const ADMIN_ALERT_HEADERS = [
  "ID_ALERTA","Tipo","Tipo Checklist","ID_REFERENCIA","ID_VTR","Prefixo","Condutor",
  "Posto/Graduação","RG PMPA","KM","Título","Descrição","Data","Hora",
  "Data/Hora Registro","Status","Mensagem WhatsApp","Data Visualização",
  "Data Encaminhamento","Data Resolução","Data Arquivamento",
  "ID_ADMIN_ULTIMA_ACAO","Última Atualização"
];
const ADMIN_REVIEW_HEADERS = [
  "ID_REVISAO","ID_VTR","Prefixo","KM Última Revisão","Intervalo KM",
  "Próxima Revisão KM","Data Última Revisão","Status","Observação",
  "Última Atualização"
];

function ensureAdminSheets_(){
  const ss=getSpreadsheet_();
  ensureSheetWithHeaders_(ss,"ALERTAS",ADMIN_ALERT_HEADERS);
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
function createAlertsForMobileWithdrawal_(c,newKeys){
  const checklistType=String(c.data.tipoChecklist||"CONDUTOR").toUpperCase(),personLabel=checklistType==="FISCAL"?"Fiscal":"Condutor";
  const idAlerta=createAdminAlert_({tipo:"CHECKLIST",tipoChecklist:checklistType,idReferencia:c.idWithdrawal,idVtr:c.vehicle.id,prefixo:c.data.prefixo,condutor:c.data.condutor,postoGraduacao:c.data.postoGraduacao,rg:c.data.rg,km:c.data.kmInicial,titulo:"Novo Checklist do "+personLabel,descricao:"Checklist do "+personLabel.toLowerCase()+" concluído com status "+c.status+".",now:c.now});
  const avariaAlertIds=[];(newKeys||[]).forEach(function(k){const id=createAdminAlert_({tipo:"AVARIA",tipoChecklist:checklistType,idReferencia:c.idWithdrawal+":"+k,idVtr:c.vehicle.id,prefixo:c.data.prefixo,condutor:c.data.condutor,postoGraduacao:c.data.postoGraduacao,rg:c.data.rg,km:c.data.kmInicial,titulo:"Nova avaria",descricao:mobileItemName_(k)+": "+(c.data.descricoesAlteracoes[k]||"Alteração registrada."),now:c.now});if(id)avariaAlertIds.push(id);});
  checkPreventiveReviewForVehicle_(c.vehicle.id,c.data.prefixo,Number(c.data.kmInicial),c.now);
  return {idAlerta:idAlerta||"",avariaAlertIds:avariaAlertIds};
}
function checkPreventiveReviewForVehicle_(idVtr,prefixo,kmAtual,now){
  ensureAdminSheets_();const ss=getSpreadsheet_(),sh=requireSheet_(ss,"REVISOES"),data=sh.getDataRange().getValues(),heads=data.shift().map(String),ii=heads.indexOf("ID_VTR"),pi=heads.indexOf("Prefixo"),li=heads.indexOf("KM Última Revisão"),invi=heads.indexOf("Intervalo KM"),ni=heads.indexOf("Próxima Revisão KM"),si=heads.indexOf("Status");
  let rowIndex=-1,row=null;for(let i=0;i<data.length;i++){if(String(data[i][ii])===String(idVtr)||String(data[i][pi]).toUpperCase()===String(prefixo).toUpperCase()){rowIndex=i+2;row=data[i];break;}}
  if(!row){const headers=requireHeaders_(sh,ADMIN_REVIEW_HEADERS),interval=10000,next=interval;appendByHeaders_(sh,headers,{"ID_REVISAO":"REV-"+Utilities.getUuid(),"ID_VTR":idVtr,"Prefixo":prefixo,"KM Última Revisão":0,"Intervalo KM":interval,"Próxima Revisão KM":next,"Data Última Revisão":"","Status":"ATIVA","Observação":"","Última Atualização":now});rowIndex=sh.getLastRow();row=sh.getRange(rowIndex,1,1,sh.getLastColumn()).getValues()[0];}
  const interval=Number(row[invi])||10000,last=Number(row[li])||0,next=Number(row[ni])||last+interval;
  if(kmAtual>=next){createAdminAlert_({tipo:"REVISAO",idReferencia:"REVISAO:"+idVtr+":"+next,idVtr:idVtr,prefixo:prefixo,km:kmAtual,proximaRevisao:next,titulo:"Revisão preventiva",descricao:"A viatura atingiu ou ultrapassou a quilometragem prevista para revisão.",now:now});}
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

  const fuelCritical=[];
  Object.keys(latestByVehicle).forEach(function(id){
    const row=latestByVehicle[id].row;
    const fuel=normalizeFuelAdmin_(row["Combustível Inicial"]||"");
    if(fuel==="RESERVA"||fuel==="1/4"){
      const vehicle=vehicles.find(function(v){return String(v["ID-VTR"]||"")===id;})||{};
      fuelCritical.push({prefixo:vehicle.Prefixo||"",combustivel:fuel,dataHora:formatDateForApi_(row["Data/Hora Registro"])});
    }
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
      combustivel:{criticos:fuelCritical.length,itens:fuelCritical.slice(0,5),mensagem:fuelCritical.length?"Viaturas com último registro em RESERVA ou 1/4.":"Nenhum nível crítico registrado."},
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
  const status=String((params||{}).status||"").trim().toUpperCase();
  if(status)rows=rows.filter(function(r){return String(r.Status||"").trim().toUpperCase()===status;});
  rows.sort(function(a,b){return dateValue_(b["Data/Hora Registro"])-dateValue_(a["Data/Hora Registro"]);});
  const total=rows.length;
  rows=rows.slice(0,requested).map(function(r){return {ID_ALERTA:r.ID_ALERTA||"",Tipo:r.Tipo||"",Título:r.Título||"",Descrição:r.Descrição||"",Prefixo:r.Prefixo||"",Status:r.Status||"",Data:formatDateOnlyAdmin_(r.Data||r["Data/Hora Registro"]),Hora:formatTimeOnlyAdmin_(r.Hora||r["Data/Hora Registro"])};});
  return {items:rows,total:total};
}

function invalidateAdminSearchCache_(){
  try{CacheService.getScriptCache().remove("SIGVTR_ADMIN_SEARCH_DOCS_V2");}catch(_){}
}
function getAdminSearchDocuments_(){
  const cache=CacheService.getScriptCache(),key="SIGVTR_ADMIN_SEARCH_DOCS_V2";
  try{const cached=cache.get(key);if(cached)return JSON.parse(cached);}catch(_){}
  const ss=getSpreadsheet_(),vehicles=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.VEHICLES)),withdrawals=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS)),damages=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)),alerts=readSheetObjects_(ss.getSheetByName("ALERTAS")),vehicleById={},withdrawalById={},docs=[];
  vehicles.forEach(function(v){vehicleById[String(v["ID-VTR"]||"")]={prefixo:v.Prefixo||"",placa:v.Placa||"",modelo:v.Modelo||"",km:v["KM Atual"]||0};});
  withdrawals.forEach(function(r){const v=vehicleById[String(r.ID_VTR||"")]||{},prefix=r.Prefixo||v.prefixo||"",condutor=joinRankName_(r["Posto/Graduação"],r.Motorista),protocolo=r.Protocolo||"",tipoChecklist=String(r["Tipo Checklist"]||"CONDUTOR").toUpperCase(),personLabel=tipoChecklist==="FISCAL"?"Fiscal":"Condutor";withdrawalById[String(r.ID_RETIRADA||"")]={condutor:condutor,protocolo:protocolo,prefixo:prefix,tipoChecklist:tipoChecklist};docs.push({tipo:"CHECKLIST",prefixo:prefix,texto:[protocolo,prefix,condutor,r["RG PMPA"],r.Status,r.Observações,tipoChecklist,personLabel].join(" "),titulo:(protocolo||"Checklist")+" · "+personLabel,subtitulo:prefix+" · "+condutor,descricao:(r.Status||"")+" · "+formatDateForApi_(r["Data/Hora Registro"]),url:"checklists.html?prefixo="+encodeURIComponent(prefix)+"&tipoChecklist="+encodeURIComponent(tipoChecklist)});});
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
    return {id:r.ID_RETIRADA||"",protocolo:r.Protocolo||"",prefixo:v.prefixo||"",tipoChecklist:String(r["Tipo Checklist"]||"CONDUTOR").toUpperCase(),condutor:joinRankName_(r["Posto/Graduação"],r.Motorista),rg:r["RG PMPA"]||"",km:Number(r["KM Inicial"]||0),combustivel:normalizeFuelAdmin_(r["Combustível Inicial"]),turno:r.Turno||"",status:r.Status||"",dataHora:formatDateForApi_(r["Data/Hora Registro"]),observacoes:r.Observações||"",operacao:r["Operação/Outros"]||"",dispositivo:r.Dispositivo||"",navegador:r.Navegador||"",itensJson:r.ITENS_JSON||""};
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
  const checklist={id:r.ID_RETIRADA||"",protocolo:r.Protocolo||"",prefixo:v.prefixo||"",placa:v.placa||"",modelo:v.modelo||"",tipoChecklist:String(r["Tipo Checklist"]||parsed.tipoChecklist||"CONDUTOR").toUpperCase(),condutor:joinRankName_(r["Posto/Graduação"],r.Motorista),postoGraduacao:r["Posto/Graduação"]||"",rg:r["RG PMPA"]||"",km:Number(r["KM Inicial"]||0),combustivel:normalizeFuelAdmin_(r["Combustível Inicial"]),turno:r.Turno||"",status:r.Status||"",dataHora:formatDateForApi_(r["Data/Hora Registro"]),observacoes:r.Observações||"",operacao:r["Operação/Outros"]||"",dispositivo:r.Dispositivo||"",navegador:r.Navegador||"",itens:parsed,itensJson:r.ITENS_JSON||""};
  const fotos=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.PHOTOS)).filter(function(p){return String(p.ID_RETIRADA||"")===id;}).map(function(p){const driveUrl=String(p["Link Drive"]||"").trim(),fileId=extractDriveFileIdAdmin_(driveUrl);return{id:p.ID_FOTO||"",tipo:p["Tipo Foto"]||"Fotografia",nomeArquivo:p["Nome Arquivo"]||"foto",dataHora:formatDateForApi_(p.Data||r["Data/Hora Registro"]),viewUrl:driveUrl,thumbnailUrl:fileId?"https://drive.google.com/thumbnail?id="+encodeURIComponent(fileId)+"&sz=w1600":driveUrl,url:driveUrl};});
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
  const checklists=getAdminChecklists_({prefixo:vehicle.prefixo,limit:1000}).items,damages=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)).filter(function(r){return String(r.ID_VTR)===String(vehicle.id);}),events=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.EVENTS)).filter(function(r){return String(r.ID_VTR)===String(vehicle.id);}),alerts=getAdminAlerts_({prefixo:vehicle.prefixo,limit:1000}).items,photos=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.PHOTOS));const withdrawalIds={},checklistById={};checklists.forEach(function(c){withdrawalIds[c.id]=true;checklistById[String(c.id)]={protocolo:c.protocolo||"",dataHora:c.dataHora||""};});const relatedPhotos=photos.filter(function(p){return withdrawalIds[String(p.ID_RETIRADA)];}).map(function(p){const driveUrl=String(p["Link Drive"]||"").trim(),fileId=extractDriveFileIdAdmin_(driveUrl),checklist=checklistById[String(p.ID_RETIRADA)]||{};return {id:p.ID_FOTO||"",idRetirada:p.ID_RETIRADA||"",tipo:p["Tipo Foto"]||"Fotografia",nomeArquivo:p["Nome Arquivo"]||"foto",dataHora:formatDateForApi_(p.Data||checklist.dataHora),protocolo:checklist.protocolo||"",viewUrl:driveUrl,thumbnailUrl:fileId?"https://drive.google.com/thumbnail?id="+encodeURIComponent(fileId)+"&sz=w1600":driveUrl,url:driveUrl};});
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

function readSheetObjects_(sh){if(!sh||sh.getLastRow()<2)return[];const values=sh.getDataRange().getValues(),heads=values.shift().map(function(h){return String(h).trim();});return values.map(function(row){const o={};heads.forEach(function(h,i){o[h]=row[i];});return o;});}
function vehicleIndexAdmin_(ss){const rows=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.VEHICLES)),o={};rows.forEach(function(r){o[String(r["ID-VTR"])]= {prefixo:r.Prefixo||"",placa:r.Placa||"",modelo:r.Modelo||""};});return o;}
function normalizeAdminPrefixSearch_(v){return String(v||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"");}
function joinRankName_(rank,name){return [String(rank||"").trim(),String(name||"").trim()].filter(Boolean).join(" ");}
function dateValue_(v){return v instanceof Date?v.getTime():parseBrazilDate_(formatDateForApi_(v));}
function parseBrazilDate_(v){const s=String(v||"").trim(),m=s.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);if(!m)return 0;return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),Number(m[4]||0),Number(m[5]||0),Number(m[6]||0)).getTime();}


function buildAdminGlobalTimeline_(ss,params){
  const limit=Math.min(Math.max(Number((params||{}).limit)||30,1),200), vehicles=vehicleIndexAdmin_(ss), items=[];
  readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS)).forEach(function(r){const v=vehicles[String(r.ID_VTR)]||{},tipoChecklist=String(r["Tipo Checklist"]||"CONDUTOR").toUpperCase(),personLabel=tipoChecklist==="FISCAL"?"Fiscal":"Condutor";items.push({tipo:"CHECKLIST",subtipo:tipoChecklist,dataHora:formatDateForApi_(r["Data/Hora Registro"]),prefixo:v.prefixo||"",titulo:"Checklist do "+personLabel,descricao:joinRankName_(r["Posto/Graduação"],r.Motorista)+" · "+(r.Status||""),referencia:r.Protocolo||r.ID_RETIRADA||""});});
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
    return {id:photo.ID_FOTO||"",tipo:photo["Tipo Foto"]||"Fotografia",nomeArquivo:photo["Nome Arquivo"]||"foto",dataHora:formatDateForApi_(photo.Data||r["Data Detecção"]),viewUrl:driveUrl,thumbnailUrl:fileId?"https://drive.google.com/thumbnail?id="+encodeURIComponent(fileId)+"&sz=w1600":driveUrl,url:driveUrl};
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
const ADMIN_VEHICLE_HEADERS=["ID-VTR","Prefixo","Placa","Chassi","Nº do Motor","RENAVAM","Marca","Modelo","Ano","Combustível","Tipo Combustível","Tipo","Lotação","KM Inicial","KM Atual","Status","Cadastro","Observações","Data Cadastro","Última Atualização","Atualizado Por"];
const OFFICIAL_FLEET_20BPM=[
["50-2001","SZX0G91","9BG148DK0RC417163","LWNF232191102","1377719461"],["50-2002","SZF6I21","9BG148DK0RC424825","LWNF233251071","1377179289"],["50-2003","QER1B71","9BG148DK0RC415135","LWNF232001098","1376601327"],["50-2004","SZE1J91","9BG148DK0RC416238","LWNF232191009","1376605004"],["50-2005","QEQ8J61","9BG148DK0RC418395","LWNF232341103","1376607228"],["50-2006","SZL7J32","9BG148DK0RC42625","LWNF233401080","1386871700"],["50-2007","SZE3H61","9BG148DK0RC414511","LWNF232001145","1376598598"],["50-2008","SZF0B61","98G148DK0RC424639","LWNF233251072","1377179807"],["50-2009","SZB4H01","9BG148DK0RC419494","LWNF232401080","1376653327"],["50-2010","SZA4C21","9BG148DK0RC419823","LWNF232411151","1376602994"],["50-2011","QVG9D91","9BG148DK0RC419612","LWNF232341117","1376669312"],["50-2012","SZD9D11","9BG148DK0RC416136","LWNF232191008","1376607740"],["50-2013","SZE5J61","9BG148DK0RC419616","LWNF232411162","1376670850"],["50-2014","SZC9F10","9BG148DK0RC415850","LWNF232131132","1373865315"],["50-2015","SZI2E81","9BG148DK0RC420324","LWNF232481155","1380360584"],["50-2016","SZI4C31","9BG148DK0RC416134","LWNF232171127","1380496451"],["50-2017","QED2J01","9BG148DK0RC416894","LWNF232271097","1374165406"],["50-2018","SZA8A90","9BG148DK0RC415315","LWNF232061015","1371854448"],["50-2019","SZD8G29","9BG148DK0RC416847","LWNF232191178","1374180022"],["50-2020","SZC2G58","9BG148DK0RC416968","LWNF232131163","1373020617"],["50-2021","SZI4B71","93YHJD207RJ738115","H4MK7430055707","1355573081"]];
function ensureAdminVehicleSheet_(){const ss=getSpreadsheet_(),sh=ensureSheetWithHeaders_(ss,SIGVTR.SHEETS.VEHICLES,ADMIN_VEHICLE_HEADERS);sh.getRange(2,Math.max(1,getHeaders_(sh).indexOf("Prefixo")+1),Math.max(1,sh.getMaxRows()-1),1).setNumberFormat("@");return sh;}
function normalizeVehiclePrefix_(v){return String(v==null?"":v).trim().replace(/\s+/g,"").replace(/^(50)-(\d{4})$/,"$1-$2");}
function vehicleRegistrationStatus_(r){const required=[r.Placa,r.Chassi,r["Nº do Motor"],r.RENAVAM];return required.every(function(v){return String(v||"").trim();})?"COMPLETO":"PENDENTE";}
function getAdminVehicles_(){const ss=getSpreadsheet_(),sh=ensureAdminVehicleSheet_(),rows=readSheetObjects_(sh),damages=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.DAMAGES)),withdrawals=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS));return {items:rows.filter(function(r){return String(r.Prefixo||"").trim();}).map(function(r){const id=String(r["ID-VTR"]||""),prefix=String(r.Prefixo||"");const open=damages.filter(function(d){return String(d.ID_VTR||"")===id&&["PENDENTE","EM MANUTENÇÃO"].indexOf(String(d["Situação"]||"").toUpperCase())>=0;}).length;let last=null;withdrawals.forEach(function(w){if(String(w.ID_VTR||"")!==id)return;const t=dateValue_(w["Data/Hora Registro"]);if(!last||t>last.time)last={time:t,km:Number(w["KM Inicial"]||0),dataHora:formatDateForApi_(w["Data/Hora Registro"]),protocolo:w.Protocolo||""};});return {id:id,prefixo:prefix,placa:r.Placa||"",chassi:r.Chassi||"",motor:r["Nº do Motor"]||"",renavam:r.RENAVAM||"",marca:r.Marca||"",modelo:r.Modelo||"",ano:r.Ano||"",combustivel:r.Combustível||"",tipoCombustivel:r["Tipo Combustível"]||"",tipo:r.Tipo||"",lotacao:r.Lotação||"",kmInicial:Number(r["KM Inicial"]||0),kmAtual:Number(r["KM Atual"]||0),status:r.Status||"ATIVA",cadastro:r.Cadastro||vehicleRegistrationStatus_(r),observacoes:r.Observações||"",ultimaAtualizacao:formatDateForApi_(r["Última Atualização"]),avariasAbertas:open,ultimoChecklist:last};})};}
function getAdminVehicleDetail_(id,prefixo){const data=getAdminVehicles_().items;const p=normalizeVehiclePrefix_(prefixo);const vehicle=data.find(function(v){return (id&&String(v.id)===String(id))||(p&&normalizeVehiclePrefix_(v.prefixo)===p);});if(!vehicle)throw new Error("Viatura não encontrada.");return vehicle;}
function saveAdminVehicle_(p){const sh=ensureAdminVehicleSheet_(),headers=getHeaders_(sh),rows=sh.getDataRange().getValues(),prefix=normalizeVehiclePrefix_(p.prefixo);if(!prefix)throw new Error("Informe o prefixo.");let rowIndex=-1;const idCol=headers.indexOf("ID-VTR"),preCol=headers.indexOf("Prefixo");for(let i=1;i<rows.length;i++){if((p.id&&String(rows[i][idCol])===String(p.id))||normalizeVehiclePrefix_(rows[i][preCol])===prefix){rowIndex=i+1;break;}}const now=new Date(),id=rowIndex>0?String(sh.getRange(rowIndex,idCol+1).getValue()||""):"VTR-"+Utilities.getUuid();const values={"ID-VTR":id,"Prefixo":prefix,"Placa":String(p.placa||"").toUpperCase(),"Chassi":String(p.chassi||"").toUpperCase(),"Nº do Motor":String(p.motor||"").toUpperCase(),"RENAVAM":String(p.renavam||""),"Marca":p.marca||"","Modelo":p.modelo||"","Ano":p.ano||"","Tipo Combustível":p.tipoCombustivel||"","Tipo":p.tipo||"","Lotação":p.lotacao||"20º BPM","KM Inicial":Number(p.kmInicial||0),"KM Atual":Number(p.kmAtual||0),"Status":p.status||"ATIVA","Observações":p.observacoes||"","Última Atualização":now,"Atualizado Por":p.admin||"Administrador"};values.Cadastro=vehicleRegistrationStatus_(values);if(rowIndex<0){values["Data Cadastro"]=now;appendByHeaders_(sh,headers,values);rowIndex=sh.getLastRow();}else{headers.forEach(function(h,i){if(Object.prototype.hasOwnProperty.call(values,h))sh.getRange(rowIndex,i+1).setValue(values[h]);});}sh.getRange(rowIndex,preCol+1).setNumberFormat("@").setValue(prefix);appendLog_(getSpreadsheet_(),{idUsuario:p.admin||"ADMIN",action:"CADASTRO DE VIATURA",referenceId:id,description:"Cadastro atualizado - "+prefix,device:{},result:"SUCESSO",now:now});return {id:id,prefixo:prefix,cadastro:values.Cadastro};}
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
  rows.forEach(function(row,index){const id=String(row[idCol]||"").trim();if(!wanted[id])return;found[id]=true;sh.getRange(index+2,targetCol+1).setValue(value);const updCol=headers.indexOf("Última Atualização"),userCol=headers.indexOf("Atualizado Por");if(updCol>=0)sh.getRange(index+2,updCol+1).setValue(now);if(userCol>=0)sh.getRange(index+2,userCol+1).setValue(admin);updated++;appendLog_(getSpreadsheet_(),{idUsuario:admin,action:"ATUALIZAÇÃO EM MASSA DE VIATURA",referenceId:id,description:"Campo: "+header+" | Novo valor: "+String(value),device:{},result:"SUCESSO",now:now});});
  return {atualizadas:updated,naoLocalizadas:ids.filter(function(id){return !found[id];}).length,campo:header,valor:value};
}
