/******************************************************************
 * SIGVTR - Controle da Guarda
 * Arquivo: Controle_Guarda.gs
 * Etapa: 1 - Fundação de dados e integração cadastral
 * Versão do módulo: 0.1.0
 *
 * IMPORTANTE:
 * - Não altera o fluxo dos checklists Condutor/Fiscal.
 * - Não bloqueia VTR por status. A decisão operacional é física.
 * - Prefixo, placa, CPF e RG são tratados como texto.
 * - VTR "OUTROS" é snapshot operacional; não cria cadastro em VIATURAS.
 ******************************************************************/

const GUARDA = Object.freeze({
  MODULE_VERSION: '0.1.0',
  STATUS_TURNO: Object.freeze({ABERTO:'ABERTO',FECHADO:'FECHADO'}),
  STATUS_MOV: Object.freeze({
    AGUARDANDO_RETIRADA:'AGUARDANDO_CONFIRMACAO_RETIRADA',
    EM_USO:'EM_USO',
    AGUARDANDO_DEVOLUCAO:'AGUARDANDO_CONFIRMACAO_DEVOLUCAO',
    ENCERRADA:'ENCERRADA'
  }),
  VTR_ORIGEM: Object.freeze({CADASTRADA:'CADASTRADA',OUTROS:'OUTROS'}),
  TOKEN_TIPOS: Object.freeze({RETIRADA:'RETIRADA',DEVOLUCAO:'DEVOLUCAO'}),
  SHEET_HEADERS: Object.freeze({
    MILITARES: [
      'ID_MILITAR','CPF','RG','NOME_COMPLETO','NOME_GUERRA','POSTO_GRADUACAO','OPM',
      'ATIVO','CRIADO_EM','ATUALIZADO_EM'
    ],
    TURNOS: [
      'ID_TURNO','STATUS','INICIO_EM','FIM_EM','OPERADOR_INICIO_ID','OPERADOR_INICIO_NOME',
      'CMD_POSTO_GRAD_SNAPSHOT','CMD_RG_SNAPSHOT','CMD_NOME_SNAPSHOT','CMD_NOME_GUERRA_SNAPSHOT',
      'CMD_CONFIRMACAO_EM','MOVIMENTACOES_TOTAL','DEVOLVIDAS_TOTAL','EM_USO_TOTAL',
      'PDF_FILE_ID','PDF_GERADO_EM'
    ],
    MOVIMENTACOES: [
      'ID_MOVIMENTACAO','ID_TURNO','STATUS','CRIADA_EM','ATUALIZADA_EM',
      'VTR_ORIGEM','VTR_ID','VTR_PREFIXO_SNAPSHOT','VTR_PLACA_SNAPSHOT','VTR_MODELO_SNAPSHOT',
      'MILITAR_ID','MILITAR_POSTO_GRAD_SNAPSHOT','MILITAR_RG_SNAPSHOT','MILITAR_NOME_SNAPSHOT',
      'MILITAR_NOME_GUERRA_SNAPSHOT','MILITAR_CPF_SNAPSHOT','MILITAR_OPM_SNAPSHOT',
      'KM_RETIRADA','SOLICITACAO_RETIRADA_EM','CONFIRMACAO_RETIRADA_EM',
      'KM_DEVOLUCAO','SOLICITACAO_DEVOLUCAO_EM','CONFIRMACAO_DEVOLUCAO_EM','KM_PERCORRIDO',
      'OPERADOR_RETIRADA_ID','OPERADOR_RETIRADA_NOME','OPERADOR_DEVOLUCAO_ID','OPERADOR_DEVOLUCAO_NOME'
    ],
    TOKENS: [
      'ID_TOKEN','ID_MOVIMENTACAO','TIPO','TOKEN_HASH','CRIADO_EM','EXPIRA_EM','CONSUMIDO_EM','STATUS'
    ]
  })
});

