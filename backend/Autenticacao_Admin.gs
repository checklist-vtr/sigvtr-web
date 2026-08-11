/******************************************************************
 * SIGVTR - Autenticação e autorização administrativa
 * Versão: 1.20.3-RC1
 *
 * Observação criptográfica:
 * Google Apps Script não possui bcrypt/Argon2/PBKDF2 nativos. Para não
 * introduzir dependência externa, esta versão usa HMAC-SHA-256 com salt
 * individual, pepper secreto em Script Properties e fator iterativo.
 * O pepper reduz o risco em caso de vazamento isolado da planilha.
 ******************************************************************/
const ADMIN_AUTH = Object.freeze({
  SESSION_IDLE_MINUTES: 30,
  SESSION_TOUCH_MINUTES: 2,
  SESSION_ABSOLUTE_HOURS: 8,
  MAX_FAILED_ATTEMPTS: 5,
  BLOCK_MINUTES: 15,
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_KDF_ROUNDS: 4096,
  SESSION_SHEET: 'SESSOES_ADMIN',
  VALID_ROLES: ['CMD','SUBCMD','FISCAL','DEV'],
  USER_COLUMNS: [
    'LOGIN','NOME_ADMIN','PERFIL_ADMIN','SENHA_HASH','SALT','ATIVO_ADMIN',
    'TROCAR_SENHA','TENTATIVAS_FALHAS','BLOQUEADO_ATE','ULTIMO_LOGIN',
    'ULTIMA_TROCA_SENHA','CRIADO_EM','CRIADO_POR','ALTERADO_EM','ALTERADO_POR'
  ],
  SESSION_COLUMNS: ['ID_SESSAO','ID_USUARIO','TOKEN_HASH','CRIADA_EM','EXPIRA_EM','ULTIMA_ATIVIDADE','REVOGADA','REVOGADA_EM','MOTIVO_REVOGACAO'],
  PERMISSIONS: {
    CMD: [
      'adminDashboard','adminAlertas','adminAlertasRecentes','adminChecklists','adminChecklistDetalhe',
      'adminAvarias','adminAvariaDetalhe','adminViaturas','adminViaturaDetalhe','adminHistoricoViatura',
      'adminBuscaGlobal','adminRelatorios','adminCartoes','adminSalvarCartao','adminAtualizarStatusAlerta','adminConsumirNotificacoesNovas',
      'adminSalvarViatura','adminRegistrarRevisaoViatura','adminImportarFrotaOficial','adminAtualizarViaturasEmMassa',
      'adminAtualizarAvaria','adminAlterarMinhaSenha'
    ],
    SUBCMD: [
      'adminDashboard','adminAlertas','adminAlertasRecentes','adminChecklists','adminChecklistDetalhe',
      'adminAvarias','adminAvariaDetalhe','adminViaturas','adminViaturaDetalhe','adminHistoricoViatura',
      'adminBuscaGlobal','adminRelatorios','adminCartoes','adminSalvarCartao','adminAtualizarStatusAlerta','adminConsumirNotificacoesNovas',
      'adminSalvarViatura','adminRegistrarRevisaoViatura','adminImportarFrotaOficial','adminAtualizarViaturasEmMassa',
      'adminAtualizarAvaria','adminAlterarMinhaSenha'
    ],
    FISCAL: [
      'adminDashboard','adminAlertas','adminAlertasRecentes','adminChecklists','adminChecklistDetalhe',
      'adminAvarias','adminAvariaDetalhe','adminViaturas','adminViaturaDetalhe','adminHistoricoViatura',
      'adminBuscaGlobal','adminRelatorios','adminCartoes','adminSalvarCartao','adminAtualizarStatusAlerta','adminConsumirNotificacoesNovas','adminAtualizarAvaria',
      'adminAlterarMinhaSenha'
    ],
    DEV: ['*']
  }
});

