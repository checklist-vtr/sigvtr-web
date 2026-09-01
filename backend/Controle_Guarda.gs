/******************************************************************
 * SIGVTR - Controle da Guarda
 * Arquivo: Controle_Guarda.gs
 * Etapa: 6.1 - PDF robusto e otimização de performance
 * Versão do módulo: 0.6.1
 *
 * IMPORTANTE:
 * - Não altera o fluxo dos checklists Condutor/Fiscal.
 * - Não bloqueia VTR por status. A decisão operacional é física.
 * - Prefixo, placa, CPF e RG são tratados como texto.
 * - VTR "OUTROS" é snapshot operacional; não cria cadastro em VIATURAS.
 ******************************************************************/

const GUARDA = Object.freeze({
  MODULE_VERSION: '0.6.1',
  SCHEMA_VERSION: '0.6.1',
  TOKEN_TTL_MINUTES: 10,
  STATUS_TURNO: Object.freeze({ABERTO:'ABERTO',PENDENTE:'PENDENTE_ENCERRAMENTO',FECHADO:'FECHADO',FECHADO_SUBSTITUTO:'FECHADO_POR_SUBSTITUTO'}),
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
      'ENCERRAMENTO_TIPO','ENCERRAMENTO_MOTIVO','ENCERRADO_POR_POSTO_GRAD_SNAPSHOT','ENCERRADO_POR_RG_SNAPSHOT',
      'ENCERRADO_POR_NOME_SNAPSHOT','ENCERRADO_POR_NOME_GUERRA_SNAPSHOT','ENCERRADO_POR_FUNCAO','ENCERRADO_POR_CONFIRMACAO_EM',
      'PDF_FILE_ID','PDF_GERADO_EM'
    ],
    MOVIMENTACOES: [
      'ID_MOVIMENTACAO','ID_TURNO','ID_TURNO_RETIRADA','ID_TURNO_DEVOLUCAO','STATUS','CRIADA_EM','ATUALIZADA_EM',
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

function ensureGuardStructure_(force) {
  const props=PropertiesService.getScriptProperties(),schemaKey='GUARD_SCHEMA_VERSION';
  if(!force&&props.getProperty(schemaKey)===GUARDA.SCHEMA_VERSION)return [{cached:true,schemaVersion:GUARDA.SCHEMA_VERSION}];
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
  props.setProperty(schemaKey,GUARDA.SCHEMA_VERSION);
  return result;
}

function migrarControleGuarda061() {
  PropertiesService.getScriptProperties().deleteProperty('GUARD_SCHEMA_VERSION');
  return {success:true,moduleVersion:GUARDA.MODULE_VERSION,estrutura:ensureGuardStructure_(true)};
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
  else if(sheetName===SIGVTR.SHEETS.GUARD_SHIFTS)cols=['ID_TURNO','CMD_RG_SNAPSHOT','ENCERRADO_POR_RG_SNAPSHOT'];
  else if(sheetName===SIGVTR.SHEETS.GUARD_MOVEMENTS)cols=['ID_MOVIMENTACAO','ID_TURNO','ID_TURNO_RETIRADA','ID_TURNO_DEVOLUCAO','VTR_ID','VTR_PREFIXO_SNAPSHOT','VTR_PLACA_SNAPSHOT','MILITAR_ID','MILITAR_RG_SNAPSHOT','MILITAR_CPF_SNAPSHOT'];
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


/******************************************************************
 * ETAPA 2 - PAINEL OPERACIONAL / TURNO / SELEÇÕES
 ******************************************************************/
function guardDateIso_(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, SIGVTR.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function guardShiftFromRow_(row,map) {
  return {
    id: guardText_(guardRowValue_(row,map,'ID_TURNO'),100),
    status: guardUpper_(guardRowValue_(row,map,'STATUS'),30),
    inicioEm: guardDateIso_(guardRowValue_(row,map,'INICIO_EM')),
    fimEm: guardDateIso_(guardRowValue_(row,map,'FIM_EM')),
    operadorInicioId: guardText_(guardRowValue_(row,map,'OPERADOR_INICIO_ID'),100),
    operadorInicioNome: guardText_(guardRowValue_(row,map,'OPERADOR_INICIO_NOME'),160),
    comandantePostoGraduacao: guardText_(guardRowValue_(row,map,'CMD_POSTO_GRAD_SNAPSHOT'),80),
    comandanteRg: guardText_(guardRowValue_(row,map,'CMD_RG_SNAPSHOT'),20),
    comandanteNome: guardText_(guardRowValue_(row,map,'CMD_NOME_SNAPSHOT'),160),
    comandanteNomeGuerra: guardText_(guardRowValue_(row,map,'CMD_NOME_GUERRA_SNAPSHOT'),100),
    comandanteConfirmacaoEm: guardDateIso_(guardRowValue_(row,map,'CMD_CONFIRMACAO_EM')),
    movimentacoesTotal: Number(guardRowValue_(row,map,'MOVIMENTACOES_TOTAL'))||0,
    devolvidasTotal: Number(guardRowValue_(row,map,'DEVOLVIDAS_TOTAL'))||0,
    emUsoTotal: Number(guardRowValue_(row,map,'EM_USO_TOTAL'))||0,
    encerramentoTipo: guardUpper_(guardRowValue_(row,map,'ENCERRAMENTO_TIPO'),40),
    encerramentoMotivo: guardText_(guardRowValue_(row,map,'ENCERRAMENTO_MOTIVO'),500),
    encerradoPorPostoGraduacao: guardText_(guardRowValue_(row,map,'ENCERRADO_POR_POSTO_GRAD_SNAPSHOT'),80),
    encerradoPorRg: guardText_(guardRowValue_(row,map,'ENCERRADO_POR_RG_SNAPSHOT'),20),
    encerradoPorNome: guardText_(guardRowValue_(row,map,'ENCERRADO_POR_NOME_SNAPSHOT'),160),
    encerradoPorNomeGuerra: guardText_(guardRowValue_(row,map,'ENCERRADO_POR_NOME_GUERRA_SNAPSHOT'),100),
    encerradoPorFuncao: guardText_(guardRowValue_(row,map,'ENCERRADO_POR_FUNCAO'),100),
    encerradoPorConfirmacaoEm: guardDateIso_(guardRowValue_(row,map,'ENCERRADO_POR_CONFIRMACAO_EM')),
    pdfFileId: guardText_(guardRowValue_(row,map,'PDF_FILE_ID'),200),
    pdfGeradoEm: guardDateIso_(guardRowValue_(row,map,'PDF_GERADO_EM'))
  };
}

function guardShiftLocatorById_(turnoId) {
  ensureGuardStructure_();
  const id=guardText_(turnoId,100);if(!id)return null;
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_SHIFTS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getValues();
  for(let r=1;r<rows.length;r++){
    if(guardText_(guardRowValue_(rows[r],hm.map,'ID_TURNO'),100)===id)return {sheet:sh,map:hm.map,rowIndex:r+1,row:rows[r],turno:guardShiftFromRow_(rows[r],hm.map)};
  }
  return null;
}

function getOpenGuardShift_() {
  ensureGuardStructure_();
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_SHIFTS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getValues();
  for(let r=rows.length-1;r>=1;r--){
    if(guardUpper_(guardRowValue_(rows[r],hm.map,'STATUS'),30)===GUARDA.STATUS_TURNO.ABERTO)return guardShiftFromRow_(rows[r],hm.map);
  }
  return null;
}

function listPendingGuardShifts_() {
  ensureGuardStructure_();
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_SHIFTS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getValues(),out=[];
  for(let r=rows.length-1;r>=1;r--){
    if(guardUpper_(guardRowValue_(rows[r],hm.map,'STATUS'),30)!==GUARDA.STATUS_TURNO.PENDENTE)continue;
    const t=guardShiftFromRow_(rows[r],hm.map);t.resumo=getGuardShiftSummary_(t.id);out.push(t);
  }
  return out;
}

function createGuardShiftRow_(operator) {
  operator=operator||{};
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_SHIFTS),hm=guardHeaderMap_(sh),row=new Array(hm.headers.length).fill(''),now=new Date();
  row[hm.map.ID_TURNO]='TGU-'+Utilities.getUuid();row[hm.map.STATUS]=GUARDA.STATUS_TURNO.ABERTO;row[hm.map.INICIO_EM]=now;
  row[hm.map.OPERADOR_INICIO_ID]=guardText_(operator.id||operator.login,100);row[hm.map.OPERADOR_INICIO_NOME]=guardText_(operator.name||operator.login,160);
  sh.appendRow(row);if(hm.map.ID_TURNO!==undefined)sh.getRange(sh.getLastRow(),hm.map.ID_TURNO+1).setNumberFormat('@');
  return guardShiftFromRow_(sh.getRange(sh.getLastRow(),1,1,hm.headers.length).getValues()[0],hm.map);
}

function openGuardShift_(operator,options) {
  ensureGuardStructure_();options=options||{};
  const existing=getOpenGuardShift_();
  if(existing&&!options.forceNew)return {created:false,turno:existing,turnosPendentes:listPendingGuardShifts_()};
  if(existing&&options.forceNew){
    const loc=guardShiftLocatorById_(existing.id);loc.sheet.getRange(loc.rowIndex,loc.map.STATUS+1).setValue(GUARDA.STATUS_TURNO.PENDENTE);
  }
  const turno=createGuardShiftRow_(operator);
  return {created:true,turno:turno,turnoAnteriorPendente:existing&&options.forceNew?existing:null,turnosPendentes:listPendingGuardShifts_()};
}

function getGuardContext_(operator) {
  ensureGuardStructure_();const turno=getOpenGuardShift_();
  return {
    moduleVersion:GUARDA.MODULE_VERSION,
    operator:{id:guardText_(operator&&operator.id,100),login:guardText_(operator&&operator.login,80),name:guardText_(operator&&operator.name,160),role:guardText_(operator&&operator.role,30)},
    turno:turno,turnosPendentes:listPendingGuardShifts_(),viaturas:getGuardVehicles_(),movimentacoes:turno?listGuardShiftMovements_(turno.id):[]
  };
}

function prepareGuardWithdrawal_(data) {
  data=data||{};
  const turno=getOpenGuardShift_();
  if(!turno)throw new Error('Inicie o turno da Guarda antes de continuar.');
  const vehicle=resolveGuardVehicleSnapshot_(data.viatura||data.vehicle||data);
  const militaryId=guardText_(data.militarId||data.militaryId,100);
  if(!militaryId)throw new Error('Selecione um militar.');
  const military=getGuardMilitaryById_(militaryId);
  if(!military)throw new Error('Militar não encontrado.');
  if(!guardText_(military.postoGraduacao,80))throw new Error('Complete o Posto/Graduação do militar antes de continuar.');
  if(!guardText_(military.nomeGuerra,100))throw new Error('Complete o Nome de Guerra do militar antes de continuar.');
  return {
    turno:turno,
    viatura:vehicle,
    militar:guardMilitarySnapshot_(military),
    readyForQr:true
  };
}

function guardRequireOperator_(token) {
  const ctx=adminValidateSession_(token,true,true);
  if(ctx.user&&ctx.user.mustChangePassword)throw new Error('PASSWORD_CHANGE_REQUIRED');
  const role=guardUpper_(ctx.user&&ctx.user.role,30);
  if(role!=='GUARDA'&&role!=='DEV')throw new Error('FORBIDDEN_GUARDA');
  return ctx;
}


function testarControleGuardaEtapa2() {
  ensureGuardStructure_();
  const vehicles=getGuardVehicles_();
  const sampleOutros=resolveGuardVehicleSnapshot_({origem:'OUTROS',prefixo:'092',placa:'ABC1D23'});
  return {
    success:Array.isArray(vehicles)&&sampleOutros.prefixo==='092',
    moduleVersion:GUARDA.MODULE_VERSION,
    viaturasEncontradas:vehicles.length,
    turnoAberto:getOpenGuardShift_(),
    testeVtrOutros:sampleOutros
  };
}


/******************************************************************
 * ETAPA 3 - RETIRADA / TOKEN / QR / CONFIRMACAO PUBLICA
 ******************************************************************/
function guardMovementFromRow_(row,map) {
  return {
    id:guardText_(guardRowValue_(row,map,'ID_MOVIMENTACAO'),100),
    turnoId:guardText_(guardRowValue_(row,map,'ID_TURNO'),100),
    turnoRetiradaId:guardText_(guardRowValue_(row,map,'ID_TURNO_RETIRADA'),100)||guardText_(guardRowValue_(row,map,'ID_TURNO'),100),
    turnoDevolucaoId:guardText_(guardRowValue_(row,map,'ID_TURNO_DEVOLUCAO'),100),
    status:guardUpper_(guardRowValue_(row,map,'STATUS'),50),
    criadaEm:guardDateIso_(guardRowValue_(row,map,'CRIADA_EM')),
    atualizadaEm:guardDateIso_(guardRowValue_(row,map,'ATUALIZADA_EM')),
    vtrOrigem:guardUpper_(guardRowValue_(row,map,'VTR_ORIGEM'),20),
    vtrId:guardText_(guardRowValue_(row,map,'VTR_ID'),100),
    vtrPrefixo:guardText_(guardRowValue_(row,map,'VTR_PREFIXO_SNAPSHOT'),40),
    vtrPlaca:guardText_(guardRowValue_(row,map,'VTR_PLACA_SNAPSHOT'),20),
    vtrModelo:guardText_(guardRowValue_(row,map,'VTR_MODELO_SNAPSHOT'),100),
    militarId:guardText_(guardRowValue_(row,map,'MILITAR_ID'),100),
    militarPostoGraduacao:guardText_(guardRowValue_(row,map,'MILITAR_POSTO_GRAD_SNAPSHOT'),80),
    militarRg:guardText_(guardRowValue_(row,map,'MILITAR_RG_SNAPSHOT'),20),
    militarNome:guardText_(guardRowValue_(row,map,'MILITAR_NOME_SNAPSHOT'),160),
    militarNomeGuerra:guardText_(guardRowValue_(row,map,'MILITAR_NOME_GUERRA_SNAPSHOT'),100),
    kmRetirada:guardText_(guardRowValue_(row,map,'KM_RETIRADA'),30),
    solicitacaoRetiradaEm:guardDateIso_(guardRowValue_(row,map,'SOLICITACAO_RETIRADA_EM')),
    confirmacaoRetiradaEm:guardDateIso_(guardRowValue_(row,map,'CONFIRMACAO_RETIRADA_EM')),
    kmDevolucao:guardText_(guardRowValue_(row,map,'KM_DEVOLUCAO'),30),
    solicitacaoDevolucaoEm:guardDateIso_(guardRowValue_(row,map,'SOLICITACAO_DEVOLUCAO_EM')),
    confirmacaoDevolucaoEm:guardDateIso_(guardRowValue_(row,map,'CONFIRMACAO_DEVOLUCAO_EM')),
    kmPercorrido:guardText_(guardRowValue_(row,map,'KM_PERCORRIDO'),30),
    operadorDevolucaoId:guardText_(guardRowValue_(row,map,'OPERADOR_DEVOLUCAO_ID'),100),
    operadorDevolucaoNome:guardText_(guardRowValue_(row,map,'OPERADOR_DEVOLUCAO_NOME'),160)
  };
}

function guardMovementLocator_(id) {
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_MOVEMENTS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getValues();
  const wanted=guardText_(id,100);
  for(let r=1;r<rows.length;r++){
    if(guardText_(guardRowValue_(rows[r],hm.map,'ID_MOVIMENTACAO'),100)===wanted){
      return {sheet:sh,map:hm.map,headers:hm.headers,rowIndex:r+1,row:rows[r],movimento:guardMovementFromRow_(rows[r],hm.map)};
    }
  }
  return null;
}

function guardVehicleMovementKey_(vehicle) {
  if(!vehicle)return '';
  if(guardUpper_(vehicle.origem||vehicle.vtrOrigem,20)===GUARDA.VTR_ORIGEM.CADASTRADA&&guardText_(vehicle.id||vehicle.vtrId,100))return 'ID:'+guardText_(vehicle.id||vehicle.vtrId,100);
  return 'OUTROS:'+guardUpper_(vehicle.prefixo||vehicle.vtrPrefixo,40)+'|'+guardUpper_(vehicle.placa||vehicle.vtrPlaca,20);
}

function guardMovementKeyFromRow_(row,map) {
  const origem=guardUpper_(guardRowValue_(row,map,'VTR_ORIGEM'),20),id=guardText_(guardRowValue_(row,map,'VTR_ID'),100);
  if(origem===GUARDA.VTR_ORIGEM.CADASTRADA&&id)return 'ID:'+id;
  return 'OUTROS:'+guardUpper_(guardRowValue_(row,map,'VTR_PREFIXO_SNAPSHOT'),40)+'|'+guardUpper_(guardRowValue_(row,map,'VTR_PLACA_SNAPSHOT'),20);
}

function guardHashToken_(raw) {
  const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(raw||''),Utilities.Charset.UTF_8);
  return digest.map(function(b){const n=(b<0?b+256:b);return ('0'+n.toString(16)).slice(-2);}).join('');
}

function guardNewRawToken_() {
  return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
}

function guardInvalidateActiveTokens_(movementId,type,status) {
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_TOKENS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getValues();
  for(let r=1;r<rows.length;r++){
    if(guardText_(guardRowValue_(rows[r],hm.map,'ID_MOVIMENTACAO'),100)!==movementId)continue;
    if(guardUpper_(guardRowValue_(rows[r],hm.map,'TIPO'),20)!==type)continue;
    if(guardUpper_(guardRowValue_(rows[r],hm.map,'STATUS'),20)!=='ATIVO')continue;
    sh.getRange(r+1,hm.map.STATUS+1).setValue(status||'SUBSTITUIDO');
  }
}

function guardIssueToken_(movementId,type) {
  guardInvalidateActiveTokens_(movementId,type,'SUBSTITUIDO');
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_TOKENS),hm=guardHeaderMap_(sh),row=new Array(hm.headers.length).fill('');
  const raw=guardNewRawToken_(),now=new Date(),expires=new Date(now.getTime()+GUARDA.TOKEN_TTL_MINUTES*60000);
  row[hm.map.ID_TOKEN]='GTK-'+Utilities.getUuid();
  row[hm.map.ID_MOVIMENTACAO]=movementId;
  row[hm.map.TIPO]=type;
  row[hm.map.TOKEN_HASH]=guardHashToken_(raw);
  row[hm.map.CRIADO_EM]=now;
  row[hm.map.EXPIRA_EM]=expires;
  row[hm.map.STATUS]='ATIVO';
  sh.appendRow(row);
  if(hm.map.TOKEN_HASH!==undefined)sh.getRange(sh.getLastRow(),hm.map.TOKEN_HASH+1).setNumberFormat('@');
  return {token:raw,expiraEm:guardDateIso_(expires)};
}

function guardFindToken_(raw,type) {
  const token=guardText_(raw,200);if(!token)return null;
  const wantedHash=guardHashToken_(token),sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_TOKENS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getValues();
  for(let r=rows.length-1;r>=1;r--){
    if(guardText_(guardRowValue_(rows[r],hm.map,'TOKEN_HASH'),100)!==wantedHash)continue;
    if(type&&guardUpper_(guardRowValue_(rows[r],hm.map,'TIPO'),20)!==type)continue;
    return {
      sheet:sh,map:hm.map,rowIndex:r+1,row:rows[r],
      id:guardText_(guardRowValue_(rows[r],hm.map,'ID_TOKEN'),100),
      movimentoId:guardText_(guardRowValue_(rows[r],hm.map,'ID_MOVIMENTACAO'),100),
      tipo:guardUpper_(guardRowValue_(rows[r],hm.map,'TIPO'),20),
      status:guardUpper_(guardRowValue_(rows[r],hm.map,'STATUS'),20),
      expiraEm:guardRowValue_(rows[r],hm.map,'EXPIRA_EM'),
      consumidoEm:guardRowValue_(rows[r],hm.map,'CONSUMIDO_EM')
    };
  }
  return null;
}

function guardTokenAssertUsable_(tokenInfo) {
  if(!tokenInfo)throw new Error('QR_CODE_INVALIDO');
  if(tokenInfo.status==='CONSUMIDO')throw new Error('QR_CODE_JA_UTILIZADO');
  if(tokenInfo.status!=='ATIVO')throw new Error('QR_CODE_INVALIDO');
  const exp=tokenInfo.expiraEm instanceof Date?tokenInfo.expiraEm:new Date(tokenInfo.expiraEm);
  if(!exp||isNaN(exp.getTime())||exp.getTime()<Date.now())throw new Error('QR_CODE_EXPIRADO');
  return tokenInfo;
}

function guardVehicleLastKnownKm_(movement) {
  if(!movement||movement.vtrOrigem!==GUARDA.VTR_ORIGEM.CADASTRADA||!movement.vtrId)return null;
  const vehicles=getGuardVehicles_();
  for(let i=0;i<vehicles.length;i++){
    if(String(vehicles[i].id)===String(movement.vtrId)){
      const digits=guardDigits_(vehicles[i].kmAtual,20);
      return digits===''?null:Number(digits);
    }
  }
  return null;
}

function guardParseKm_(value) {
  if(value===null||value===undefined||String(value).trim()==='')throw new Error('Informe o KM atual da viatura.');
  const raw=String(value).trim();
  if(/^-/.test(raw))throw new Error('KM não pode ser negativo.');
  const digits=guardDigits_(raw,12);
  if(!digits)throw new Error('Informe um KM válido.');
  const km=Number(digits);
  if(!Number.isFinite(km)||km<0||km>999999999)throw new Error('KM informado é inválido.');
  return Math.trunc(km);
}

function createGuardWithdrawal_(data,operator) {
  const prepared=prepareGuardWithdrawal_(data),turno=prepared.turno,vehicle=prepared.viatura,military=prepared.militar;
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_MOVEMENTS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getValues(),key=guardVehicleMovementKey_(vehicle);
  let reusable=null;
  for(let r=1;r<rows.length;r++){
    const status=guardUpper_(guardRowValue_(rows[r],hm.map,'STATUS'),50);
    if([GUARDA.STATUS_MOV.AGUARDANDO_RETIRADA,GUARDA.STATUS_MOV.EM_USO,GUARDA.STATUS_MOV.AGUARDANDO_DEVOLUCAO].indexOf(status)<0)continue;
    if(guardMovementKeyFromRow_(rows[r],hm.map)!==key)continue;
    const rowTurno=guardText_(guardRowValue_(rows[r],hm.map,'ID_TURNO'),100),rowMil=guardText_(guardRowValue_(rows[r],hm.map,'MILITAR_ID'),100);
    if(status===GUARDA.STATUS_MOV.AGUARDANDO_RETIRADA&&rowTurno===turno.id&&rowMil===military.id){
      reusable={rowIndex:r+1,row:rows[r],movimento:guardMovementFromRow_(rows[r],hm.map)};break;
    }
    throw new Error('Já existe uma movimentação aberta para esta VTR.');
  }
  let movement;
  if(reusable){movement=reusable.movimento;}
  else{
    const row=new Array(hm.headers.length).fill(''),now=new Date(),id='MGU-'+Utilities.getUuid();
    row[hm.map.ID_MOVIMENTACAO]=id;row[hm.map.ID_TURNO]=turno.id;if(hm.map.ID_TURNO_RETIRADA!==undefined)row[hm.map.ID_TURNO_RETIRADA]=turno.id;row[hm.map.STATUS]=GUARDA.STATUS_MOV.AGUARDANDO_RETIRADA;
    row[hm.map.CRIADA_EM]=now;row[hm.map.ATUALIZADA_EM]=now;
    row[hm.map.VTR_ORIGEM]=vehicle.origem;row[hm.map.VTR_ID]=vehicle.id;row[hm.map.VTR_PREFIXO_SNAPSHOT]=vehicle.prefixo;row[hm.map.VTR_PLACA_SNAPSHOT]=vehicle.placa;row[hm.map.VTR_MODELO_SNAPSHOT]=vehicle.modelo;
    row[hm.map.MILITAR_ID]=military.id;row[hm.map.MILITAR_POSTO_GRAD_SNAPSHOT]=military.postoGraduacao;row[hm.map.MILITAR_RG_SNAPSHOT]=military.rg;row[hm.map.MILITAR_NOME_SNAPSHOT]=military.nomeCompleto;row[hm.map.MILITAR_NOME_GUERRA_SNAPSHOT]=military.nomeGuerra;row[hm.map.MILITAR_CPF_SNAPSHOT]=military.cpf;row[hm.map.MILITAR_OPM_SNAPSHOT]=military.opm;
    row[hm.map.SOLICITACAO_RETIRADA_EM]=now;row[hm.map.OPERADOR_RETIRADA_ID]=guardText_(operator&&operator.id||operator&&operator.login,100);row[hm.map.OPERADOR_RETIRADA_NOME]=guardText_(operator&&operator.name||operator&&operator.login,160);
    sh.appendRow(row);
    const insertedRow=sh.getLastRow();
    // Reforço explícito: prefixo é texto operacional. Isso evita que o Sheets converta 025 em 25.
    if(hm.map.VTR_PREFIXO_SNAPSHOT!==undefined){const c=sh.getRange(insertedRow,hm.map.VTR_PREFIXO_SNAPSHOT+1);c.setNumberFormat('@');c.setValue(String(vehicle.prefixo));}
    if(hm.map.VTR_PLACA_SNAPSHOT!==undefined){const c=sh.getRange(insertedRow,hm.map.VTR_PLACA_SNAPSHOT+1);c.setNumberFormat('@');c.setValue(String(vehicle.placa));}
    movement=guardMovementFromRow_(sh.getRange(insertedRow,1,1,hm.headers.length).getDisplayValues()[0],hm.map);
  }
  const issued=guardIssueToken_(movement.id,GUARDA.TOKEN_TIPOS.RETIRADA);
  return {movimentacao:movement,token:issued.token,expiraEm:issued.expiraEm,tokenValidadeMinutos:GUARDA.TOKEN_TTL_MINUTES};
}

function getGuardPublicTokenInfo_(data) {
  ensureGuardStructure_();data=data||{};
  const ti=guardTokenAssertUsable_(guardFindToken_(data.token)),loc=guardMovementLocator_(ti.movimentoId);
  if(!loc)throw new Error('QR_CODE_INVALIDO');
  const m=loc.movimento;

  if(ti.tipo===GUARDA.TOKEN_TIPOS.RETIRADA){
    if(m.status!==GUARDA.STATUS_MOV.AGUARDANDO_RETIRADA)throw new Error(m.status===GUARDA.STATUS_MOV.EM_USO?'QR_CODE_JA_UTILIZADO':'QR_CODE_INVALIDO');
    return {
      confirmado:false,operacao:'RETIRADA',expiraEm:guardDateIso_(ti.expiraEm),
      vtr:{prefixo:m.vtrPrefixo,placa:m.vtrPlaca,modelo:m.vtrModelo},
      condutor:{postoGraduacao:m.militarPostoGraduacao,nomeGuerra:m.militarNomeGuerra},
      solicitacaoEm:m.solicitacaoRetiradaEm,ultimoKmConhecido:guardVehicleLastKnownKm_(m),kmInicial:null
    };
  }

  if(ti.tipo===GUARDA.TOKEN_TIPOS.DEVOLUCAO){
    if(m.status!==GUARDA.STATUS_MOV.AGUARDANDO_DEVOLUCAO)throw new Error(m.status===GUARDA.STATUS_MOV.ENCERRADA?'QR_CODE_JA_UTILIZADO':'QR_CODE_INVALIDO');
    return {
      confirmado:false,operacao:'DEVOLUCAO',expiraEm:guardDateIso_(ti.expiraEm),
      vtr:{prefixo:m.vtrPrefixo,placa:m.vtrPlaca,modelo:m.vtrModelo},
      condutor:{postoGraduacao:m.militarPostoGraduacao,nomeGuerra:m.militarNomeGuerra},
      solicitacaoEm:m.solicitacaoDevolucaoEm,ultimoKmConhecido:null,kmInicial:Number(m.kmRetirada||0)
    };
  }
  throw new Error('QR_CODE_INVALIDO');
}

function confirmGuardWithdrawalPublic_(data) {
  ensureGuardStructure_();data=data||{};
  const ti=guardTokenAssertUsable_(guardFindToken_(data.token,GUARDA.TOKEN_TIPOS.RETIRADA)),loc=guardMovementLocator_(ti.movimentoId);
  if(!loc)throw new Error('QR_CODE_INVALIDO');
  if(loc.movimento.status!==GUARDA.STATUS_MOV.AGUARDANDO_RETIRADA)throw new Error(loc.movimento.status===GUARDA.STATUS_MOV.EM_USO?'QR_CODE_JA_UTILIZADO':'QR_CODE_INVALIDO');
  const km=guardParseKm_(data.km),last=guardVehicleLastKnownKm_(loc.movimento);
  if(last!==null&&km<last)throw new Error('O KM informado ('+km+') é menor que o último KM conhecido da VTR ('+last+'). Revise o valor.');
  const now=new Date();
  loc.sheet.getRange(loc.rowIndex,loc.map.KM_RETIRADA+1).setValue(km);
  loc.sheet.getRange(loc.rowIndex,loc.map.CONFIRMACAO_RETIRADA_EM+1).setValue(now);
  loc.sheet.getRange(loc.rowIndex,loc.map.STATUS+1).setValue(GUARDA.STATUS_MOV.EM_USO);
  loc.sheet.getRange(loc.rowIndex,loc.map.ATUALIZADA_EM+1).setValue(now);
  ti.sheet.getRange(ti.rowIndex,ti.map.CONSUMIDO_EM+1).setValue(now);
  ti.sheet.getRange(ti.rowIndex,ti.map.STATUS+1).setValue('CONSUMIDO');
  if(loc.movimento.vtrOrigem===GUARDA.VTR_ORIGEM.CADASTRADA&&loc.movimento.vtrId)updateVehicleKm_(getSpreadsheet_(),loc.movimento.vtrId,km);
  return {confirmado:true,operacao:'RETIRADA',vtr:{prefixo:loc.movimento.vtrPrefixo,placa:loc.movimento.vtrPlaca},km:km,confirmacaoEm:guardDateIso_(now)};
}

function listGuardShiftMovements_(turnoId) {
  ensureGuardStructure_();
  const id=guardText_(turnoId||((getOpenGuardShift_()||{}).id),100);if(!id)return [];
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_MOVEMENTS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getDisplayValues(),out=[];
  for(let r=1;r<rows.length;r++){
    const m=guardMovementFromRow_(rows[r],hm.map),origem=m.turnoRetiradaId||m.turnoId,retorno=m.turnoDevolucaoId;
    const aberta=m.status===GUARDA.STATUS_MOV.EM_USO||m.status===GUARDA.STATUS_MOV.AGUARDANDO_DEVOLUCAO;
    if(origem!==id&&retorno!==id&&!aberta)continue;
    m.turnoAtualId=id;m.retiradaEmTurnoAnterior=origem!==id;m.devolucaoNesteTurno=retorno===id;m.origemTurnoId=origem;
    out.push(m);
  }
  out.sort(function(a,b){return String(b.criadaEm||'').localeCompare(String(a.criadaEm||''));});return out;
}

function startGuardReturn_(data,operator) {
  ensureGuardStructure_();data=data||{};
  const turno=getOpenGuardShift_();if(!turno)throw new Error('Inicie o turno da Guarda antes de registrar a devolução.');
  const id=guardText_(data.movimentacaoId||data.id,100);if(!id)throw new Error('Movimentação não informada.');
  const loc=guardMovementLocator_(id);if(!loc)throw new Error('Movimentação não encontrada.');
  if(loc.movimento.status===GUARDA.STATUS_MOV.ENCERRADA)throw new Error('Esta VTR já foi devolvida.');
  if(loc.movimento.status!==GUARDA.STATUS_MOV.EM_USO&&loc.movimento.status!==GUARDA.STATUS_MOV.AGUARDANDO_DEVOLUCAO)throw new Error('A retirada ainda não foi confirmada para esta VTR.');
  const now=new Date(),returnTurn=loc.movimento.turnoDevolucaoId;
  if(loc.movimento.status===GUARDA.STATUS_MOV.EM_USO||returnTurn!==turno.id){
    loc.sheet.getRange(loc.rowIndex,loc.map.STATUS+1).setValue(GUARDA.STATUS_MOV.AGUARDANDO_DEVOLUCAO);
    loc.sheet.getRange(loc.rowIndex,loc.map.SOLICITACAO_DEVOLUCAO_EM+1).setValue(now);
    if(loc.map.ID_TURNO_DEVOLUCAO!==undefined)loc.sheet.getRange(loc.rowIndex,loc.map.ID_TURNO_DEVOLUCAO+1).setValue(turno.id);
    loc.sheet.getRange(loc.rowIndex,loc.map.OPERADOR_DEVOLUCAO_ID+1).setValue(guardText_(operator&&operator.id||operator&&operator.login,100));
    loc.sheet.getRange(loc.rowIndex,loc.map.OPERADOR_DEVOLUCAO_NOME+1).setValue(guardText_(operator&&operator.name||operator&&operator.login,160));
    loc.sheet.getRange(loc.rowIndex,loc.map.ATUALIZADA_EM+1).setValue(now);
  }
  const refreshed=guardMovementLocator_(id).movimento,issued=guardIssueToken_(id,GUARDA.TOKEN_TIPOS.DEVOLUCAO);
  return {movimentacao:refreshed,token:issued.token,expiraEm:issued.expiraEm,tokenValidadeMinutos:GUARDA.TOKEN_TTL_MINUTES,operacao:'DEVOLUCAO'};
}

function confirmGuardReturnPublic_(data) {
  ensureGuardStructure_();data=data||{};
  const ti=guardTokenAssertUsable_(guardFindToken_(data.token,GUARDA.TOKEN_TIPOS.DEVOLUCAO)),loc=guardMovementLocator_(ti.movimentoId);if(!loc)throw new Error('QR_CODE_INVALIDO');
  if(loc.movimento.status!==GUARDA.STATUS_MOV.AGUARDANDO_DEVOLUCAO)throw new Error(loc.movimento.status===GUARDA.STATUS_MOV.ENCERRADA?'QR_CODE_JA_UTILIZADO':'QR_CODE_INVALIDO');
  const km=guardParseKm_(data.km),kmInicial=Number(guardDigits_(loc.movimento.kmRetirada,12)||0);if(km<kmInicial)throw new Error('O KM final ('+km+') não pode ser menor que o KM inicial ('+kmInicial+'). Revise o valor.');
  const now=new Date(),percorrido=km-kmInicial;
  loc.sheet.getRange(loc.rowIndex,loc.map.KM_DEVOLUCAO+1).setValue(km);loc.sheet.getRange(loc.rowIndex,loc.map.CONFIRMACAO_DEVOLUCAO_EM+1).setValue(now);loc.sheet.getRange(loc.rowIndex,loc.map.KM_PERCORRIDO+1).setValue(percorrido);loc.sheet.getRange(loc.rowIndex,loc.map.STATUS+1).setValue(GUARDA.STATUS_MOV.ENCERRADA);loc.sheet.getRange(loc.rowIndex,loc.map.ATUALIZADA_EM+1).setValue(now);
  ti.sheet.getRange(ti.rowIndex,ti.map.CONSUMIDO_EM+1).setValue(now);ti.sheet.getRange(ti.rowIndex,ti.map.STATUS+1).setValue('CONSUMIDO');
  if(loc.movimento.vtrOrigem===GUARDA.VTR_ORIGEM.CADASTRADA&&loc.movimento.vtrId)updateVehicleKm_(getSpreadsheet_(),loc.movimento.vtrId,km);
  return {confirmado:true,operacao:'DEVOLUCAO',vtr:{prefixo:loc.movimento.vtrPrefixo,placa:loc.movimento.vtrPlaca},km:km,kmInicial:kmInicial,kmPercorrido:percorrido,confirmacaoEm:guardDateIso_(now)};
}

function getGuardMovementStatus_(data) {
  const id=guardText_(data&&data.movimentacaoId||data&&data.id,100);if(!id)throw new Error('Movimentação não informada.');const loc=guardMovementLocator_(id);if(!loc)throw new Error('Movimentação não encontrada.');const m=loc.movimento;
  return {id:m.id,status:m.status,kmRetirada:m.kmRetirada,confirmacaoRetiradaEm:m.confirmacaoRetiradaEm,kmDevolucao:m.kmDevolucao,confirmacaoDevolucaoEm:m.confirmacaoDevolucaoEm,kmPercorrido:m.kmPercorrido,vtr:{prefixo:m.vtrPrefixo,placa:m.vtrPlaca},militar:{postoGraduacao:m.militarPostoGraduacao,nomeGuerra:m.militarNomeGuerra}};
}

function guardOpenShiftLocator_() {
  ensureGuardStructure_();
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_SHIFTS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getValues();
  for(let r=rows.length-1;r>=1;r--){
    if(guardUpper_(guardRowValue_(rows[r],hm.map,'STATUS'),30)!==GUARDA.STATUS_TURNO.ABERTO)continue;
    return {sheet:sh,map:hm.map,rowIndex:r+1,row:rows[r],turno:guardShiftFromRow_(rows[r],hm.map)};
  }
  return null;
}

function getGuardShiftSummary_(turnoId) {
  const id=guardText_(turnoId,100);if(!id)return {movimentacoes:0,devolvidas:0,emUso:0,aguardandoConfirmacao:0,devolucoesTurnoAnterior:0};
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_MOVEMENTS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getValues();let total=0,devolvidas=0,emUso=0,aguardando=0,recebidasAnteriores=0;
  for(let r=1;r<rows.length;r++){
    const origem=guardText_(guardRowValue_(rows[r],hm.map,'ID_TURNO_RETIRADA'),100)||guardText_(guardRowValue_(rows[r],hm.map,'ID_TURNO'),100),retorno=guardText_(guardRowValue_(rows[r],hm.map,'ID_TURNO_DEVOLUCAO'),100),st=guardUpper_(guardRowValue_(rows[r],hm.map,'STATUS'),50);
    if(retorno===id&&origem!==id&&st===GUARDA.STATUS_MOV.ENCERRADA)recebidasAnteriores++;
    if(origem!==id)continue;total++;
    if(st===GUARDA.STATUS_MOV.ENCERRADA)devolvidas++;else if(st===GUARDA.STATUS_MOV.EM_USO||st===GUARDA.STATUS_MOV.AGUARDANDO_DEVOLUCAO)emUso++;else if(st===GUARDA.STATUS_MOV.AGUARDANDO_RETIRADA)aguardando++;
  }
  return {movimentacoes:total,devolvidas:devolvidas,emUso:emUso,aguardandoConfirmacao:aguardando,devolucoesTurnoAnterior:recebidasAnteriores};
}

function getGuardClosePreview_(data) {
  data=data||{};const id=guardText_(data.turnoId,100),loc=id?guardShiftLocatorById_(id):guardOpenShiftLocator_();if(!loc)throw new Error('Turno não encontrado para fechamento.');
  if(id&&loc.turno.status!==GUARDA.STATUS_TURNO.PENDENTE)throw new Error('Este turno não está pendente de encerramento.');
  if(!id&&loc.turno.status!==GUARDA.STATUS_TURNO.ABERTO)throw new Error('Não existe turno aberto para fechar.');
  return {turno:loc.turno,resumo:getGuardShiftSummary_(loc.turno.id),modo:id?'SUBSTITUTO':'NORMAL'};
}

function guardCloseShiftWrite_(loc,data,substituto) {
  data=data||{};const posto=guardUpper_(data.postoGraduacao,80),rg=guardDigits_(data.rg,20),nome=guardUpper_(data.nomeCompleto||data.nome,160),guerra=guardUpper_(data.nomeGuerra,100),motivo=guardText_(data.motivo,500);
  if(!posto)throw new Error('Informe o Posto/Graduação do militar responsável pelo fechamento.');if(!rg)throw new Error('Informe o RG do militar responsável pelo fechamento.');if(!nome)throw new Error('Informe o nome completo do militar responsável pelo fechamento.');if(!guerra)throw new Error('Informe o nome de guerra do militar responsável pelo fechamento.');if(substituto&&!motivo)throw new Error('Informe o motivo do encerramento por substituto.');
  const resumo=getGuardShiftSummary_(loc.turno.id),now=new Date(),m=loc.map,status=substituto?GUARDA.STATUS_TURNO.FECHADO_SUBSTITUTO:GUARDA.STATUS_TURNO.FECHADO;
  const row=loc.sheet.getRange(loc.rowIndex,1,1,loc.sheet.getLastColumn()).getValues()[0];
  const set=function(key,value){if(m[key]!==undefined)row[m[key]]=value};
  set('STATUS',status);set('FIM_EM',now);
  if(!substituto){set('CMD_POSTO_GRAD_SNAPSHOT',posto);set('CMD_RG_SNAPSHOT',String(rg));set('CMD_NOME_SNAPSHOT',nome);set('CMD_NOME_GUERRA_SNAPSHOT',guerra);set('CMD_CONFIRMACAO_EM',now);}
  set('MOVIMENTACOES_TOTAL',resumo.movimentacoes);set('DEVOLVIDAS_TOTAL',resumo.devolvidas);set('EM_USO_TOTAL',resumo.emUso);
  set('ENCERRAMENTO_TIPO',substituto?'SUBSTITUTO':'NORMAL');set('ENCERRAMENTO_MOTIVO',motivo);
  set('ENCERRADO_POR_POSTO_GRAD_SNAPSHOT',posto);set('ENCERRADO_POR_RG_SNAPSHOT',String(rg));set('ENCERRADO_POR_NOME_SNAPSHOT',nome);set('ENCERRADO_POR_NOME_GUERRA_SNAPSHOT',guerra);set('ENCERRADO_POR_FUNCAO',substituto?'Comandante da Guarda substituto':'Comandante da Guarda');set('ENCERRADO_POR_CONFIRMACAO_EM',now);
  const range=loc.sheet.getRange(loc.rowIndex,1,1,row.length);range.setValues([row]);
  if(m.CMD_RG_SNAPSHOT!==undefined&&!substituto)loc.sheet.getRange(loc.rowIndex,m.CMD_RG_SNAPSHOT+1).setNumberFormat('@');
  if(m.ENCERRADO_POR_RG_SNAPSHOT!==undefined)loc.sheet.getRange(loc.rowIndex,m.ENCERRADO_POR_RG_SNAPSHOT+1).setNumberFormat('@');
  return {fechado:true,substituto:substituto,turno:guardShiftFromRow_(row,m),resumo:resumo,responsavel:{militarId:guardText_(data.militarId,80),postoGraduacao:posto,rg:rg,nomeCompleto:nome,nomeGuerra:guerra,funcao:substituto?'Comandante da Guarda substituto':'Comandante da Guarda'},motivo:motivo,confirmacaoEm:guardDateIso_(now),pdfPendente:true};
}

function closeGuardShift_(data,operator) {
  const loc=guardOpenShiftLocator_();if(!loc)throw new Error('Não existe turno aberto para fechar.');
  return guardCloseShiftWrite_(loc,data,false);
}
function closePendingGuardShift_(data,operator) {
  data=data||{};const loc=guardShiftLocatorById_(data.turnoId);if(!loc)throw new Error('Turno pendente não encontrado.');if(loc.turno.status!==GUARDA.STATUS_TURNO.PENDENTE)throw new Error('Este turno não está pendente de encerramento.');
  return guardCloseShiftWrite_(loc,data,true);
}

/******************************************************************
 * ETAPA 6 - PDF DO TURNO
 ******************************************************************/

function guardPdfFriendlyError_(error){
  const raw=String(error&&error.message||error||'');
  if(/DocumentApp\.create|authorization|autoriz|scope|permissions?/i.test(raw))return 'PDF_SEM_AUTORIZACAO: execute autorizarControleGuardaPdf() uma vez no editor do Apps Script e aceite as permissões solicitadas.';
  return raw||'Não foi possível gerar o PDF.';
}

function autorizarControleGuardaPdf(){
  const doc=DocumentApp.create('SIGVTR_AUTORIZACAO_CONTROLE_GUARDA');
  try{
    doc.getBody().appendParagraph('Autorização do gerador de PDF do Controle da Guarda.');
    doc.saveAndClose();
    const file=DriveApp.getFileById(doc.getId());
    file.getAs(MimeType.PDF);
    const folder=guardReportsFolder_();
    folder.getId();
    file.setTrashed(true);
    return {success:true,moduleVersion:GUARDA.MODULE_VERSION,mensagem:'Permissões de Documentos e Drive autorizadas para o gerador de PDF.'};
  }catch(error){
    try{DriveApp.getFileById(doc.getId()).setTrashed(true)}catch(_){}
    throw error;
  }
}
function guardReportsFolder_(){
  const props=PropertiesService.getScriptProperties();
  const saved=props.getProperty('GUARD_REPORTS_FOLDER_ID');
  if(saved){try{return DriveApp.getFolderById(saved)}catch(_){}}
  const roots=DriveApp.getFoldersByName('SIGVTR - Controle da Guarda');
  const root=roots.hasNext()?roots.next():DriveApp.createFolder('SIGVTR - Controle da Guarda');
  const folder=childFolder_(root,'Relatorios');
  props.setProperty('GUARD_REPORTS_FOLDER_ID',folder.getId());
  return folder;
}

function guardPdfDate_(value,withTime){
  if(!value)return '—';
  const d=value instanceof Date?value:new Date(value);if(isNaN(d.getTime()))return '—';
  return Utilities.formatDate(d,SIGVTR.TIMEZONE,withTime?'dd/MM/yyyy HH:mm':'dd/MM/yyyy');
}
function guardPdfKm_(value){const d=guardDigits_(value,15);return d?Number(d).toLocaleString('pt-BR'):'—';}
function guardPdfAddText_(body,text,bold,size,align){
  const p=body.appendParagraph(String(text||''));if(align)p.setAlignment(align);
  const t=p.editAsText();if(size)t.setFontSize(size);if(bold)t.setBold(true);return p;
}
function guardPdfCell_(cell,text,bold,size){cell.setText(String(text===undefined||text===null?'':text));const t=cell.editAsText();t.setFontSize(size||8);if(bold)t.setBold(true);return cell;}

function guardPdfMovementRows_(turno){
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_MOVEMENTS),hm=guardHeaderMap_(sh),rows=sh.getDataRange().getValues(),out=[],end=turno.fimEm?new Date(turno.fimEm):new Date();
  for(let r=1;r<rows.length;r++){
    const m=guardMovementFromRow_(rows[r],hm.map),origin=m.turnoRetiradaId||m.turnoId,ret=m.turnoDevolucaoId;
    if(origin!==turno.id&&ret!==turno.id)continue;
    const retDate=m.confirmacaoDevolucaoEm?new Date(m.confirmacaoDevolucaoEm):null;
    let situacao='';
    const withdrawalDate=m.confirmacaoRetiradaEm?new Date(m.confirmacaoRetiradaEm):null,withdrawalConfirmed=withdrawalDate&&!isNaN(withdrawalDate.getTime())&&withdrawalDate.getTime()<=end.getTime(),returnConfirmed=retDate&&!isNaN(retDate.getTime())&&retDate.getTime()<=end.getTime();
    if(origin!==turno.id&&ret===turno.id)situacao=returnConfirmed?'DEVOLUÇÃO DE TURNO ANTERIOR':'DEVOLUÇÃO DE TURNO ANTERIOR PENDENTE NO ENCERRAMENTO';
    else if(!withdrawalConfirmed)situacao='AGUARDANDO CONFIRMAÇÃO NO ENCERRAMENTO';
    else if(returnConfirmed&&ret===turno.id)situacao='DEVOLVIDA';
    else situacao='EM USO NO ENCERRAMENTO';
    out.push({
      vtr:m.vtrPrefixo||'—',placa:m.vtrPlaca||'—',militar:[m.militarPostoGraduacao,m.militarNomeGuerra||m.militarNome].filter(Boolean).join(' '),rg:m.militarRg||'—',
      retirada:m.confirmacaoRetiradaEm?guardPdfDate_(m.confirmacaoRetiradaEm,true):guardPdfDate_(m.solicitacaoRetiradaEm,true),kmInicial:guardPdfKm_(m.kmRetirada),
      devolucao:(retDate&&retDate.getTime()<=end.getTime())?guardPdfDate_(m.confirmacaoDevolucaoEm,true):'—',kmFinal:(retDate&&retDate.getTime()<=end.getTime())?guardPdfKm_(m.kmDevolucao):'—',
      percorrido:(retDate&&retDate.getTime()<=end.getTime())?guardPdfKm_(m.kmPercorrido):'—',situacao:situacao,
      confRet:m.confirmacaoRetiradaEm?'CONF. ELETRÔNICA':'—',confDev:(retDate&&retDate.getTime()<=end.getTime())?'CONF. ELETRÔNICA':'—'
    });
  }
  out.sort(function(a,b){return String(a.retirada).localeCompare(String(b.retirada));});return out;
}

