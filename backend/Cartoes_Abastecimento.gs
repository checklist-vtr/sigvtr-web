/******************************************************************
 * SIGVTR - Cartões de Abastecimento
 * Arquivo: Cartoes_Abastecimento.gs
 * Versão: 1.20.17-RC1
 *
 * Módulo administrativo para cadastro e consulta dos cartões de
 * abastecimento. Não contém doGet() nem doPost(); integra-se ao
 * roteador existente em Complemento_Mobile_v4.gs.
 ******************************************************************/
const ADMIN_CARD_SHEET_='CARTOES';
const ADMIN_CARD_HEADERS_=[
  'ID_CARTAO','NUMERO_CARTAO','TIPO','ID_VTR','PREFIXO','PLACA','ATIVO',
  'OBSERVACAO','CRIADO_EM','CRIADO_POR','ALTERADO_EM','ALTERADO_POR','ORIGEM'
];

function ensureAdminCardSheet_(){
  const ss=getSpreadsheet_();
  let sh=ss.getSheetByName(ADMIN_CARD_SHEET_);
  if(!sh){
    sh=ss.insertSheet(ADMIN_CARD_SHEET_);
    sh.getRange(1,1,1,ADMIN_CARD_HEADERS_.length).setValues([ADMIN_CARD_HEADERS_]);
    sh.setFrozenRows(1);
  }else{
    const last=Math.max(1,sh.getLastColumn());
    const headers=sh.getRange(1,1,1,last).getValues()[0].map(function(v){return String(v||'').trim();});
    ADMIN_CARD_HEADERS_.forEach(function(name){
      if(headers.indexOf(name)<0){headers.push(name);sh.getRange(1,headers.length).setValue(name);}
    });
  }
  return sh;
}

function getAdminCardSheetForRead_(){
  const ss=getSpreadsheet_(),sh=ss.getSheetByName(ADMIN_CARD_SHEET_);
  // Consulta nao precisa validar/regravar cabecalhos a cada abertura da pagina.
  return sh||ensureAdminCardSheet_();
}

function adminCardNormalizeNumber_(value){return String(value||'').replace(/\D/g,'');}
function adminCardFormatNumber_(value){const digits=adminCardNormalizeNumber_(value);return digits.replace(/(.{4})/g,'$1 ').trim();}
function adminCardNormalizePrefix_(value){return String(value||'').trim().toUpperCase().replace(/\s+/g,'').replace(/^(\d{2})-?(\d{4})$/,'$1-$2').slice(0,20);}
function adminCardNormalizePlate_(value){return String(value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10);}
function adminCardNormalizeType_(value){const v=String(value||'').trim().toUpperCase();if(['TITULAR','RESERVA'].indexOf(v)<0)throw new Error('Tipo de cartão inválido.');return v;}
function adminCardNormalizeActive_(value){const v=String(value==null?'ATIVO':value).trim().toUpperCase();if(['ATIVO','SIM','TRUE','1'].indexOf(v)>=0)return 'SIM';if(['INATIVO','NAO','NÃO','FALSE','0'].indexOf(v)>=0)return 'NAO';throw new Error('Situação do cartão inválida.');}
function adminCardSafeText_(value,max){return String(value||'').trim().slice(0,max||500);}
function adminCardHeaderMap_(sh){const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(function(v){return String(v||'').trim();}),map={};headers.forEach(function(h,i){map[h]=i;});return {headers:headers,map:map};}
function adminCardObjects_(sh){if(!sh||sh.getLastRow()<2)return [];const hm=adminCardHeaderMap_(sh),values=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();return values.map(function(row,index){const o={_row:index+2};hm.headers.forEach(function(h,i){o[h]=row[i];});return o;});}
function adminCardVehicleRows_(){const ss=getSpreadsheet_(),sh=ss.getSheetByName(SIGVTR.SHEETS.VEHICLES);if(!sh)return [];return readSheetObjects_(sh).filter(function(r){return String(r.Prefixo||'').trim();}).map(function(r){return {id:String(r['ID-VTR']||''),prefixo:String(r.Prefixo||''),placa:String(r.Placa||''),status:String(r.Status||'')};}).sort(function(a,b){return a.prefixo.localeCompare(b.prefixo,'pt-BR',{numeric:true});});}
function adminCardFindVehicle_(id,prefix){const vehicles=adminCardVehicleRows_(),nid=String(id||''),np=adminCardNormalizePrefix_(prefix);for(let i=0;i<vehicles.length;i++){if((nid&&vehicles[i].id===nid)||(np&&adminCardNormalizePrefix_(vehicles[i].prefixo)===np))return vehicles[i];}return null;}
function adminCardApiObject_(r,identity){identity=identity||{};return {id:String(r.ID_CARTAO||''),numero:String(r.NUMERO_CARTAO||''),numeroFormatado:adminCardFormatNumber_(r.NUMERO_CARTAO),tipo:String(r.TIPO||'').toUpperCase(),idVtr:String(r.ID_VTR||''),prefixo:String(identity.prefixo!=null?identity.prefixo:r.PREFIXO||''),placa:String(identity.placa!=null?identity.placa:r.PLACA||''),ativo:String(r.ATIVO||'SIM').toUpperCase()!=='NAO',situacao:String(r.ATIVO||'SIM').toUpperCase()==='NAO'?'INATIVO':'ATIVO',observacao:String(r.OBSERVACAO||''),criadoEm:formatDateForApi_(r.CRIADO_EM),criadoPor:String(r.CRIADO_POR||''),alteradoEm:formatDateForApi_(r.ALTERADO_EM),alteradoPor:String(r.ALTERADO_POR||''),origem:String(r.ORIGEM||'')};}
function adminCardVehicleIndexes_(vehicles){const byId={},byPlate={};(vehicles||[]).forEach(function(v){const id=String(v.id||''),plate=adminCardNormalizePlate_(v.placa);if(id)byId[id]=v;if(plate&&!byPlate[plate])byPlate[plate]=v;});return {byId:byId,byPlate:byPlate};}
function adminCardResolveIdentity_(r,indexes){const id=String(r.ID_VTR||''),plate=adminCardNormalizePlate_(r.PLACA),vehicle=(id&&indexes.byId[id])||(plate&&indexes.byPlate[plate])||null;if(vehicle)return {prefixo:String(vehicle.prefixo||r.PREFIXO||''),placa:String(vehicle.placa||r.PLACA||'')};return {prefixo:String(r.PREFIXO||''),placa:String(r.PLACA||'')};}