let ADMIN_AUTH_STRUCTURE_READY_=false;
const ADMIN_AUTH_HEADER_CACHE_={};
const ADMIN_HEX_TABLE_=Array.from({length:256},(_,i)=>('0'+i.toString(16)).slice(-2));

function ensureAdminAuthStructure_(){
  if(ADMIN_AUTH_STRUCTURE_READY_)return {success:true};
  const ss=getSpreadsheet_();
  const users=ss.getSheetByName(SIGVTR.SHEETS.USERS);
  if(!users)throw new Error('Aba USUARIOS não encontrada.');
  ensureColumns_(users,ADMIN_AUTH.USER_COLUMNS);
  let sessions=ss.getSheetByName(ADMIN_AUTH.SESSION_SHEET);
  if(!sessions){sessions=ss.insertSheet(ADMIN_AUTH.SESSION_SHEET);sessions.getRange(1,1,1,ADMIN_AUTH.SESSION_COLUMNS.length).setValues([ADMIN_AUTH.SESSION_COLUMNS]);}
  else ensureColumns_(sessions,ADMIN_AUTH.SESSION_COLUMNS);
  ADMIN_AUTH_STRUCTURE_READY_=true;
  return {success:true};
}
function ensureColumns_(sheet,columns){
  const last=Math.max(1,sheet.getLastColumn());
  const headers=sheet.getRange(1,1,1,last).getValues()[0].map(v=>String(v||'').trim());
  columns.forEach(name=>{if(headers.indexOf(name)<0){headers.push(name);sheet.getRange(1,headers.length).setValue(name);}});
}
function adminHeaderMap_(sheet){
  const key=String(sheet.getSheetId());
  if(ADMIN_AUTH_HEADER_CACHE_[key])return ADMIN_AUTH_HEADER_CACHE_[key];
  const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(v=>String(v||'').trim());
  const map={};headers.forEach((h,i)=>map[h]=i);
  return ADMIN_AUTH_HEADER_CACHE_[key]={headers,map};
}
function adminNormalizeLogin_(v){return String(v||'').trim().toLowerCase();}
function adminNormalizeRole_(v){const role=String(v||'').trim().toUpperCase();if(ADMIN_AUTH.VALID_ROLES.indexOf(role)<0)throw new Error('Perfil administrativo inválido.');return role;}
function adminIsYes_(v){return ['SIM','S','TRUE','1','ATIVO'].indexOf(String(v||'').trim().toUpperCase())>=0;}
function adminNowIso_(){return Utilities.formatDate(new Date(),SIGVTR.TIMEZONE,"yyyy-MM-dd'T'HH:mm:ssXXX");}
function adminSecret_(name){const v=PropertiesService.getScriptProperties().getProperty(name);if(!v)throw new Error('Configuração de segurança ausente: '+name+'.');return v;}
function adminBytesHex_(bytes){let out='';for(let i=0;i<bytes.length;i++)out+=ADMIN_HEX_TABLE_[(bytes[i]+256)&255];return out;}
function adminHmacHex_(value,key){return adminBytesHex_(Utilities.computeHmacSha256Signature(String(value),String(key),Utilities.Charset.UTF_8));}
function adminTokenHash_(token){return adminHmacHex_(token,adminSecret_('SESSION_SECRET'));}
function adminPasswordHash_(password,salt){
  const pepper=adminSecret_('PASSWORD_PEPPER');
  let block=adminHmacHex_(String(password)+'|'+String(salt),pepper);
  for(let i=1;i<ADMIN_AUTH.PASSWORD_KDF_ROUNDS;i++)block=adminHmacHex_(block+'|'+salt,pepper);
  return block;
}
function adminConstantEqual_(a,b){a=String(a||'');b=String(b||'');let diff=a.length^b.length;const len=Math.max(a.length,b.length);for(let i=0;i<len;i++)diff|=(a.charCodeAt(i%Math.max(1,a.length))||0)^(b.charCodeAt(i%Math.max(1,b.length))||0);return diff===0;}
function adminValidatePassword_(password,login,role){
  password=String(password||'');
  if(password.length<ADMIN_AUTH.PASSWORD_MIN_LENGTH)throw new Error('A senha deve possuir ao menos '+ADMIN_AUTH.PASSWORD_MIN_LENGTH+' caracteres.');
  if(!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password)||!/[^A-Za-z0-9]/.test(password))throw new Error('A senha deve combinar maiúscula, minúscula, número e caractere especial.');
  const low=password.toLowerCase();if(low===String(login||'').toLowerCase()||low===String(role||'').toLowerCase())throw new Error('A senha não pode ser igual ao login ou perfil.');
  const trivial=['123456789012','password123!','senha123456!','sigvtr123456!','admin123456!'];if(trivial.indexOf(low)>=0)throw new Error('Escolha uma senha menos previsível.');
}
function adminFindRowExact_(sheet,columnIndex,value,caseSensitive){
  const lastRow=sheet.getLastRow();if(lastRow<2||columnIndex===undefined||columnIndex<0)return 0;
  const text=String(value||'').trim();if(!text)return 0;
  const finder=sheet.getRange(2,columnIndex+1,lastRow-1,1).createTextFinder(text).matchEntireCell(true).matchCase(!!caseSensitive);
  const cell=finder.findNext();return cell?cell.getRow():0;
}
function adminFindUserByLogin_(login){
  ensureAdminAuthStructure_();const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.USERS),hm=adminHeaderMap_(sh);login=adminNormalizeLogin_(login);
  const row=adminFindRowExact_(sh,hm.map.LOGIN,login,false);if(!row)return null;
  return {sheet:sh,row,values:sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0],hm};
}
function adminFindUserById_(id){
  ensureAdminAuthStructure_();const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.USERS),hm=adminHeaderMap_(sh);
  const row=adminFindRowExact_(sh,hm.map.ID_USUARIO,String(id||''),true);if(!row)return null;
  return {sheet:sh,row,values:sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0],hm};
}
function adminUserObject_(rec){const m=rec.hm.map,v=rec.values;return {id:String(v[m.ID_USUARIO]||''),login:String(v[m.LOGIN]||''),name:String(v[m.NOME_ADMIN]||v[m['Nome de Guerra']]||v[m['Nome Completo']]||v[m.LOGIN]||''),role:String(v[m.PERFIL_ADMIN]||'').toUpperCase(),active:adminIsYes_(v[m.ATIVO_ADMIN]),mustChangePassword:adminIsYes_(v[m.TROCAR_SENHA]),lastLogin:v[m.ULTIMO_LOGIN]||'',blockedUntil:v[m.BLOQUEADO_ATE]||''};}
function adminSetCells_(rec,patch){Object.keys(patch).forEach(k=>{if(rec.hm.map[k]===undefined)return;rec.sheet.getRange(rec.row,rec.hm.map[k]+1).setValue(patch[k]);rec.values[rec.hm.map[k]]=patch[k];});}
function adminLogSecurity_(event,user,module,result,details){
  try{const ss=getSpreadsheet_(),sh=ss.getSheetByName(SIGVTR.SHEETS.LOGS);if(!sh)return;const last=Math.max(1,sh.getLastColumn()),headers=sh.getRange(1,1,1,last).getValues()[0].map(v=>String(v||'').trim());
    const row=new Array(headers.length).fill('');const put=(names,val)=>{for(const n of names){const i=headers.indexOf(n);if(i>=0){row[i]=val;return;}}};
    put(['ID_LOG','ID'], 'LOG-'+Utilities.getUuid());put(['DATA_HORA','Data/Hora','DATA'],new Date());put(['ID_USUARIO'],user&&user.id||'');put(['LOGIN'],user&&user.login||'');put(['PERFIL'],user&&user.role||'');put(['EVENTO','Ação'],event);put(['MODULO'],module||'AUTH');put(['RESULTADO','Resultado'],result||'');put(['DETALHES_SEGUROS','Descrição'],String(details||'').slice(0,500));sh.appendRow(row);
  }catch(_){ }
}
function adminCreateToken_(){return [Utilities.getUuid(),Utilities.getUuid(),Utilities.getUuid(),adminHmacHex_(Utilities.getUuid(),adminSecret_('SESSION_SECRET'))].join('.');}
function adminCreateSession_(user){
  ensureAdminAuthStructure_();const sh=getSpreadsheet_().getSheetByName(ADMIN_AUTH.SESSION_SHEET),now=new Date(),absolute=new Date(now.getTime()+ADMIN_AUTH.SESSION_ABSOLUTE_HOURS*3600000),token=adminCreateToken_();
  sh.appendRow(['SES-'+Utilities.getUuid(),user.id,adminTokenHash_(token),now,absolute,now,'NAO','','']);return {token,expiresAt:absolute.toISOString()};
}
function adminLogin_(data){
  const login=adminNormalizeLogin_(data&&data.login),password=String(data&&data.password||''),generic='Usuário ou senha inválidos.';
  let rec=adminFindUserByLogin_(login);
  if(!rec){adminPasswordHash_(password||'x','fake-'+adminSecret_('SESSION_SECRET').slice(0,12));adminLogSecurity_('LOGIN_FALHA',null,'AUTH','NEGADO','Credenciais inválidas.');return {success:false,code:'INVALID_CREDENTIALS',message:generic};}
  let user=adminUserObject_(rec),m=rec.hm.map,v=rec.values,blocked=v[m.BLOQUEADO_ATE]?new Date(v[m.BLOQUEADO_ATE]):null;
  if(!user.active){adminLogSecurity_('LOGIN_FALHA',user,'AUTH','NEGADO','Credenciais inválidas.');return {success:false,code:'INVALID_CREDENTIALS',message:generic};}
  if(blocked&&blocked.getTime()>Date.now())return {success:false,code:'LOCKED',message:'Acesso temporariamente bloqueado.',blockedUntil:blocked.toISOString()};

  // O cálculo de senha é propositalmente executado fora do ScriptLock. Isso mantém
  // o fator criptográfico integral sem bloquear outros usuários enquanto o KDF roda.
  const expected=String(v[m.SENHA_HASH]||''),salt=String(v[m.SALT]||''),actual=salt?adminPasswordHash_(password,salt):'',valid=!!expected&&!!salt&&adminConstantEqual_(expected,actual);

  const lock=LockService.getScriptLock();lock.waitLock(30000);try{
    // Releitura dentro do lock evita race condition na contagem de falhas/bloqueio.
    rec=adminFindUserByLogin_(login);if(!rec)return {success:false,code:'INVALID_CREDENTIALS',message:generic};
    user=adminUserObject_(rec);m=rec.hm.map;v=rec.values;blocked=v[m.BLOQUEADO_ATE]?new Date(v[m.BLOQUEADO_ATE]):null;
    if(!user.active)return {success:false,code:'INVALID_CREDENTIALS',message:generic};
    if(blocked&&blocked.getTime()>Date.now())return {success:false,code:'LOCKED',message:'Acesso temporariamente bloqueado.',blockedUntil:blocked.toISOString()};
    // Se a credencial foi alterada enquanto o KDF era calculado, refaz a validação no próximo login.
    if(String(v[m.SENHA_HASH]||'')!==expected||String(v[m.SALT]||'')!==salt)return {success:false,code:'CREDENTIAL_CHANGED',message:'Credencial atualizada. Tente novamente.'};
    if(!valid){
      const failures=(Number(v[m.TENTATIVAS_FALHAS])||0)+1,patch={TENTATIVAS_FALHAS:failures,ALTERADO_EM:new Date()};
      if(failures>=ADMIN_AUTH.MAX_FAILED_ATTEMPTS)patch.BLOQUEADO_ATE=new Date(Date.now()+ADMIN_AUTH.BLOCK_MINUTES*60000);
      adminSetCells_(rec,patch);adminLogSecurity_(failures>=ADMIN_AUTH.MAX_FAILED_ATTEMPTS?'USUARIO_BLOQUEADO':'LOGIN_FALHA',user,'AUTH','NEGADO','Credenciais inválidas.');
      return {success:false,code:failures>=ADMIN_AUTH.MAX_FAILED_ATTEMPTS?'LOCKED':'INVALID_CREDENTIALS',message:failures>=ADMIN_AUTH.MAX_FAILED_ATTEMPTS?'Acesso temporariamente bloqueado.':generic};
    }
    adminSetCells_(rec,{TENTATIVAS_FALHAS:0,BLOQUEADO_ATE:'',ULTIMO_LOGIN:new Date()});const session=adminCreateSession_(user);adminLogSecurity_('LOGIN_SUCESSO',user,'AUTH','SUCESSO','Login administrativo.');
    return {success:true,token:session.token,expiresAt:session.expiresAt,user};
  }finally{lock.releaseLock();}
}
function adminValidateSession_(token,touch){
  token=String(token||'');if(!token)throw new Error('SESSION_REQUIRED');ensureAdminAuthStructure_();
  const ss=getSpreadsheet_(),sh=ss.getSheetByName(ADMIN_AUTH.SESSION_SHEET),hm=adminHeaderMap_(sh),hash=adminTokenHash_(token),row=adminFindRowExact_(sh,hm.map.TOKEN_HASH,hash,true),now=Date.now();
  if(!row)throw new Error('SESSION_INVALID');
  const data=sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0];
  if(adminIsYes_(data[hm.map.REVOGADA]))throw new Error('SESSION_INVALID');
  const absolute=new Date(data[hm.map.EXPIRA_EM]).getTime(),last=new Date(data[hm.map.ULTIMA_ATIVIDADE]).getTime();
  if(!absolute||absolute<=now||!last||last+ADMIN_AUTH.SESSION_IDLE_MINUTES*60000<=now){
    sh.getRange(row,hm.map.REVOGADA+1,1,3).setValues([['SIM',new Date(),'EXPIRADA']]);throw new Error('SESSION_EXPIRED');
  }
  const rec=adminFindUserById_(data[hm.map.ID_USUARIO]);if(!rec)throw new Error('SESSION_INVALID');const user=adminUserObject_(rec);if(!user.active)throw new Error('SESSION_INVALID');
  // Evita uma gravação no Sheets a cada chamada administrativa. O timeout continua
  // conservador: a atividade só é renovada quando o último toque tem >= 2 minutos.
  if(touch!==false&&last+ADMIN_AUTH.SESSION_TOUCH_MINUTES*60000<=now)sh.getRange(row,hm.map.ULTIMA_ATIVIDADE+1).setValue(new Date());
  return {user,sessionRow:row,sessionSheet:sh,sessionMap:hm.map};
}
function adminAuthorize_(token,action){const ctx=adminValidateSession_(token,true),role=adminNormalizeRole_(ctx.user.role),perms=ADMIN_AUTH.PERMISSIONS[role]||[];if(perms.indexOf('*')<0&&perms.indexOf(action)<0){adminLogSecurity_('ACESSO_NEGADO',ctx.user,action,'NEGADO','Permissão insuficiente.');throw new Error('FORBIDDEN');}return ctx;}
function adminSessionInfo_(token){const ctx=adminValidateSession_(token,true);return {success:true,user:ctx.user};}
function adminLogout_(token){try{const ctx=adminValidateSession_(token,false);ctx.sessionSheet.getRange(ctx.sessionRow,ctx.sessionMap.REVOGADA+1).setValue('SIM');ctx.sessionSheet.getRange(ctx.sessionRow,ctx.sessionMap.REVOGADA_EM+1).setValue(new Date());ctx.sessionSheet.getRange(ctx.sessionRow,ctx.sessionMap.MOTIVO_REVOGACAO+1).setValue('LOGOUT');adminLogSecurity_('LOGOUT',ctx.user,'AUTH','SUCESSO','Logout administrativo.');}catch(_){}return {success:true};}
function adminRevokeAllSessions_(idUsuario,motivo){ensureAdminAuthStructure_();const sh=getSpreadsheet_().getSheetByName(ADMIN_AUTH.SESSION_SHEET),hm=adminHeaderMap_(sh),data=sh.getDataRange().getValues();for(let r=1;r<data.length;r++)if(String(data[r][hm.map.ID_USUARIO]||'')===String(idUsuario)&&!adminIsYes_(data[r][hm.map.REVOGADA])){sh.getRange(r+1,hm.map.REVOGADA+1,1,3).setValues([['SIM',new Date(),motivo||'REVOGADA']]);}}
function adminChangePassword_(token,data){
  const ctx=adminAuthorize_(token,'adminAlterarMinhaSenha'),rec=adminFindUserById_(ctx.user.id),old=String(data&&data.senhaAtual||''),next=String(data&&data.novaSenha||''),m=rec.hm.map,v=rec.values;
  // Defesa em profundidade: mesmo na troca obrigatória do primeiro acesso,
  // a senha atual é verificada novamente. O fator criptográfico não é reduzido.
  const actual=adminPasswordHash_(old,String(v[m.SALT]||''));if(!adminConstantEqual_(actual,String(v[m.SENHA_HASH]||'')))throw new Error('Senha atual inválida.');
  adminValidatePassword_(next,ctx.user.login,ctx.user.role);const salt=Utilities.getUuid()+Utilities.getUuid(),hash=adminPasswordHash_(next,salt);
  adminSetCells_(rec,{SALT:salt,SENHA_HASH:hash,TROCAR_SENHA:'NAO',ULTIMA_TROCA_SENHA:new Date(),ALTERADO_EM:new Date(),ALTERADO_POR:ctx.user.login});adminRevokeAllSessions_(ctx.user.id,'SENHA_ALTERADA');adminLogSecurity_('SENHA_ALTERADA',ctx.user,'USUARIOS','SUCESSO','Senha própria alterada.');const s=adminCreateSession_(adminUserObject_(rec));return {success:true,token:s.token,expiresAt:s.expiresAt,user:adminUserObject_(rec)};
}
function adminListUsers_(token){const ctx=adminAuthorize_(token,'adminListarUsuarios'),sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.USERS),hm=adminHeaderMap_(sh),data=sh.getDataRange().getValues(),out=[];for(let r=1;r<data.length;r++){if(!adminNormalizeLogin_(data[r][hm.map.LOGIN]))continue;out.push(adminUserObject_({sheet:sh,row:r+1,values:data[r],hm}));}return {users:out,currentUser:ctx.user};}
function adminUpsertUser_(token,data){const ctx=adminAuthorize_(token,'adminSalvarUsuario'),lock=LockService.getScriptLock();lock.waitLock(30000);try{const login=adminNormalizeLogin_(data&&data.login),name=String(data&&data.name||'').trim().slice(0,120),role=adminNormalizeRole_(data&&data.role),active=!!(data&&data.active);if(!/^[a-z0-9._-]{3,40}$/.test(login))throw new Error('Login inválido.');if(!name)throw new Error('Nome obrigatório.');let rec=data&&data.id?adminFindUserById_(data.id):adminFindUserByLogin_(login);if(rec){const existing=adminFindUserByLogin_(login);if(existing&&existing.row!==rec.row)throw new Error('Login já utilizado.');adminSetCells_(rec,{LOGIN:login,NOME_ADMIN:name,PERFIL_ADMIN:role,ATIVO_ADMIN:active?'SIM':'NAO',ALTERADO_EM:new Date(),ALTERADO_POR:ctx.user.login});adminRevokeAllSessions_(adminUserObject_(rec).id,'USUARIO_ALTERADO');adminLogSecurity_('PERFIL_ALTERADO',adminUserObject_(rec),'USUARIOS','SUCESSO','Conta administrativa alterada por DEV.');return {success:true,user:adminUserObject_(rec)};}
    const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.USERS),hm=adminHeaderMap_(sh),row=new Array(sh.getLastColumn()).fill(''),id='USR-ADM-'+Utilities.getUuid();const put=(k,v)=>{if(hm.map[k]!==undefined)row[hm.map[k]]=v;};put('ID_USUARIO',id);put('LOGIN',login);put('NOME_ADMIN',name);put('PERFIL_ADMIN',role);put('ATIVO_ADMIN',active?'SIM':'NAO');put('TROCAR_SENHA','SIM');put('CRIADO_EM',new Date());put('CRIADO_POR',ctx.user.login);put('ALTERADO_EM',new Date());put('ALTERADO_POR',ctx.user.login);sh.appendRow(row);adminLogSecurity_('USUARIO_CRIADO',{id,login,name,role},'USUARIOS','SUCESSO','Conta administrativa criada sem senha.');return {success:true,user:{id,login,name,role,active,mustChangePassword:true}};
  }finally{lock.releaseLock();}}