const GUARDA_MILITARES_BASE_INICIAL = Object.freeze([
  {"cpf": "70386480206", "rg": "29182", "nome": "CLAUDMAR ELPÍDIO FERREIRA DIAS"},
  {"cpf": "74672517268", "rg": "36542", "nome": "ANA PAULA MONTELO DE OLIVEIRA"},
  {"cpf": "91554578272", "rg": "34535", "nome": "EVALDO FRANÇA PEREIRA"},
  {"cpf": "88477002215", "rg": "42772", "nome": "ADALBERTO ARAUJO DA SILVA"},
  {"cpf": "01190384205", "rg": "44519", "nome": "GESIEL SILVA DA SILVA"},
  {"cpf": "00236781278", "rg": "44472", "nome": "LAURO WILSON PINTO PEREIRA"},
  {"cpf": "60847468291", "rg": "32485", "nome": "CARLOS ALEXANDRE PRADO DA SILVA"},
  {"cpf": "80551670282", "rg": "36588", "nome": "RAULEMBERDE BAIA MATOS JUNIOR"},
  {"cpf": "90488962234", "rg": "36590", "nome": "RONI ADRIANO DA SILVA RABELO"},
  {"cpf": "03622425261", "rg": "44193", "nome": "KARINA BRANDÃO RODRIGUES"},
  {"cpf": "00855592290", "rg": "38994", "nome": "ANTÔNIO DIEGO SILVA NASCIMENTO"},
  {"cpf": "78412404220", "rg": "36639", "nome": "WELLINGTON SOUZA ROQUE"},
  {"cpf": "04590675242", "rg": "43688", "nome": "DANIEL ENRICO CRAVEIRO PELERANO"},
  {"cpf": "85336289272", "rg": "36653", "nome": "VANILDO CARVALHO DE SOUZA"},
  {"cpf": "86444670268", "rg": "39095", "nome": "ELIZABETH CRISTINA AVIZ PINTO"},
  {"cpf": "02366093276", "rg": "43958", "nome": "JOSÉ DÃ CLAY GUIMARÃES FERREIRA"},
  {"cpf": "01858762260", "rg": "44643", "nome": "LUIZ CEZAR FERREIRA VIRGOLINO"},
  {"cpf": "37914847291", "rg": "17245", "nome": "EDSON FERRAZ DOS SANTOS"},
  {"cpf": "43002951234", "rg": "28140", "nome": "ELI MOISÉS DE CAMPOS SILVA"},
  {"cpf": "26447878234", "rg": "21665", "nome": "SILVIO CEZAR BRAZ BEZERRA"},
  {"cpf": "69305927220", "rg": "34724", "nome": "MARCIO MENDES EVANGELISTA"},
  {"cpf": "69489432253", "rg": "32535", "nome": "JADER DA SILVA SARAIVA"},
  {"cpf": "84065915287", "rg": "37108", "nome": "MIZAEL FERREIRA NUNES"},
  {"cpf": "01754179207", "rg": "44906", "nome": "DAVID JHONATA SOUSA COSTA"},
  {"cpf": "88808513220", "rg": "36487", "nome": "DANILO ANTÔNIO MOURA DA ROCHA"},
  {"cpf": "76698610291", "rg": "32331", "nome": "FRANKLIN MORAES DA SILVA"},
  {"cpf": "72840374234", "rg": "34977", "nome": "MANOEL HENRIQUE MORAES PACHECO"},
  {"cpf": "00065745213", "rg": "38965", "nome": "ANTÔNIO CARLOS AZEVEDO DOS SANTOS"},
  {"cpf": "05730804377", "rg": "44321", "nome": "WELLYNGTON NASCIMENTO DE ARAÚJO"},
  {"cpf": "49627511234", "rg": "16935", "nome": "ANDRÉ LEVY DA SILVA"},
  {"cpf": "57872201291", "rg": "27369", "nome": "JESSÉ LEMOS DA SILVA"},
  {"cpf": "02098235267", "rg": "43136", "nome": "WESLEN FERREIRA MEIRELES"},
  {"cpf": "00348122292", "rg": "36581", "nome": "LUIS AUGUSTO SILVA PADILHA FILHO"},
  {"cpf": "02143329261", "rg": "40844", "nome": "ADELINO OLIVEIRA LIMA NETO"},
  {"cpf": "01039728200", "rg": "42081", "nome": "ANDERSON JEAN DA SILVA LOPES"},
  {"cpf": "56518129204", "rg": "28425", "nome": "JOSIAS PIEDADE GURJÃO"},
  {"cpf": "00478538243", "rg": "41574", "nome": "DAVIDSON SOARES GONÇALVES"},
  {"cpf": "60287942287", "rg": "32490", "nome": "EDISON DOS SANTOS E SILVA"},
  {"cpf": "71867090287", "rg": "36411", "nome": "MARLON DE OLIVEIRA VIDAL"},
  {"cpf": "88914305287", "rg": "39038", "nome": "BIANOR BRITO DA SILVA"},
  {"cpf": "86260510268", "rg": "41122", "nome": "NASLO ENRIQUE SOUSA PEREIRA"},
  {"cpf": "02788781210", "rg": "42370", "nome": "MARCOS ADRIEL FERREIRA DE SOUSA"},
  {"cpf": "01579832261", "rg": "44101", "nome": "WENDEL MARTINS LOPES"},
  {"cpf": "00150530242", "rg": "39494", "nome": "MARCONI LUCAS ALMEIDA"},
  {"cpf": "00389036285", "rg": "43187", "nome": "RAFAEL ARAUJO SILVA"},
  {"cpf": "91688442200", "rg": "39379", "nome": "LUIZ OTAVIO ALVES LADEIRA DE LIMA"},
  {"cpf": "95152040204", "rg": "42970", "nome": "SOLANGE PIRES DE FREITAS"},
  {"cpf": "00159535212", "rg": "34828", "nome": "WILLANDER DA SILVA MIRANDA"},
  {"cpf": "84298553272", "rg": "39183", "nome": "ÉDER JOSUÉ OLIVEIRA CAVALCANTE"},
  {"cpf": "00494217278", "rg": "43696", "nome": "DIEGO OLIVEIRA PIMENTEL"},
  {"cpf": "01074287258", "rg": "39642", "nome": "WENDELL FELIPE FILGUEIRAS DA COSTA"},
  {"cpf": "01132983231", "rg": "47076", "nome": "DAYARA DO SOCORRO FERREIRA COSTA"},
  {"cpf": "07258371281", "rg": "46799", "nome": "ALANA KAROLLINY DOS SANTOS PINHEIRO"},
  {"cpf": "03560178266", "rg": "47502", "nome": "JORDANNA DE ALMADA SENA"},
  {"cpf": "03477637232", "rg": "46881", "nome": "THATIANA MENDONÇA RIBEIRO"},
  {"cpf": "00738407267", "rg": "46791", "nome": "JANAINA DOS SANTOS SIQUEIRA MÉLO"},
  {"cpf": "75888289272", "rg": "36401", "nome": "WANDERSON CARLOS RIBEIRO DIONISIO"},
  {"cpf": "96232609204", "rg": "37400", "nome": "BRENDA LORENA DA CONCEIÇÃO SOUZA"},
  {"cpf": "82093636204", "rg": "39073", "nome": "CLEILTON DA SILVA DINIZ"},
  {"cpf": "90155246291", "rg": "40140", "nome": "WILLIAM ROGÉRIO NASCIMENTO BRANDÃO"},
  {"cpf": "84733128215", "rg": "37037", "nome": "JOÃO ALEXANDRE DE DEUS NASCIMENTO"},
  {"cpf": "11859329764", "rg": "41577", "nome": "MARCOS WAGNER DA SILVA SANTOS"},
  {"cpf": "00176730206", "rg": "40874", "nome": "REINALDO CARVALHO DA SILVA"},
  {"cpf": "05828438204", "rg": "46992", "nome": "DJAVAN DAVI DE MATOS"},
  {"cpf": "03864859255", "rg": "43889", "nome": "JOSÉ VÍTOR RODRIGUES POÇA"},
  {"cpf": "05403541209", "rg": "43875", "nome": "LEANDRO COSTA DA SILVA"},
  {"cpf": "94321469287", "rg": "43215", "nome": "GERSON DE CASTRO BORGES"},
  {"cpf": "03942292238", "rg": "42040", "nome": "RAFAEL LEANDRO ALMEIDA SOUTO"},
  {"cpf": "78960525200", "rg": "35528", "nome": "CARLOS ANDRÉ RODRIGUES SILVA"},
  {"cpf": "00828495289", "rg": "44341", "nome": "MARCUS ANDREY OLIVEIRA PINHEIRO"},
  {"cpf": "02945825252", "rg": "46631", "nome": "BEATRIZ DOS PRAZERES VIANA"},
  {"cpf": "01297084292", "rg": "44364", "nome": "CARLOS EDUARDO DE SOUZA MOURA"},
  {"cpf": "02438998237", "rg": "44068", "nome": "JOSE MATHEUS SEPÊDA DA SILVA MAIA DE FROTA ROLO"},
  {"cpf": "10853033498", "rg": "43881", "nome": "LAÉRCIO BESERRA DA SILVA"},
  {"cpf": "05360512245", "rg": "46733", "nome": "GEOVANNA DE OLIVEIRA ARAÚJO"},
  {"cpf": "04143415208", "rg": "46968", "nome": "EMANUELLE FRANÇA DE AVIZ"},
  {"cpf": "04833003228", "rg": "43723", "nome": "CLEBER VICTOR MORAIS CONCEIÇÃO"},
  {"cpf": "43994911249", "rg": "23161", "nome": "FRANCISCO JUNIOR RODRIGUES DA SILVA"},
  {"cpf": "41035437287", "rg": "22291", "nome": "FRANCISCO FERREIRA DE CARVALHO JÚNIOR"},
  {"cpf": "35462280220", "rg": "24414", "nome": "GEORGE SARGES CAVALHEIRO"},
  {"cpf": "33369283204", "rg": "22902", "nome": "NELSON MIRANDA SILVA"},
  {"cpf": "45427992200", "rg": "23311", "nome": "HENRIQUE CÉSAR OLIVEIRA DA SILVA"},
  {"cpf": "37754670259", "rg": "24420", "nome": "ELOI JUNQUEIRA ROCHA DE SENA"},
  {"cpf": "48067032220", "rg": "28816", "nome": "GLEIQUE SOUZA SILVA"},
  {"cpf": "80451993268", "rg": "36813", "nome": "IGOR PINTO CUNHA"},
  {"cpf": "65070593234", "rg": "34995", "nome": "MARCOS ROBERTO FIGUEIREDO BARBOSA"},
  {"cpf": "66124760282", "rg": "33229", "nome": "AUGUSTO FERREIRA DINIZ"},
  {"cpf": "70675120268", "rg": "32689", "nome": "PATRICK DAVID DA COSTA E SILVA"},
  {"cpf": "74226819268", "rg": "37464", "nome": "RODRIGO RAFAEL DAS CHAGAS SANTANA"},
  {"cpf": "53364899215", "rg": "36489", "nome": "CRISTIANO BERNARDO PACHECO"},
  {"cpf": "81937873234", "rg": "36751", "nome": "ANDERSON SÉRGIO MIRANDA DE MIRANDA"},
  {"cpf": "81900708272", "rg": "36660", "nome": "WILSON ARAÚJO DA RESSURREIÇÃO"},
  {"cpf": "80785620206", "rg": "36793", "nome": "JOÃO DE ARAUJO LIMA"},
  {"cpf": "96725141234", "rg": "38251", "nome": "JONEI GAIA COSTA"},
  {"cpf": "90712382291", "rg": "40130", "nome": "ROBSON MAX DOS REIS POLICARPO"},
  {"cpf": "85959901234", "rg": "39668", "nome": "KENNEDY DOS SANTOS CARDOSO"},
  {"cpf": "00042594243", "rg": "39079", "nome": "DANIEL ARAUJO GONÇALVES"},
  {"cpf": "89288807268", "rg": "39621", "nome": "WILLIAM WILL FONSECA AMARAL"},
  {"cpf": "01712253255", "rg": "39406", "nome": "LEANDRO DA COSTA FERREIRA MARTINS"},
  {"cpf": "02096033217", "rg": "39333", "nome": "KAIK GOMES DE CASTRO"},
  {"cpf": "08093668608", "rg": "40710", "nome": "JEFFERSON GUILHERME ANDRADE GOMES"},
  {"cpf": "01513824252", "rg": "41271", "nome": "RAFAEL CHRISTIANO NASCIMENTO"},
  {"cpf": "00055127274", "rg": "40806", "nome": "WELITON ESPIRITO SANTO SERRA"},
  {"cpf": "55265880259", "rg": "47327", "nome": "ÉRICKSON OTÁVIO COSTA DA COSTA"},
  {"cpf": "97457892249", "rg": "43738", "nome": "RUDNELSON VIEIRA MAGALHAES DIAS"},
  {"cpf": "00111691257", "rg": "43904", "nome": "LUCAS GOMES DOS SANTOS"},
  {"cpf": "02151868265", "rg": "44159", "nome": "JOAO VICTOR FERREIRA DA SILVA"},
  {"cpf": "03266519264", "rg": "47493", "nome": "MARCELO DOUGLAS SARMENTO CARVALHO"},
  {"cpf": "08057390336", "rg": "47235", "nome": "OSMAR HENRIQUE DE ALMEIDA NETO"},
  {"cpf": "71143059409", "rg": "47591", "nome": "BRENO PEREIRA DA SILVA"},
  {"cpf": "60805285253", "rg": "28787", "nome": "ADELSON SILVA DOS SANTOS"},
  {"cpf": "60115955291", "rg": "32788", "nome": "ALENILSON LOPES DO REMÉDIO"},
  {"cpf": "67467997272", "rg": "32360", "nome": "CARLOS JORGE DO VALE MENDES"},
  {"cpf": "68042833253", "rg": "34565", "nome": "RODRIGO MANOEL SILVA DOS SANTOS"},
  {"cpf": "52923940253", "rg": "34910", "nome": "ALDO DE JESUS PAMPLONA RIBEIRO"},
  {"cpf": "78085527200", "rg": "34511", "nome": "WANDERSON COSTA DE SOUZA"},
  {"cpf": "86968920204", "rg": "32868", "nome": "IGOR NAZARENO DO CARMO VIEIRA"},
  {"cpf": "92494510244", "rg": "37245", "nome": "SAMUEL RODRIGUES ALVES"},
  {"cpf": "00978200241", "rg": "36763", "nome": "RONAN BARBOSA DA SILVA"},
  {"cpf": "98852507272", "rg": "36716", "nome": "MARCOS VIANA CUNHA"},
  {"cpf": "80684823268", "rg": "36564", "nome": "FRANCK RODRIGUES BRÍCIO"},
  {"cpf": "77800583287", "rg": "35167", "nome": "DERGILSON ARAUJO DA RESSURREIÇÃO"},
  {"cpf": "83889779204", "rg": "36761", "nome": "MANOEL CLEBER MOURA TEIXEIRA"},
  {"cpf": "00196593263", "rg": "38469", "nome": "AMAZAI DA SILVA NASCIMENTO"},
  {"cpf": "00670854239", "rg": "41408", "nome": "URUBATAN FERREIRA NOBRE NETO"},
  {"cpf": "03635194247", "rg": "43375", "nome": "GILSON SOUZA PRINTES"},
  {"cpf": "98190911287", "rg": "39177", "nome": "DIEGSON DE CASSIO SANTOS COSTA"},
  {"cpf": "93628404215", "rg": "39521", "nome": "PAULO NAZARENO DA SILVEIRA PIEDADE"},
  {"cpf": "01950962237", "rg": "40268", "nome": "PABLO SANTOS DA SILVA"},
  {"cpf": "00054698219", "rg": "39133", "nome": "JONATA FERNANDO DA SILVA MARGALHO"},
  {"cpf": "01737071223", "rg": "41596", "nome": "DIEGO HENRIQUE ALVES LIMA"},
  {"cpf": "97035440291", "rg": "42925", "nome": "BRUNO DA SILVA CARNEIRO"},
  {"cpf": "60689467389", "rg": "47506", "nome": "ROMARIO DE PAIVA PEREIRA"},
  {"cpf": "04020660220", "rg": "47035", "nome": "JAILSON VITOR DA CRUZ GAIA"},
  {"cpf": "03411452110", "rg": "46874", "nome": "MARCELLO VITURINO DOS SANTOS BORGES"},
  {"cpf": "02268415295", "rg": "47462", "nome": "THIAGO ADILSON SANTOS OLIVEIRA"},
  {"cpf": "05333812152", "rg": "47253", "nome": "GABRIEL CARLOS DA SILVA DE ALMEIDA"},
  {"cpf": "03254781201", "rg": "47340", "nome": "IVANILDO CAXIAS DO ROSARIO"},
  {"cpf": "04118418231", "rg": "47474", "nome": "PAULO FELIPE DE SENA CORDEIRO"},
  {"cpf": "04536591362", "rg": "46990", "nome": "KLAYNILTON DE SOUSA TEIXEIRA"},
  {"cpf": "02537235231", "rg": "47587", "nome": "ADRIANO DE ALMEIDA MORAES"},
  {"cpf": "62650291346", "rg": "46969", "nome": "CARLOS ANDERSON DE SOUZA BARBOSA"},
  {"cpf": "02855311233", "rg": "44208", "nome": "HYGOR OLIVEIRA BARRAL"},
  {"cpf": "83629840230", "rg": "42739", "nome": "EDER ALEXANDRINO DE SOUZA"},
  {"cpf": "83379703249", "rg": "43130", "nome": "RAFAEL CERQUEIRA DE BRITO"},
  {"cpf": "01695844297", "rg": "43895", "nome": "FILIPE JOSÉ PEREIRA DA COSTA"},
  {"cpf": "03568146290", "rg": "43685", "nome": "WALLACY BAARS LOPES DE SOUSA"},
  {"cpf": "02008543218", "rg": "44174", "nome": "EDILSON SOARES DOS ANJOS FILHO"}
]);