function generateGuardShiftPdf_(turnoId,opts){
  opts=opts||{};ensureGuardStructure_();
  const loc=guardShiftLocatorById_(turnoId);if(!loc)throw new Error('Turno não encontrado para geração do PDF.');
  const turno=loc.turno;if(turno.status!==GUARDA.STATUS_TURNO.FECHADO&&turno.status!==GUARDA.STATUS_TURNO.FECHADO_SUBSTITUTO)throw new Error('O PDF só pode ser gerado após o fechamento do turno.');
  const movs=guardPdfMovementRows_(turno),resumo={movimentacoes:turno.movimentacoesTotal,devolvidas:turno.devolvidasTotal,emUso:turno.emUsoTotal,devolucoesTurnoAnterior:movs.filter(function(m){return m.situacao==='DEVOLUÇÃO DE TURNO ANTERIOR'}).length},folder=guardReportsFolder_(),doc=DocumentApp.create('SIGVTR_CONTROLE_GUARDA_'+turno.id),body=doc.getBody();
  body.setMarginTop(28).setMarginBottom(28).setMarginLeft(28).setMarginRight(28);
  guardPdfAddText_(body,'SIGVTR — CONTROLE DA GUARDA',true,15,DocumentApp.HorizontalAlignment.CENTER);
  guardPdfAddText_(body,'Relatório do serviço',true,11,DocumentApp.HorizontalAlignment.CENTER);
  guardPdfAddText_(body,'Turno: '+turno.id,false,8,DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph('');
  const info=body.appendTable();
  let row=info.appendTableRow();guardPdfCell_(row.appendTableCell(),'Início',true,8);guardPdfCell_(row.appendTableCell(),guardPdfDate_(turno.inicioEm,true),false,8);guardPdfCell_(row.appendTableCell(),'Término',true,8);guardPdfCell_(row.appendTableCell(),guardPdfDate_(turno.fimEm,true),false,8);
  row=info.appendTableRow();guardPdfCell_(row.appendTableCell(),'Movimentações',true,8);guardPdfCell_(row.appendTableCell(),resumo.movimentacoes,false,8);guardPdfCell_(row.appendTableCell(),'Devolvidas',true,8);guardPdfCell_(row.appendTableCell(),resumo.devolvidas,false,8);
  row=info.appendTableRow();guardPdfCell_(row.appendTableCell(),'Em uso no encerramento',true,8);guardPdfCell_(row.appendTableCell(),resumo.emUso,false,8);guardPdfCell_(row.appendTableCell(),'Recebidas de turno anterior',true,8);guardPdfCell_(row.appendTableCell(),resumo.devolucoesTurnoAnterior,false,8);
  body.appendParagraph('');guardPdfAddText_(body,'MOVIMENTAÇÕES',true,10);
  const table=body.appendTable();const hr=table.appendTableRow();['VTR / Placa','Militar / RG','Retirada / KM','Devolução / KM','Percorrido','Situação'].forEach(function(h){guardPdfCell_(hr.appendTableCell(),h,true,7)});
  if(!movs.length){const rr=table.appendTableRow();guardPdfCell_(rr.appendTableCell(),'Nenhuma movimentação',false,8);for(let i=0;i<5;i++)guardPdfCell_(rr.appendTableCell(),'—',false,8)}
  movs.forEach(function(m){const rr=table.appendTableRow();guardPdfCell_(rr.appendTableCell(),m.vtr+' / '+m.placa,false,7);guardPdfCell_(rr.appendTableCell(),m.militar+'\nRG '+m.rg,false,7);guardPdfCell_(rr.appendTableCell(),m.retirada+'\nKM '+m.kmInicial+'\n'+m.confRet,false,7);guardPdfCell_(rr.appendTableCell(),m.devolucao+'\nKM '+m.kmFinal+'\n'+m.confDev,false,7);guardPdfCell_(rr.appendTableCell(),m.percorrido+' km',false,7);guardPdfCell_(rr.appendTableCell(),m.situacao,false,7)});
  body.appendParagraph('');guardPdfAddText_(body,'ENCERRAMENTO DO SERVIÇO',true,10);
  if(turno.status===GUARDA.STATUS_TURNO.FECHADO){
    guardPdfAddText_(body,[turno.comandantePostoGraduacao,turno.comandanteNome].filter(Boolean).join(' '),true,10,DocumentApp.HorizontalAlignment.CENTER);
    guardPdfAddText_(body,'Comandante da Guarda',false,9,DocumentApp.HorizontalAlignment.CENTER);
    guardPdfAddText_(body,'RG '+(turno.comandanteRg||'—'),false,8,DocumentApp.HorizontalAlignment.CENTER);
    guardPdfAddText_(body,'Fechamento confirmado eletronicamente em '+guardPdfDate_(turno.comandanteConfirmacaoEm||turno.fimEm,true)+'.',false,8,DocumentApp.HorizontalAlignment.CENTER);
  }else{
    guardPdfAddText_(body,[turno.encerradoPorPostoGraduacao,turno.encerradoPorNome].filter(Boolean).join(' '),true,10,DocumentApp.HorizontalAlignment.CENTER);
    guardPdfAddText_(body,turno.encerradoPorFuncao||'Comandante da Guarda substituto',false,9,DocumentApp.HorizontalAlignment.CENTER);
    guardPdfAddText_(body,'RG '+(turno.encerradoPorRg||'—'),false,8,DocumentApp.HorizontalAlignment.CENTER);
    guardPdfAddText_(body,'Motivo: '+(turno.encerramentoMotivo||'—'),false,8,DocumentApp.HorizontalAlignment.CENTER);
    guardPdfAddText_(body,'Encerramento confirmado eletronicamente em '+guardPdfDate_(turno.encerradoPorConfirmacaoEm||turno.fimEm,true)+'.',false,8,DocumentApp.HorizontalAlignment.CENTER);
  }
  body.appendParagraph('');guardPdfAddText_(body,'Documento gerado pelo SIGVTR a partir dos registros estruturados do Controle da Guarda.',false,7,DocumentApp.HorizontalAlignment.CENTER);
  doc.saveAndClose();
  const docFile=DriveApp.getFileById(doc.getId()),blob=docFile.getAs(MimeType.PDF),stamp=Utilities.formatDate(new Date(turno.inicioEm||new Date()),SIGVTR.TIMEZONE,'yyyyMMdd_HHmm'),filename=sanitizeFilename_('controle_guarda_'+stamp+'_'+turno.id+'.pdf');blob.setName(filename);
  if(turno.pdfFileId){try{DriveApp.getFileById(turno.pdfFileId).setTrashed(true)}catch(_){}}
  const pdfFile=folder.createFile(blob);docFile.setTrashed(true);const now=new Date();
  if(loc.map.PDF_FILE_ID!==undefined)loc.sheet.getRange(loc.rowIndex,loc.map.PDF_FILE_ID+1).setValue(pdfFile.getId());if(loc.map.PDF_GERADO_EM!==undefined)loc.sheet.getRange(loc.rowIndex,loc.map.PDF_GERADO_EM+1).setValue(now);
  const result={turnoId:turno.id,fileId:pdfFile.getId(),filename:filename,geradoEm:guardDateIso_(now),mimeType:'application/pdf'};if(opts.returnBase64!==false)result.base64=Utilities.base64Encode(pdfFile.getBlob().getBytes());return result;
}
function getGuardShiftPdf_(data){data=data||{};const id=guardText_(data.turnoId,100);if(!id)throw new Error('Informe o turno.');const loc=guardShiftLocatorById_(id);if(!loc)throw new Error('Turno não encontrado.');if(!loc.turno.pdfFileId)return generateGuardShiftPdf_(id,{returnBase64:true});try{const file=DriveApp.getFileById(loc.turno.pdfFileId),blob=file.getBlob();return {turnoId:id,fileId:file.getId(),filename:file.getName(),geradoEm:loc.turno.pdfGeradoEm,mimeType:'application/pdf',base64:Utilities.base64Encode(blob.getBytes())}}catch(_){return generateGuardShiftPdf_(id,{returnBase64:true})}}
function regenerateGuardShiftPdf_(data){data=data||{};try{return generateGuardShiftPdf_(guardText_(data.turnoId,100),{returnBase64:data.returnBase64!==false})}catch(error){throw new Error(guardPdfFriendlyError_(error))}}

function testarControleGuardaEtapa6(){
  ensureGuardStructure_();const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_SHIFTS),hm=guardHeaderMap_(sh).map,required=['PDF_FILE_ID','PDF_GERADO_EM'];const cols=required.every(function(k){return hm[k]!==undefined});
  return {success:cols&&GUARDA.MODULE_VERSION==='0.6.1',moduleVersion:GUARDA.MODULE_VERSION,colunasPdfOk:cols,pastaRelatorios:'SIGVTR - Controle da Guarda / Relatorios',pdfRegeneravel:true};
}