function adminResetPassword_(token,data){const ctx=adminAuthorize_(token,'adminRedefinirSenha'),rec=adminFindUserById_(data&&data.id);if(!rec)throw new Error('Usuário não encontrado.');const user=adminUserObject_(rec),password=String(data&&data.novaSenha||'');adminValidatePassword_(password,user.login,user.role);const salt=Utilities.getUuid()+Utilities.getUuid(),hash=adminPasswordHash_(password,salt);adminSetCells_(rec,{SALT:salt,SENHA_HASH:hash,TROCAR_SENHA:'SIM',TENTATIVAS_FALHAS:0,BLOQUEADO_ATE:'',ULTIMA_TROCA_SENHA:new Date(),ALTERADO_EM:new Date(),ALTERADO_POR:ctx.user.login});adminRevokeAllSessions_(user.id,'SENHA_REDEFINIDA');adminLogSecurity_('SENHA_REDEFINIDA',user,'USUARIOS','SUCESSO','Senha redefinida por DEV.');return {success:true};}
function adminSetUserActive_(token,data){const ctx=adminAuthorize_(token,'adminAtivarDesativarUsuario'),rec=adminFindUserById_(data&&data.id);if(!rec)throw new Error('Usuário não encontrado.');const user=adminUserObject_(rec),active=!!data.active;if(user.role==='DEV'&&!active&&user.id===ctx.user.id)throw new Error('O DEV não pode desativar a própria conta em uso.');adminSetCells_(rec,{ATIVO_ADMIN:active?'SIM':'NAO',ALTERADO_EM:new Date(),ALTERADO_POR:ctx.user.login});if(!active)adminRevokeAllSessions_(user.id,'USUARIO_DESATIVADO');adminLogSecurity_(active?'USUARIO_ATIVADO':'USUARIO_DESATIVADO',user,'USUARIOS','SUCESSO','Status alterado por DEV.');return {success:true};}
function adminEndUserSessions_(token,data){const ctx=adminAuthorize_(token,'adminEncerrarSessoes'),rec=adminFindUserById_(data&&data.id);if(!rec)throw new Error('Usuário não encontrado.');const user=adminUserObject_(rec);adminRevokeAllSessions_(user.id,'REVOGACAO_DEV');adminLogSecurity_('SESSAO_REVOGADA',user,'USUARIOS','SUCESSO','Sessões encerradas por '+ctx.user.login+'.');return {success:true};}