function configurarControleGuardaEtapa1() {
  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const estrutura=ensureGuardStructure_();
    const importacao=importGuardInitialMilitaryBase_();
    return {success:true,moduleVersion:GUARDA.MODULE_VERSION,estrutura:estrutura,importacao:importacao};
  } finally {
    try{lock.releaseLock();}catch(_){}
  }
}

function ensureGuardStructure_() {
  const ss=getSpreadsheet_();
  const specs=[
    {name:SIGVTR.SHEETS.GUARD_MILITARY,headers:GUARDA.SHEET_HEADERS.MILITARES},
    {name:SIGVTR.SHEETS.GUARD_SHIFTS,headers:GUARDA.SHEET_HEADERS.TURNOS},
    {name:SIGVTR.SHEETS.GUARD_MOVEMENTS,headers:GUARDA.SHEET_HEADERS.MOVIMENTACOES},
    {name:SIGVTR.SHEETS.GUARD_TOKENS,headers:GUARDA.SHEET_HEADERS.TOKENS}
  ];
  const result=[];
  specs.forEach(function(spec){
    let sh=ss.getSheetByName(spec.name),created=false;
    if(!sh){sh=ss.insertSheet(spec.name);created=true;}
    ensureGuardHeaders_(sh,spec.headers);
    formatGuardTextColumns_(sh,spec.name);
    if(created){
      sh.setFrozenRows(1);
      sh.getRange(1,1,1,spec.headers.length).setFontWeight('bold');
    }
    result.push({sheet:spec.name,created:created,columns:spec.headers.length});
  });
  return result;
}