function getAdminCards_(){
  const perfTotal=Date.now(),perfRead=Date.now(),sh=getAdminCardSheetForRead_(),vehicles=adminCardVehicleRows_(),indexes=adminCardVehicleIndexes_(vehicles),items=adminCardObjects_(sh).filter(function(r){return String(r.ID_CARTAO||'').trim();}).map(function(r){return adminCardApiObject_(r,adminCardResolveIdentity_(r,indexes));});
  if(typeof adminPerfMark_==='function')adminPerfMark_('adminCartoes leituras Sheets',perfRead);
  items.sort(function(a,b){return String(a.prefixo||'ZZZ').localeCompare(String(b.prefixo||'ZZZ'),'pt-BR',{numeric:true})||a.numero.localeCompare(b.numero);});
  if(typeof adminPerfMark_==='function')adminPerfMark_('adminCartoes TOTAL',perfTotal);
  return {items:items,vehicles:vehicles};
}

function saveAdminCard_(input,user){
  input=input||{};user=user||{};
  const sh=ensureAdminCardSheet_(),hm=adminCardHeaderMap_(sh),rows=adminCardObjects_(sh),id=String(input.id||'').trim();
  const numero=adminCardNormalizeNumber_(input.numero),tipo=adminCardNormalizeType_(input.tipo),ativo=adminCardNormalizeActive_(input.situacao||input.ativo),observacao=adminCardSafeText_(input.observacao,500);
  if(numero.length<12||numero.length>24)throw new Error('Número do cartão inválido.');
  const duplicate=rows.find(function(r){return adminCardNormalizeNumber_(r.NUMERO_CARTAO)===numero&&String(r.ID_CARTAO||'')!==id;});
  if(duplicate)throw new Error('Cartão já cadastrado.');

  let vehicle=adminCardFindVehicle_(input.idVtr,input.prefixo),idVtr='',prefixo='',placa='';
  if(vehicle){idVtr=vehicle.id;prefixo=adminCardNormalizePrefix_(vehicle.prefixo);placa=adminCardNormalizePlate_(vehicle.placa);}
  else{
    prefixo=adminCardNormalizePrefix_(input.prefixo);placa=adminCardNormalizePlate_(input.placa);
    if(tipo==='TITULAR'&&prefixo){
      vehicle=adminCardFindVehicle_('',prefixo);
      if(vehicle){idVtr=vehicle.id;if(!placa)placa=adminCardNormalizePlate_(vehicle.placa);}
    }
  }
  if(tipo==='TITULAR'&&!prefixo)throw new Error('Cartão titular deve possuir prefixo ou viatura vinculada.');

  const now=new Date(),actor=String(user.login||user.name||'ADMIN').slice(0,120),existing=id?rows.find(function(r){return String(r.ID_CARTAO||'')===id;}):null;
  if(id&&!existing)throw new Error('Cartão não encontrado.');
  const record={
    ID_CARTAO:existing?String(existing.ID_CARTAO):'CRT-'+Utilities.getUuid(),NUMERO_CARTAO:numero,TIPO:tipo,ID_VTR:idVtr,PREFIXO:prefixo,PLACA:placa,ATIVO:ativo,OBSERVACAO:observacao,
    CRIADO_EM:existing?existing.CRIADO_EM:now,CRIADO_POR:existing?existing.CRIADO_POR:actor,ALTERADO_EM:now,ALTERADO_POR:actor,ORIGEM:existing?String(existing.ORIGEM||'CADASTRO_ADMIN'):'CADASTRO_ADMIN'
  };
  const targetRow=existing?existing._row:sh.getLastRow()+1;
  const row=hm.headers.map(function(h){return Object.prototype.hasOwnProperty.call(record,h)?record[h]:(existing&&Object.prototype.hasOwnProperty.call(existing,h)?existing[h]:'');});
  sh.getRange(targetRow,1,1,row.length).setValues([row]);
  const numberCol=hm.map.NUMERO_CARTAO;if(numberCol!==undefined)sh.getRange(targetRow,numberCol+1).setNumberFormat('@').setValue(numero);
  const prefixCol=hm.map.PREFIXO;if(prefixCol!==undefined)sh.getRange(targetRow,prefixCol+1).setNumberFormat('@').setValue(prefixo);
  adminLogSecurity_(existing?'CARTAO_ALTERADO':'CARTAO_CRIADO',user,'CARTOES','SUCESSO','ID '+record.ID_CARTAO+' | '+tipo+' | '+prefixo+' | '+(ativo==='SIM'?'ATIVO':'INATIVO'));
  return {success:true,item:adminCardApiObject_(record)};
}