function configurarSegredosAutenticacao_(){
  const props=PropertiesService.getScriptProperties(),made=[];
  if(!props.getProperty('PASSWORD_PEPPER')){props.setProperty('PASSWORD_PEPPER',[Utilities.getUuid(),Utilities.getUuid(),Utilities.getUuid(),Utilities.getUuid()].join(''));made.push('PASSWORD_PEPPER');}
  if(!props.getProperty('SESSION_SECRET')){props.setProperty('SESSION_SECRET',[Utilities.getUuid(),Utilities.getUuid(),Utilities.getUuid(),Utilities.getUuid()].join(''));made.push('SESSION_SECRET');}
  return {success:true,created:made,alreadyPresent:made.length===0};
}

/*
 * BOOTSTRAP INICIAL SEGURO
 * 1) Em Configurações do projeto > Propriedades do script, crie temporariamente:
 *    INITIAL_PASSWORD_CMD, INITIAL_PASSWORD_SUBCMD, INITIAL_PASSWORD_FISCAL, INITIAL_PASSWORD_DEV
 *    PASSWORD_PEPPER e SESSION_SECRET (valores aleatórios longos).
 * 2) Execute bootstrapInitialUsers_() manualmente pelo editor.
 * 3) A função apaga as quatro INITIAL_PASSWORD_* após o uso.
 */