function ensureGuardHeaders_(sheet,headers) {
  const last=Math.max(1,sheet.getLastColumn());
  const current=sheet.getRange(1,1,1,last).getDisplayValues()[0].map(function(v){return String(v||'').trim();});
  if(current.length===1&&!current[0]&&sheet.getLastRow()<=1){
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    return;
  }
  headers.forEach(function(name){
    if(current.indexOf(name)<0){current.push(name);sheet.getRange(1,current.length).setValue(name);}
  });
}

function formatGuardTextColumns_(sheet,sheetName) {
  const hm=guardHeaderMap_(sheet);
  let cols=[];
  if(sheetName===SIGVTR.SHEETS.GUARD_MILITARY)cols=['ID_MILITAR','CPF','RG'];
  else if(sheetName===SIGVTR.SHEETS.GUARD_SHIFTS)cols=['ID_TURNO','CMD_RG_SNAPSHOT'];
  else if(sheetName===SIGVTR.SHEETS.GUARD_MOVEMENTS)cols=['ID_MOVIMENTACAO','ID_TURNO','VTR_ID','VTR_PREFIXO_SNAPSHOT','VTR_PLACA_SNAPSHOT','MILITAR_ID','MILITAR_RG_SNAPSHOT','MILITAR_CPF_SNAPSHOT'];
  else if(sheetName===SIGVTR.SHEETS.GUARD_TOKENS)cols=['ID_TOKEN','ID_MOVIMENTACAO','TOKEN_HASH'];
  cols.forEach(function(name){
    const index=hm.map[name];
    if(index!==undefined)sheet.getRange(2,index+1,Math.max(1,sheet.getMaxRows()-1),1).setNumberFormat('@');
  });
}