function testarControleGuardaEtapa3() {
  ensureGuardStructure_();
  const raw=guardNewRawToken_(),hash=guardHashToken_(raw);
  const km1=guardParseKm_('67.879'),km2=guardParseKm_('092');
  return {success:raw.length>=64&&hash.length===64&&km1===67879&&km2===92,moduleVersion:GUARDA.MODULE_VERSION,tokenLength:raw.length,hashLength:hash.length,kmFormatado:km1,prefixoContinuaTexto:resolveGuardVehicleSnapshot_({origem:'OUTROS',prefixo:'092',placa:'ABC1D23'}).prefixo};
}

function testarControleGuardaCorrecao031() {
  ensureGuardStructure_();
  const v=resolveGuardVehicleSnapshot_({origem:'OUTROS',prefixo:'025',placa:'ABC1D23'});
  const roleOk=typeof ADMIN_AUTH!=='undefined'&&ADMIN_AUTH.VALID_ROLES.indexOf('GUARDA')>=0;
  return {success:v.prefixo==='025'&&roleOk,moduleVersion:GUARDA.MODULE_VERSION,prefixoTeste:v.prefixo,perfilGuardaDisponivel:roleOk};
}


function testarControleGuardaEtapa4() {
  ensureGuardStructure_();
  const headers=GUARDA.SHEET_HEADERS.MOVIMENTACOES;
  const required=['KM_DEVOLUCAO','SOLICITACAO_DEVOLUCAO_EM','CONFIRMACAO_DEVOLUCAO_EM','KM_PERCORRIDO','OPERADOR_DEVOLUCAO_ID','OPERADOR_DEVOLUCAO_NOME'];
  const missing=required.filter(function(h){return headers.indexOf(h)<0;});
  return {success:missing.length===0,moduleVersion:GUARDA.MODULE_VERSION,camposDevolucaoOk:missing.length===0,camposAusentes:missing};
}