function bootstrapInitialUsers_(){
  ensureAdminAuthStructure_();const props=PropertiesService.getScriptProperties();if(props.getProperty('ADMIN_BOOTSTRAP_DONE')==='SIM')throw new Error('Bootstrap administrativo já executado.');
  adminSecret_('PASSWORD_PEPPER');adminSecret_('SESSION_SECRET');
  const specs=[['cmd','Comandante','CMD','INITIAL_PASSWORD_CMD'],['subcmd','Subcomandante','SUBCMD','INITIAL_PASSWORD_SUBCMD'],['fiscal','Fiscal / P4','FISCAL','INITIAL_PASSWORD_FISCAL'],['dev','Desenvolvedor','DEV','INITIAL_PASSWORD_DEV']];
  specs.forEach(s=>{const pass=props.getProperty(s[3]);if(!pass)throw new Error('Propriedade temporária ausente: '+s[3]);adminValidatePassword_(pass,s[0],s[2]);});
  const sh=getSpreadsheet_().getSheetByName(SIGVTR.SHEETS.USERS),hm=adminHeaderMap_(sh);
  specs.forEach(s=>{let rec=adminFindUserByLogin_(s[0]);if(!rec){const row=new Array(sh.getLastColumn()).fill(''),id='USR-ADM-'+Utilities.getUuid(),put=(k,v)=>{if(hm.map[k]!==undefined)row[hm.map[k]]=v;};put('ID_USUARIO',id);put('LOGIN',s[0]);put('NOME_ADMIN',s[1]);put('PERFIL_ADMIN',s[2]);put('ATIVO_ADMIN','SIM');put('CRIADO_EM',new Date());put('CRIADO_POR','BOOTSTRAP');sh.appendRow(row);rec=adminFindUserByLogin_(s[0]);}
    const salt=Utilities.getUuid()+Utilities.getUuid(),hash=adminPasswordHash_(props.getProperty(s[3]),salt);adminSetCells_(rec,{SALT:salt,SENHA_HASH:hash,ATIVO_ADMIN:'SIM',TROCAR_SENHA:'SIM',TENTATIVAS_FALHAS:0,BLOQUEADO_ATE:'',ULTIMA_TROCA_SENHA:new Date(),ALTERADO_EM:new Date(),ALTERADO_POR:'BOOTSTRAP'});
  });
  props.deleteProperty('INITIAL_PASSWORD_CMD');props.deleteProperty('INITIAL_PASSWORD_SUBCMD');props.deleteProperty('INITIAL_PASSWORD_FISCAL');props.deleteProperty('INITIAL_PASSWORD_DEV');props.setProperty('ADMIN_BOOTSTRAP_DONE','SIM');return {success:true,users:['cmd','subcmd','fiscal','dev'],temporaryPasswordsRemoved:true};
}


/** Funções públicas para instalação manual pelo editor do Apps Script. */
function configurarSegredosAutenticacao(){return configurarSegredosAutenticacao_();}
function bootstrapInitialUsers(){return bootstrapInitialUsers_();}