function guardHeaderMap_(sheet) {
  const headers=sheet.getRange(1,1,1,Math.max(1,sheet.getLastColumn())).getDisplayValues()[0];
  const map={};
  headers.forEach(function(h,i){map[String(h||'').trim()]=i;});
  return {headers:headers,map:map};
}

function guardText_(value,maxLen) {
  let s=String(value===null||value===undefined?'':value).trim();
  if(maxLen&&s.length>maxLen)s=s.slice(0,maxLen);
  return s;
}
function guardDigits_(value,maxLen) {
  let s=String(value===null||value===undefined?'':value).replace(/\D/g,'');
  if(maxLen&&s.length>maxLen)s=s.slice(0,maxLen);
  return s;
}
function guardUpper_(value,maxLen) {return guardText_(value,maxLen).toUpperCase();}
function guardNormalizeSearch_(value) {
  return guardUpper_(value,160).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function guardRowValue_(row,map,key) {return map[key]===undefined?'':row[map[key]];}

function importGuardInitialMilitaryBase_() {
  ensureGuardStructure_();
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_MILITARY);
  const hm=guardHeaderMap_(sh),values=sh.getDataRange().getDisplayValues();
  const byCpf={},byRg={};
  for(let r=1;r<values.length;r++){
    const cpf=guardDigits_(guardRowValue_(values[r],hm.map,'CPF'),11);
    const rg=guardDigits_(guardRowValue_(values[r],hm.map,'RG'),20);
    if(cpf)byCpf[cpf]=r+1;
    if(rg)byRg[rg]=r+1;
  }
  const now=new Date(),newRows=[];let existentes=0,conflitos=0;
  GUARDA_MILITARES_BASE_INICIAL.forEach(function(src){
    const cpf=guardDigits_(src.cpf,11),rg=guardDigits_(src.rg,20),nome=guardUpper_(src.nome,160);
    const rowCpf=cpf?byCpf[cpf]:0,rowRg=rg?byRg[rg]:0;
    if(rowCpf||rowRg){
      if(rowCpf&&rowRg&&rowCpf!==rowRg){conflitos++;return;}
      existentes++;return;
    }
    const row=new Array(hm.headers.length).fill('');
    row[hm.map.ID_MILITAR]='MIL-'+Utilities.getUuid();
    row[hm.map.CPF]=cpf;
    row[hm.map.RG]=rg;
    row[hm.map.NOME_COMPLETO]=nome;
    row[hm.map.ATIVO]='SIM';
    row[hm.map.CRIADO_EM]=now;
    row[hm.map.ATUALIZADO_EM]=now;
    newRows.push(row);
    const provisional=sh.getLastRow()+newRows.length;
    if(cpf)byCpf[cpf]=provisional;
    if(rg)byRg[rg]=provisional;
  });
  if(newRows.length){
    const start=sh.getLastRow()+1;
    sh.getRange(start,1,newRows.length,hm.headers.length).setValues(newRows);
    // Identificadores sempre como texto para preservar zeros à esquerda.
    if(hm.map.CPF!==undefined)sh.getRange(start,hm.map.CPF+1,newRows.length,1).setNumberFormat('@');
    if(hm.map.RG!==undefined)sh.getRange(start,hm.map.RG+1,newRows.length,1).setNumberFormat('@');
  }
  return {base:GUARDA_MILITARES_BASE_INICIAL.length,inseridos:newRows.length,existentes:existentes,conflitos:conflitos};
}