/**
 * Carga inicial idempotente dos 21 cartões titulares do documento
 * CARTOES-VTR'S.docx. Executar manualmente uma única vez após publicar
 * o backend atualizado. Pode ser executada novamente sem duplicar.
 */
function bootstrapCartoesTitulares(){
  const seed=[
    ['6035740439022101','50-2001','SZX0G91'],['6035740439021608','50-2002','SZF6I21'],['6035740439023935','50-2003','QER1B71'],
    ['6035740439024503','50-2004','SZE1J91'],['6035740438992726','50-2005','QEQ8J61'],['6035740440220009','50-2006','SZL7J32'],
    ['6035740439024529','50-2007','SZE3H61'],['6035740439021590','50-2008','SZF0B61'],['6035740439024271','50-2009','SZB4H01'],
    ['6035740439024172','50-2010','SZA4C21'],['6035740439023943','50-2011','QVG9D91'],['6035740439024487','50-2012','SZD9D11'],
    ['6035740439021566','50-2013','SZE5J61'],['6035740439024362','50-2014','SZC9F10'],['6035740439021723','50-2015','SZI2E81'],
    ['6035740439021780','50-2016','SZI4C31'],['6035740439023901','50-2017','QED2J01'],['6035740439024214','50-2018','SZA8A90'],
    ['6035740439024461','50-2019','SZD8G29'],['6035740439024313','50-2020','SZC2G58'],['6035740439021756','50-2021','SZI4B71']
  ];
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const sh=ensureAdminCardSheet_(),hm=adminCardHeaderMap_(sh),existing=adminCardObjects_(sh),seen={};existing.forEach(function(r){seen[adminCardNormalizeNumber_(r.NUMERO_CARTAO)]=true;});
    const now=new Date(),vehicles=adminCardVehicleRows_(),vehicleByPrefix={};vehicles.forEach(function(v){vehicleByPrefix[adminCardNormalizePrefix_(v.prefixo)]=v;});
    const toAppend=[];let skipped=0;
    seed.forEach(function(item){
      const numero=item[0],prefixo=adminCardNormalizePrefix_(item[1]),placa=adminCardNormalizePlate_(item[2]);if(seen[numero]){skipped++;return;}const v=vehicleByPrefix[prefixo]||{};
      const record={ID_CARTAO:'CRT-'+Utilities.getUuid(),NUMERO_CARTAO:numero,TIPO:'TITULAR',ID_VTR:v.id||'',PREFIXO:prefixo,PLACA:placa,ATIVO:'SIM',OBSERVACAO:'',CRIADO_EM:now,CRIADO_POR:'BOOTSTRAP',ALTERADO_EM:now,ALTERADO_POR:'BOOTSTRAP',ORIGEM:"CARTOES-VTR'S.docx"};
      toAppend.push(hm.headers.map(function(h){return Object.prototype.hasOwnProperty.call(record,h)?record[h]:'';}));seen[numero]=true;
    });
    if(toAppend.length){const start=sh.getLastRow()+1;sh.getRange(start,1,toAppend.length,hm.headers.length).setValues(toAppend);if(hm.map.NUMERO_CARTAO!==undefined)sh.getRange(start,hm.map.NUMERO_CARTAO+1,toAppend.length,1).setNumberFormat('@');}
    return {success:true,inseridos:toAppend.length,ignorados:skipped,totalDocumento:seed.length,aba:ADMIN_CARD_SHEET_};
  }finally{try{lock.releaseLock();}catch(_){}}
}
