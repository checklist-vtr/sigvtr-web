/******************************************************************
 * SIGVTR - Avarias Pendentes
 * Versão do pacote: 1.9.21
 * Exibe avarias até que o administrador altere a situação para resolvida.
 ******************************************************************/
function getPendingDamagesByPrefix_(prefixo) {
  const normalizedPrefix = String(prefixo || "").trim().toUpperCase();
  if (!normalizedPrefix) throw new Error("Prefixo não informado.");
  const ss = getSpreadsheet_();
  let vehicle = findVehicleByPrefixMobile_(normalizedPrefix);
  if ((!vehicle || !vehicle.id) && /^\d+$/.test(normalizedPrefix)) {
    const numericEquivalent = String(Number(normalizedPrefix));
    if (numericEquivalent !== "NaN") vehicle = findVehicleByPrefixMobile_(numericEquivalent);
  }
  if (!vehicle || !vehicle.id) return [];
  const sheet = requireSheet_(ss, SIGVTR.SHEETS.DAMAGES);
  if (sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data.shift().map(function(h){ return String(h).trim(); });
  ["ID_AVARIA","ID_VTR","Item","Descrição","Data Detecção","Situação"].forEach(function(h){
    if (headers.indexOf(h) === -1) throw new Error("Cabeçalho obrigatório não encontrado na aba AVARIAS: " + h);
  });
  const idx = {}; headers.forEach(function(h,i){ idx[h]=i; });
  const withdrawalPeople = buildWithdrawalPeopleIndex_(ss);
  return data.filter(function(row){
    const same = String(optionalCell_(row,idx,"ID_VTR")||"") === String(vehicle.id);
    const status = String(optionalCell_(row,idx,"Situação")||"").trim().toUpperCase();
    return same && (status === "PENDENTE" || status === "EM MANUTENÇÃO");
  }).map(function(row){
    const idRetirada = optionalCell_(row,idx,"ID_RETIRADA_DETECCAO") || "";
    const person = withdrawalPeople[String(idRetirada)] || {};
    return {idAvaria:optionalCell_(row,idx,"ID_AVARIA")||"",idVtr:optionalCell_(row,idx,"ID_VTR")||"",prefixo:vehicle.prefixo||normalizedPrefix,item:optionalCell_(row,idx,"Item")||"",descricao:optionalCell_(row,idx,"Descrição")||"",dataDeteccao:formatDateForApi_(optionalCell_(row,idx,"Data Detecção")),situacao:optionalCell_(row,idx,"Situação")||"",posicaoLocal:optionalCell_(row,idx,"Posição/Local")||optionalCell_(row,idx,"Item")||"",observacaoAdministracao:optionalCell_(row,idx,"Observação Administração")||"",dataUltimaAtualizacao:formatDateForApi_(optionalCell_(row,idx,"Data da Última Atualização")),registradoPor:formatRankAndWarName_(person.postoGraduacao,person.nome),postoGraduacaoRegistro:person.postoGraduacao||"",rgRegistro:person.rg||"",idRetiradaDeteccao:idRetirada};
  });
}
function buildWithdrawalPeopleIndex_(ss){
  const sheet=ss.getSheetByName(SIGVTR.SHEETS.WITHDRAWALS),result={};
  if(!sheet||sheet.getLastRow()<2)return result;
  const values=sheet.getDataRange().getValues();
  const headers=values.shift().map(function(h){return String(h).trim();});
  const id=headers.indexOf("ID_RETIRADA");
  const name=headers.indexOf("Motorista");
  const rank=headers.indexOf("Posto/Graduação");
  const rg=headers.indexOf("RG PMPA");
  const jsonIndex=headers.indexOf("ITENS_JSON");
  if(id<0)return result;
  values.forEach(function(row){
    let posto=rank>=0?String(row[rank]||"").trim():"";
    if(!posto&&jsonIndex>=0&&row[jsonIndex]){
      try{
        const details=JSON.parse(String(row[jsonIndex]));
        posto=String(details.postoGraduacao||"").trim();
      }catch(_){}
    }
    result[String(row[id]||"")]={
      nome:name>=0?row[name]:"",
      postoGraduacao:posto,
      rg:rg>=0?row[rg]:""
    };
  });
  return result;
}
function optionalCell_(row,idx,header){return Object.prototype.hasOwnProperty.call(idx,header)&&idx[header]>=0?row[idx[header]]:"";}
function formatDateForApi_(value){if(!value)return "";if(Object.prototype.toString.call(value)==="[object Date]"&&!isNaN(value.getTime()))return Utilities.formatDate(value,SIGVTR.TIMEZONE,"dd/MM/yyyy HH:mm");return String(value);}

function formatRankAndWarName_(rank,name){
  const safeRank=String(rank||"").trim();
  const safeName=String(name||"").trim();
  if(!safeRank)return safeName;
  if(!safeName)return safeRank;
  const normalizedName=safeName.toUpperCase();
  const normalizedRank=safeRank.toUpperCase();
  return normalizedName.indexOf(normalizedRank+" ")===0?safeName:safeRank+" "+safeName;
}


 