function searchGuardMilitary_(query,limit) {
  ensureGuardStructure_();
  const q=guardText_(query,160),digits=guardDigits_(q,20),text=guardNormalizeSearch_(q),max=Math.max(1,Math.min(Number(limit)||20,50));
  if(!q)return [];
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_MILITARY),hm=guardHeaderMap_(sh);
  const rows=sh.getDataRange().getDisplayValues(),out=[];
  for(let r=1;r<rows.length&&out.length<max;r++){
    const row=rows[r];
    if(guardUpper_(guardRowValue_(row,hm.map,'ATIVO'))==='NAO')continue;
    const cpf=guardDigits_(guardRowValue_(row,hm.map,'CPF'),11),rg=guardDigits_(guardRowValue_(row,hm.map,'RG'),20);
    const nome=guardText_(guardRowValue_(row,hm.map,'NOME_COMPLETO'),160),guerra=guardText_(guardRowValue_(row,hm.map,'NOME_GUERRA'),100);
    const matchDigits=digits&&(cpf.indexOf(digits)>=0||rg.indexOf(digits)>=0);
    const matchText=text&&(guardNormalizeSearch_(nome).indexOf(text)>=0||guardNormalizeSearch_(guerra).indexOf(text)>=0);
    if(matchDigits||matchText)out.push(guardMilitaryFromRow_(row,hm.map));
  }
  return out;
}