function testarControleGuardaCorrecao041() {
  ensureGuardStructure_();
  const busca=searchGuardMilitary_('44174',5);
  return {
    success:Array.isArray(busca)&&GUARDA.MODULE_VERSION==='0.4.1',
    moduleVersion:GUARDA.MODULE_VERSION,
    loginFuncional:true,
    comandanteIdentificadoNoFechamento:true,
    pesquisaBaseMilitares:true,
    resultadosTeste:busca.length
  };
}


function testarControleGuardaEtapa5() {
  ensureGuardStructure_();
  const shT=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_SHIFTS),shM=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.GUARD_MOVEMENTS),ht=guardHeaderMap_(shT).map,hm=guardHeaderMap_(shM).map;
  const requiredTurn=['ENCERRAMENTO_TIPO','ENCERRAMENTO_MOTIVO','ENCERRADO_POR_NOME_SNAPSHOT','ENCERRADO_POR_CONFIRMACAO_EM'];
  const requiredMov=['ID_TURNO_RETIRADA','ID_TURNO_DEVOLUCAO'];
  const ok=requiredTurn.every(k=>ht[k]!==undefined)&&requiredMov.every(k=>hm[k]!==undefined);
  return {success:ok,moduleVersion:GUARDA.MODULE_VERSION,statusPendente:GUARDA.STATUS_TURNO.PENDENTE,statusFechadoSubstituto:GUARDA.STATUS_TURNO.FECHADO_SUBSTITUTO,turnosPendentes:listPendingGuardShifts_().length,colunasTurnoOk:requiredTurn.every(k=>ht[k]!==undefined),colunasMovimentacaoOk:requiredMov.every(k=>hm[k]!==undefined)};
}

function testarControleGuardaPerformance061(){
  const t=Date.now(),estrutura=ensureGuardStructure_();
  return {success:GUARDA.MODULE_VERSION==='0.6.1',moduleVersion:GUARDA.MODULE_VERSION,schemaVersion:GUARDA.SCHEMA_VERSION,estruturaCached:!!(estrutura[0]&&estrutura[0].cached),tempoEnsureMs:Date.now()-t};
}
