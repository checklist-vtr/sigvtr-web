/******************************************************************
 * SIGVTR - Retenção, Capacidade e Arquivamento Controlado
 * Versão: 1.13.0-rc2
 *
 * Esta versão NÃO apaga dados. Ela monitora capacidade, gera pacote
 * de dados para download e registra a guarda em mídia física.
 ******************************************************************/
const ARCHIVE_INDEX_HEADERS = [
  "ID_ARQUIVO","Período Inicial","Período Final","Data Geração",
  "Responsável Geração","Nome Pacote","Link Pacote","Hash SHA-256",
  "Quantidade Abas","Quantidade Registros","Quantidade Fotos Indexadas",
  "Tipo de Mídia Física","Identificação da Mídia","Local de Guarda",
  "Data Confirmação Física","Responsável Confirmação","Status",
  "Observação","Última Atualização"
];
const ARCHIVE_CONFIG_DEFAULTS = {
  CELL_OPERATIONAL_LIMIT: 8000000,
  PHOTO_SCAN_LIMIT: 5000,
  WARNING_PERCENT: 60,
  PREPARE_PERCENT: 75,
  CRITICAL_PERCENT: 90,
  RETENTION_YEARS: 5
};
function ensureArchiveSheets_(){
  const ss=getSpreadsheet_();
  ensureSheetWithHeaders_(ss,"ARQUIVOS_HISTORICOS",ARCHIVE_INDEX_HEADERS);
}
function getArchiveConfig_(){
  const cfg=getConfig_(), out={};
  Object.keys(ARCHIVE_CONFIG_DEFAULTS).forEach(function(k){
    const n=Number(cfg[k]); out[k]=Number.isFinite(n)&&n>0?n:ARCHIVE_CONFIG_DEFAULTS[k];
  });
  return out;
}
function getAdminCapacityStatus_(){
  ensureArchiveSheets_();
  const ss=getSpreadsheet_(), cfg=getArchiveConfig_(), sheets=ss.getSheets();
  let totalCells=0,totalRows=0,totalDataRows=0;
  const sheetStats=sheets.map(function(sh){
    const rows=Math.max(sh.getMaxRows(),1), cols=Math.max(sh.getMaxColumns(),1), cells=rows*cols, dataRows=Math.max(sh.getLastRow()-1,0);
    totalCells+=cells;totalRows+=rows;totalDataRows+=dataRows;
    return {nome:sh.getName(),linhas:rows,colunas:cols,celulas:cells,registros:dataRows};
  }).sort(function(a,b){return b.celulas-a.celulas;});
  const photoStats=scanSigvtrPhotoStorage_(cfg.PHOTO_SCAN_LIMIT);
  const percent=Math.min(100,Math.round((totalCells/cfg.CELL_OPERATIONAL_LIMIT)*10000)/100);
  let level="NORMAL",message="Capacidade operacional dentro do limite configurado.";
  if(percent>=cfg.CRITICAL_PERCENT){level="CRITICO";message="Capacidade crítica. Prepare imediatamente o download e o arquivamento físico.";}
  else if(percent>=cfg.PREPARE_PERCENT){level="PREPARAR";message="Recomenda-se preparar o pacote de arquivamento.";}
  else if(percent>=cfg.WARNING_PERCENT){level="ATENCAO";message="Crescimento do banco requer acompanhamento.";}
  maybeCreateCapacityAlert_(level,percent,message);
  const archives=readSheetObjects_(ss.getSheetByName("ARQUIVOS_HISTORICOS"));
  return {
    banco:{percentual:percent,nivel:level,mensagem:message,celulas:totalCells,limiteOperacional:cfg.CELL_OPERATIONAL_LIMIT,linhasAlocadas:totalRows,registros:totalDataRows,abas:sheets.length,detalhes:sheetStats.slice(0,20)},
    fotos:photoStats,
    retencaoAnos:cfg.RETENTION_YEARS,
    limites:{atencao:cfg.WARNING_PERCENT,preparar:cfg.PREPARE_PERCENT,critico:cfg.CRITICAL_PERCENT},
    arquivosHistoricos:archives.sort(function(a,b){return dateValue_(b["Data Geração"])-dateValue_(a["Data Geração"]);}).slice(0,100)
  };
}
function scanSigvtrPhotoStorage_(limit){
  const root=getRootFolder_(), queue=[root], max=Math.min(Math.max(Number(limit)||5000,100),20000);
  let files=0,bytes=0,folders=0,truncated=false;
  while(queue.length&&files<max){
    const folder=queue.shift();folders++;
    const it=folder.getFiles();
    while(it.hasNext()&&files<max){const f=it.next();files++;bytes+=Number(f.getSize())||0;}
    if(it.hasNext()){truncated=true;break;}
    const sub=folder.getFolders();while(sub.hasNext())queue.push(sub.next());
  }
  if(queue.length)truncated=true;
  return {arquivosContados:files,pastasContadas:folders,bytesContados:bytes,tamanhoFormatado:formatBytesAdmin_(bytes),levantamentoParcial:truncated,limiteVarredura:max};
}
function maybeCreateCapacityAlert_(level,percent,message){
  if(["ATENCAO","PREPARAR","CRITICO"].indexOf(level)<0)return;
  const month=Utilities.formatDate(new Date(),SIGVTR.TIMEZONE,"yyyy-MM"), ref="CAPACIDADE:"+level+":"+month;
  createAdminAlert_({tipo:"CAPACIDADE",idReferencia:ref,titulo:"Capacidade do sistema: "+level,descricao:message+" Uso estimado: "+percent+"%.",now:new Date()});
}
function generateArchiveDataPackage_(input){
  ensureArchiveSheets_();
  const data=sanitizeArchiveRequest_(input), ss=getSpreadsheet_();
  {
    const now=new Date(), id="ARQ-"+Utilities.getUuid(), folder=getArchiveRootFolder_(), files=[], manifest={
      sistema:"SIGVTR 20º BPM",versao:SIGVTR.PACKAGE_VERSION,idArquivo:id,
      periodoInicial:data.periodoInicial,periodoFinal:data.periodoFinal,
      geradoEm:Utilities.formatDate(now,SIGVTR.TIMEZONE,"dd/MM/yyyy HH:mm:ss"),
      responsavel:data.responsavel,aviso:"Pacote de preservação. Nenhum dado foi apagado do banco ativo.",abas:[]
    };
    let totalRows=0;
    ss.getSheets().forEach(function(sh){
      if(sh.getName()==="ARQUIVOS_HISTORICOS")return;
      const values=sh.getDataRange().getDisplayValues();
      const filtered=filterRowsForArchivePeriod_(values,data.periodoInicial,data.periodoFinal);
      if(filtered.length<2)return;
      const csv=toCsvAdmin_(filtered), name=sanitizeFilename_(sh.getName()+".csv");
      const blob=Utilities.newBlob(csv,"text/csv",name);files.push(blob);totalRows+=filtered.length-1;
      manifest.abas.push({nome:sh.getName(),arquivo:name,registros:filtered.length-1,sha256:sha256HexAdmin_(blob.getBytes())});
    });
    const photoIndex=buildArchivePhotoIndex_(ss,data.periodoInicial,data.periodoFinal);
    const photoBlob=Utilities.newBlob(toCsvAdmin_(photoIndex.rows),"text/csv","FOTOS_INDEX.csv");files.push(photoBlob);
    manifest.fotos={indexadas:photoIndex.count,arquivo:"FOTOS_INDEX.csv",sha256:sha256HexAdmin_(photoBlob.getBytes()),observacao:"Nesta etapa o pacote contém o índice e os links das fotos. A liberação de espaço permanece bloqueada até confirmação de cópia física dos arquivos fotográficos."};
    const manifestBlob=Utilities.newBlob(JSON.stringify(manifest,null,2),"application/json","MANIFESTO.json");files.push(manifestBlob);
    const readme=Utilities.newBlob(buildArchiveReadme_(manifest),"text/plain","LEIA-ME.txt");files.push(readme);
    const zipName="SIGVTR_DADOS_"+data.periodoInicial.replace(/-/g,"")+"_"+data.periodoFinal.replace(/-/g,"")+"_"+Utilities.formatDate(now,SIGVTR.TIMEZONE,"yyyyMMdd_HHmmss")+".zip";
    const zip=Utilities.zip(files,zipName), zipFile=folder.createFile(zip), hash=sha256HexAdmin_(zip.getBytes());
    const index=requireSheet_(ss,"ARQUIVOS_HISTORICOS"), headers=requireHeaders_(index,ARCHIVE_INDEX_HEADERS);
    appendByHeaders_(index,headers,{"ID_ARQUIVO":id,"Período Inicial":data.periodoInicial,"Período Final":data.periodoFinal,"Data Geração":now,"Responsável Geração":data.responsavel,"Nome Pacote":zipName,"Link Pacote":zipFile.getUrl(),"Hash SHA-256":hash,"Quantidade Abas":manifest.abas.length,"Quantidade Registros":totalRows,"Quantidade Fotos Indexadas":photoIndex.count,"Status":"AGUARDANDO DOWNLOAD FÍSICO","Observação":data.observacao,"Última Atualização":now});
    appendLog_(ss,{idUsuario:data.responsavel,action:"GERAÇÃO DE PACOTE DE ARQUIVAMENTO",referenceId:id,description:"Pacote "+zipName+" gerado sem remoção de dados.",device:{},result:"SUCESSO",now:now});
    return {success:true,idArquivo:id,nomePacote:zipName,linkPacote:zipFile.getUrl(),hashSha256:hash,registros:totalRows,fotosIndexadas:photoIndex.count,aviso:"Nenhum dado foi removido. Faça o download para mídia física e depois registre a confirmação de guarda."};
  }
}
function confirmPhysicalArchive_(input){
  ensureArchiveSheets_();const d=sanitizePhysicalConfirmation_(input), sh=requireSheet_(getSpreadsheet_(),"ARQUIVOS_HISTORICOS"), values=sh.getDataRange().getValues(), heads=values[0].map(String), idI=heads.indexOf("ID_ARQUIVO"), now=new Date();
  for(let i=1;i<values.length;i++)if(String(values[i][idI])===d.idArquivo){
    setCellByHeaderAdmin_(sh,heads,i+1,"Tipo de Mídia Física",d.tipoMidia);setCellByHeaderAdmin_(sh,heads,i+1,"Identificação da Mídia",d.identificacaoMidia);setCellByHeaderAdmin_(sh,heads,i+1,"Local de Guarda",d.localGuarda);setCellByHeaderAdmin_(sh,heads,i+1,"Data Confirmação Física",now);setCellByHeaderAdmin_(sh,heads,i+1,"Responsável Confirmação",d.responsavel);setCellByHeaderAdmin_(sh,heads,i+1,"Status","ARQUIVADO EM MÍDIA FÍSICA");setCellByHeaderAdmin_(sh,heads,i+1,"Última Atualização",now);
    appendLog_(getSpreadsheet_(),{idUsuario:d.responsavel,action:"CONFIRMAÇÃO DE ARQUIVO FÍSICO",referenceId:d.idArquivo,description:d.tipoMidia+" · "+d.identificacaoMidia+" · "+d.localGuarda,device:{},result:"SUCESSO",now:now});return {success:true};
  }
  throw new Error("Arquivo histórico não encontrado.");
}
function sanitizeArchiveRequest_(input){
  if(!input||typeof input!=="object")throw new Error("Dados do arquivamento não informados.");
  const start=sanitizeDateText_(input.periodoInicial),end=sanitizeDateText_(input.periodoFinal);if(start>end)throw new Error("O período inicial não pode ser posterior ao período final.");
  const responsible=sanitizeOptionalOperationalText_(input.responsavel,80);if(responsible.length<2)throw new Error("Responsável obrigatório.");
  return {periodoInicial:start,periodoFinal:end,responsavel:responsible,observacao:sanitizeOptionalOperationalText_(input.observacao,300)};
}
function sanitizePhysicalConfirmation_(input){
  const allowed=["HD EXTERNO","SSD EXTERNO","PENDRIVE","MÍDIA ÓPTICA","SERVIDOR/REDE","OUTRO"],id=String((input||{}).idArquivo||"").trim(),type=String((input||{}).tipoMidia||"").trim().toUpperCase();
  if(!/^[A-Za-z0-9-]{1,100}$/.test(id)||allowed.indexOf(type)<0)throw new Error("Dados da mídia física inválidos.");
  const media=sanitizeOptionalOperationalText_(input.identificacaoMidia,100),loc=sanitizeOptionalOperationalText_(input.localGuarda,160),resp=sanitizeOptionalOperationalText_(input.responsavel,80);
  if(media.length<2||loc.length<2||resp.length<2)throw new Error("Preencha identificação, local de guarda e responsável.");
  return {idArquivo:id,tipoMidia:type,identificacaoMidia:media,localGuarda:loc,responsavel:resp};
}
function filterRowsForArchivePeriod_(values,start,end){
  if(!values.length)return [];const header=values[0], result=[header], s=new Date(start+"T00:00:00"), e=new Date(end+"T23:59:59");
  values.slice(1).forEach(function(row){const text=row.join(" "),dates=text.match(/\b\d{2}\/\d{2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g)||[];if(!dates.length){result.push(row);return;}const match=dates.some(function(d){let dt;if(/^\d{4}/.test(d))dt=new Date(d+"T12:00:00");else{const p=d.split("/");dt=new Date(p[2]+"-"+p[1]+"-"+p[0]+"T12:00:00");}return dt>=s&&dt<=e;});if(match)result.push(row);});
  return result;
}
function buildArchivePhotoIndex_(ss,start,end){
  const rows=[["ID_FOTO","ID_RETIRADA","Tipo Foto","Nome Arquivo","Link Drive","Data"]], objs=readSheetObjects_(ss.getSheetByName(SIGVTR.SHEETS.PHOTOS));let count=0;
  objs.forEach(function(r){const dt=parseBrazilDate_(formatDateForApi_(r.Data));if(dt&&dt>=new Date(start+"T00:00:00")&&dt<=new Date(end+"T23:59:59")){rows.push([r.ID_FOTO||"",r.ID_RETIRADA||"",r["Tipo Foto"]||"",r["Nome Arquivo"]||"",r["Link Drive"]||"",formatDateForApi_(r.Data)]);count++;}});return {rows:rows,count:count};
}
function getArchiveRootFolder_(){const root=getRootFolder_();return childFolder_(root,"ARQUIVAMENTOS");}
function buildArchiveReadme_(m){return "SIGVTR 20º BPM - PACOTE DE ARQUIVAMENTO\n\nID: "+m.idArquivo+"\nPeríodo: "+m.periodoInicial+" a "+m.periodoFinal+"\nGerado em: "+m.geradoEm+"\nResponsável: "+m.responsavel+"\n\nIMPORTANTE:\n1. Este pacote não autoriza exclusão dos dados ativos.\n2. Copie o ZIP para mídia física institucional.\n3. Confira o hash SHA-256 registrado no Painel Administrativo.\n4. Registre no painel a identificação da mídia e o local de guarda.\n5. As fotos estão catalogadas em FOTOS_INDEX.csv; a cópia física integral das fotos deve ser confirmada antes de qualquer futura liberação de espaço.\n";}
function toCsvAdmin_(rows){return rows.map(function(row){return row.map(function(v){const s=String(v==null?"":v).replace(/"/g,'""');return '"'+s+'"';}).join(",");}).join("\r\n");}
function sha256HexAdmin_(bytes){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,bytes).map(function(b){const v=(b+256)%256;return ("0"+v.toString(16)).slice(-2);}).join("");}
function setCellByHeaderAdmin_(sh,heads,row,header,value){const i=heads.indexOf(header);if(i>=0)sh.getRange(row,i+1).setValue(value);}
function formatBytesAdmin_(bytes){const n=Number(bytes)||0;if(n<1024)return n+" B";const units=["KB","MB","GB","TB"],i=Math.min(Math.floor(Math.log(n)/Math.log(1024))-1,units.length-1);return (n/Math.pow(1024,i+1)).toFixed(i>0?2:1)+" "+units[i];}