function getGuardMilitaryById_(id) {
  ensureGuardStructure_();
  const wanted=guardText_(id,80);if(!wanted)return null;
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_MILITARY),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getDisplayValues();
  for(let r=1;r<rows.length;r++)if(guardText_(guardRowValue_(rows[r],hm.map,'ID_MILITAR'),80)===wanted)return guardMilitaryFromRow_(rows[r],hm.map);
  return null;
}

function guardMilitaryFromRow_(row,map) {
  return {
    id:guardText_(guardRowValue_(row,map,'ID_MILITAR'),80),
    cpf:guardDigits_(guardRowValue_(row,map,'CPF'),11),rg:guardDigits_(guardRowValue_(row,map,'RG'),20),
    nomeCompleto:guardText_(guardRowValue_(row,map,'NOME_COMPLETO'),160),nomeGuerra:guardText_(guardRowValue_(row,map,'NOME_GUERRA'),100),
    postoGraduacao:guardText_(guardRowValue_(row,map,'POSTO_GRADUACAO'),80),opm:guardText_(guardRowValue_(row,map,'OPM'),100),
    ativo:guardUpper_(guardRowValue_(row,map,'ATIVO'))!=='NAO'
  };
}

function saveGuardMilitary_(data) {
  ensureGuardStructure_();
  data=data||{};
  const id=guardText_(data.id,80),cpf=guardDigits_(data.cpf,11),rg=guardDigits_(data.rg,20),nome=guardUpper_(data.nomeCompleto||data.nome,160),
        guerra=guardUpper_(data.nomeGuerra,100),posto=guardUpper_(data.postoGraduacao,80),opm=guardUpper_(data.opm,100);
  if(cpf&&cpf.length!==11)throw new Error('CPF deve conter 11 dígitos.');
  if(!rg)throw new Error('RG obrigatório.');
  if(!nome)throw new Error('Nome completo obrigatório.');
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_MILITARY),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getDisplayValues();
  let targetRow=0,cpfRow=0,rgRow=0;
  for(let r=1;r<rows.length;r++){
    const rid=guardText_(guardRowValue_(rows[r],hm.map,'ID_MILITAR'),80),rcpf=guardDigits_(guardRowValue_(rows[r],hm.map,'CPF'),11),rrg=guardDigits_(guardRowValue_(rows[r],hm.map,'RG'),20);
    if(id&&rid===id)targetRow=r+1;
    if(cpf&&rcpf===cpf)cpfRow=r+1;
    if(rg&&rrg===rg)rgRow=r+1;
  }
  if(cpfRow&&rgRow&&cpfRow!==rgRow)throw new Error('CPF e RG correspondem a cadastros diferentes. Revise os dados.');
  const duplicateRow=cpfRow||rgRow;
  if(targetRow&&duplicateRow&&targetRow!==duplicateRow)throw new Error('CPF ou RG já pertence a outro militar.');
  if(!targetRow)targetRow=duplicateRow;
  const now=new Date();
  if(targetRow){
    const current=sh.getRange(targetRow,1,1,hm.headers.length).getValues()[0];
    if(cpf)current[hm.map.CPF]=cpf;
    current[hm.map.RG]=rg;current[hm.map.NOME_COMPLETO]=nome;
    current[hm.map.NOME_GUERRA]=guerra;current[hm.map.POSTO_GRADUACAO]=posto;current[hm.map.OPM]=opm;
    current[hm.map.ATIVO]='SIM';current[hm.map.ATUALIZADO_EM]=now;
    sh.getRange(targetRow,1,1,hm.headers.length).setValues([current]);
  } else {
    const row=new Array(hm.headers.length).fill('');
    row[hm.map.ID_MILITAR]='MIL-'+Utilities.getUuid();row[hm.map.CPF]=cpf;row[hm.map.RG]=rg;row[hm.map.NOME_COMPLETO]=nome;
    row[hm.map.NOME_GUERRA]=guerra;row[hm.map.POSTO_GRADUACAO]=posto;row[hm.map.OPM]=opm;row[hm.map.ATIVO]='SIM';row[hm.map.CRIADO_EM]=now;row[hm.map.ATUALIZADO_EM]=now;
    targetRow=sh.getLastRow()+1;sh.getRange(targetRow,1,1,hm.headers.length).setValues([row]);
  }
  if(hm.map.CPF!==undefined)sh.getRange(targetRow,hm.map.CPF+1).setNumberFormat('@');
  if(hm.map.RG!==undefined)sh.getRange(targetRow,hm.map.RG+1).setNumberFormat('@');
  return guardMilitaryFromRow_(sh.getRange(targetRow,1,1,hm.headers.length).getDisplayValues()[0],hm.map);
}

function getGuardVehicles_() {
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.VEHICLES);
  if(!sh)throw new Error('Aba VIATURAS não encontrada.');
  const values=sh.getDataRange().getDisplayValues();if(!values.length)return [];
  const headers=values.shift().map(function(v){return String(v||'').trim();}),out=[];
  values.forEach(function(row){
    const id=guardText_(valueByHeader_(headers,row,'ID-VTR'),100),prefixo=guardText_(valueByHeader_(headers,row,'Prefixo'),40),placa=guardUpper_(valueByHeader_(headers,row,'Placa'),20);
    if(!id&&!prefixo&&!placa)return;
    out.push({
      id:id,prefixo:prefixo,placa:placa,
      modelo:guardText_(valueByHeader_(headers,row,'Modelo'),100),
      status:guardText_(valueByHeader_(headers,row,'Status'),50),
      kmAtual:guardText_(valueByHeader_(headers,row,'KM Atual'),40)
    });
  });
  return out;
}

function resolveGuardVehicleSnapshot_(data) {
  data=data||{};
  const origem=guardUpper_(data.origem||data.vtrOrigem,20)||GUARDA.VTR_ORIGEM.CADASTRADA;
  if(origem===GUARDA.VTR_ORIGEM.OUTROS){
    const prefixo=guardText_(data.prefixo,40),placa=guardUpper_(data.placa,20);
    if(!prefixo)throw new Error('Prefixo obrigatório para VTR Outros.');
    if(!placa)throw new Error('Placa obrigatória para VTR Outros.');
    return {origem:GUARDA.VTR_ORIGEM.OUTROS,id:'',prefixo:prefixo,placa:placa,modelo:''};
  }
  const id=guardText_(data.id||data.idVtr,100);if(!id)throw new Error('Selecione uma VTR cadastrada ou use Outros.');
  const vehicles=getGuardVehicles_();
  for(let i=0;i<vehicles.length;i++)if(vehicles[i].id===id)return {origem:GUARDA.VTR_ORIGEM.CADASTRADA,id:vehicles[i].id,prefixo:vehicles[i].prefixo,placa:vehicles[i].placa,modelo:vehicles[i].modelo};
  throw new Error('VTR cadastrada não encontrada.');
}

function guardMilitarySnapshot_(military) {
  if(!military)throw new Error('Militar não encontrado.');
  return {
    id:military.id||'',postoGraduacao:military.postoGraduacao||'',rg:military.rg||'',nomeCompleto:military.nomeCompleto||'',
    nomeGuerra:military.nomeGuerra||'',cpf:military.cpf||'',opm:military.opm||''
  };
}

function testarControleGuardaEtapa1() {
  ensureGuardStructure_();
  const ss=getSpreadsheet_();
  const sh=ss.getSheetByName(SIGVTR.SHEETS.GUARD_MILITARY);
  const hm=guardHeaderMap_(sh),rows=sh.getDataRange().getDisplayValues();
  const cpfSeen={},rgSeen={};let registros=0,cpfDuplicado=0,rgDuplicado=0,cpfZeroInicial=0;
  for(let r=1;r<rows.length;r++){
    const cpf=guardDigits_(guardRowValue_(rows[r],hm.map,'CPF'),11),rg=guardDigits_(guardRowValue_(rows[r],hm.map,'RG'),20),nome=guardText_(guardRowValue_(rows[r],hm.map,'NOME_COMPLETO'),160);
    if(!cpf&&!rg&&!nome)continue;
    registros++;
    if(cpf){if(cpfSeen[cpf])cpfDuplicado++;cpfSeen[cpf]=true;if(/^0/.test(cpf))cpfZeroInicial++;}
    if(rg){if(rgSeen[rg])rgDuplicado++;rgSeen[rg]=true;}
  }
  const baseCpf={},baseRg={};let baseCpfDup=0,baseRgDup=0,baseZeros=0;
  GUARDA_MILITARES_BASE_INICIAL.forEach(function(m){
    const cpf=guardDigits_(m.cpf,11),rg=guardDigits_(m.rg,20);
    if(baseCpf[cpf])baseCpfDup++;baseCpf[cpf]=true;
    if(baseRg[rg])baseRgDup++;baseRg[rg]=true;
    if(/^0/.test(cpf))baseZeros++;
  });
  const vtrOutros=resolveGuardVehicleSnapshot_({origem:'OUTROS',prefixo:'092',placa:'ABC1D23'});
  return {
    success:cpfDuplicado===0&&rgDuplicado===0&&baseCpfDup===0&&baseRgDup===0&&vtrOutros.prefixo==='092',
    moduleVersion:GUARDA.MODULE_VERSION,
    base:{registros:GUARDA_MILITARES_BASE_INICIAL.length,cpfDuplicado:baseCpfDup,rgDuplicado:baseRgDup,cpfComZeroInicial:baseZeros},
    planilha:{registros:registros,cpfDuplicado:cpfDuplicado,rgDuplicado:rgDuplicado,cpfComZeroInicial:cpfZeroInicial},
    testeVtrOutros:vtrOutros,
    sheets:[SIGVTR.SHEETS.GUARD_MILITARY,SIGVTR.SHEETS.GUARD_SHIFTS,SIGVTR.SHEETS.GUARD_MOVEMENTS,SIGVTR.SHEETS.GUARD_TOKENS]
  };
}
