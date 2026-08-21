const AuthService=(()=>{
  const TOKEN_KEY='sigvtr_admin_token';
  const SESSION_KEY='sigvtr_admin_session';
  const REMEMBERED_EMAIL_KEY='sigvtr_admin_remembered_email';
  const IDLE_DEADLINE_KEY='sigvtr_admin_idle_deadline';
  const LAST_KEEPALIVE_KEY='sigvtr_admin_last_keepalive';
  const IDLE_MS=30*60*1000;
  const WARNING_MS=5*60*1000;
  const MODAL_MS=2*60*1000;
  const KEEPALIVE_MIN_INTERVAL_MS=2*60*1000;
  const ALLOWED_ADMIN_PAGES=new Set([
    'index.html','alertas.html','arquivamento.html','assistente.html','avarias.html',
    'busca-global.html','cartoes.html','checklists.html','configuracoes.html',
    'historico-viatura.html','prontuario.html','relatorios.html','trocar-senha.html',
    'usuarios.html','viaturas.html'
  ]);
  const GOOGLE_FILE_HOSTS=new Set(['drive.google.com','docs.google.com','drive.usercontent.google.com']);
  let logoutInProgress=false;
  let idleTimer=null;
  let idleUiStarted=false;
  let idleModal=null;
  let idleModalVisible=false;
  let keepaliveInProgress=false;

  function readSession(){try{const raw=sessionStorage.getItem(SESSION_KEY);return raw?JSON.parse(raw):null}catch(_){return null}}
  function setIdleDeadline(value){try{sessionStorage.setItem(IDLE_DEADLINE_KEY,String(Number(value)||0))}catch(_){}}
  function getIdleDeadline(){try{return Number(sessionStorage.getItem(IDLE_DEADLINE_KEY)||0)||0}catch(_){return 0}}
  function markKeepalive(){try{sessionStorage.setItem(LAST_KEEPALIVE_KEY,String(Date.now()))}catch(_){}}
  function lastKeepalive(){try{return Number(sessionStorage.getItem(LAST_KEEPALIVE_KEY)||0)||0}catch(_){return 0}}
  function saveSession(data){
    sessionStorage.setItem(TOKEN_KEY,data.token);
    sessionStorage.setItem(SESSION_KEY,JSON.stringify({authenticated:true,expiresAt:data.expiresAt,user:data.user}));
    setIdleDeadline(Date.now()+IDLE_MS);markKeepalive();
    return readSession();
  }
  function clearSession(){
    sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(IDLE_DEADLINE_KEY);sessionStorage.removeItem(LAST_KEEPALIVE_KEY);
    try{Object.keys(sessionStorage).filter(k=>k.startsWith('sigvtr_admin_api_')).forEach(k=>sessionStorage.removeItem(k));Object.keys(localStorage).filter(k=>k.startsWith('sigvtr_admin_api_')).forEach(k=>localStorage.removeItem(k))}catch(_){}
    stopIdleTimer();
  }

  function safeAdminUrl(value,fallback='index.html'){
    const raw=String(value||'').trim();
    if(!raw||/[\\\u0000-\u001F\u007F]/.test(raw)||raw.startsWith('/')||raw.startsWith('.')||/^[a-z][a-z0-9+.-]*:/i.test(raw))return fallback;
    const match=raw.match(/^([A-Za-z0-9-]+\.html)(?:[?#].*)?$/);
    if(!match||!ALLOWED_ADMIN_PAGES.has(match[1]))return fallback;
    try{
      const url=new URL(raw,location.href);
      if(url.origin!==location.origin)return fallback;
      const page=url.pathname.split('/').pop()||'';
      if(page!==match[1]||!ALLOWED_ADMIN_PAGES.has(page))return fallback;
      return `${page}${url.search}${url.hash}`;
    }catch(_){return fallback}
  }

  function safeDriveUrl(value,fallback=''){
    const raw=String(value||'').trim();
    if(!raw)return fallback;
    try{
      const url=new URL(raw);
      const host=url.hostname.toLowerCase();
      const allowedHost=GOOGLE_FILE_HOSTS.has(host)||host==='googleusercontent.com'||host.endsWith('.googleusercontent.com');
      return url.protocol==='https:'&&allowedHost?url.href:fallback;
    }catch(_){return fallback}
  }

  function getReturnUrl(){const params=new URLSearchParams(location.search);return safeAdminUrl(params.get('return')||params.get('redirect'),'index.html')}
  function redirectToLogin(){const current=`${location.pathname.split('/').pop()||'index.html'}${location.search}`;location.replace(`login.html?return=${encodeURIComponent(safeAdminUrl(current,'index.html'))}`)}
  async function login(login,password){try{const result=await ApiService.publicPost('adminLogin',{login,password});if(!result.success)return result;saveSession(result);return {...result,redirectUrl:result.user&&result.user.mustChangePassword?'trocar-senha.html':getReturnUrl()}}catch(error){return {success:false,code:error.code||'ERROR',message:error.message||'Não foi possível concluir o login.'}}}
  function getSession(){
    const s=readSession();let t='';try{t=sessionStorage.getItem(TOKEN_KEY)||''}catch(_){}
    if(!s||!s.authenticated||!s.user||!t)return null;
    const absolute=s.expiresAt?new Date(s.expiresAt).getTime():0;
    if(absolute&&Date.now()>=absolute){clearSession();return null}
    return s;
  }
  function syncDeadlineFromServer(data){
    const serverDeadline=Number(data&&data.idleExpiresAtMs||0);
    const absolute=Number(data&&data.absoluteExpiresAtMs||0);
    if(serverDeadline)setIdleDeadline(absolute?Math.min(serverDeadline,absolute):serverDeadline);
    markKeepalive();updateIdleUi();
  }
  async function validateSession(){
    const s=getSession();if(!s)return null;
    try{
      const data=await ApiService.post('adminValidarSessao',{});
      const merged={...s,user:data.user,expiresAt:data.absoluteExpiresAt||s.expiresAt};
      sessionStorage.setItem(SESSION_KEY,JSON.stringify(merged));syncDeadlineFromServer(data);return merged;
    }catch(_){clearSession();return null}
  }
  function requireAuthentication(){
    const s=getSession();if(!s){redirectToLogin();return null}
    const page=location.pathname.split('/').pop()||'index.html';
    if(s.user.mustChangePassword&&page!=='trocar-senha.html'){location.replace('trocar-senha.html');return null}
    if(['usuarios.html','arquivamento.html'].includes(page)&&String(s.user.role||'').toUpperCase()!=='DEV'){location.replace('acesso-negado.html');return null}
    if(!getIdleDeadline())setIdleDeadline(Math.min(Date.now()+IDLE_MS,s.expiresAt?new Date(s.expiresAt).getTime():Infinity));
    setTimeout(startIdleTimer,0);
    return s;
  }

  function showLogoutOverlay(message){
    document.querySelectorAll('#logoutButton,#topbarLogoutButton').forEach(button=>{button.disabled=true;button.setAttribute('aria-disabled','true')});
    if(document.getElementById('sigvtrLogoutOverlay'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="sigvtrLogoutOverlay" class="logout-overlay" role="status" aria-live="assertive" aria-busy="true"><div class="logout-overlay-card"><span class="spinner-border text-primary" aria-hidden="true"></span><strong>${message||'Encerrando sessão...'}</strong><span>Aguarde enquanto finalizamos seu acesso com segurança.</span></div></div>`);
  }

  async function logout(reason='manual'){
    if(logoutInProgress)return;
    logoutInProgress=true;stopIdleTimer();
    try{window.dispatchEvent(new CustomEvent('sigvtr:logout-start',{detail:{reason}}));}catch(_){}
    showLogoutOverlay(reason==='idle'?'Sessão expirada por inatividade...':'Encerrando sessão...');
    let remoteConfirmed=false;
    try{if(typeof ApiService!=='undefined'){await ApiService.post('adminLogout',{}, {timeout:20000,retries:0});remoteConfirmed=true;}}catch(_){}
    finally{
      clearSession();
      if(reason==='idle')location.replace('login.html?reason=idle');
      else if(reason==='absolute')location.replace('login.html?reason=absolute');
      else location.replace(remoteConfirmed?'login.html?logout=ok':'login.html?logout=local');
    }
  }

  function formatRemaining(ms){const sec=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(sec/60),s=sec%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  function currentDeadlines(){
    const session=readSession();if(!session||!session.authenticated)return {remaining:0,idle:0,absolute:0,isAbsolute:false};
    const idle=getIdleDeadline()||Date.now()+IDLE_MS;
    const absolute=session.expiresAt?new Date(session.expiresAt).getTime():0;
    const target=absolute?Math.min(idle,absolute):idle;
    return {remaining:target-Date.now(),idle,absolute,isAbsolute:!!absolute&&absolute<=idle};
  }
  function ensureIdleUi(){
    if(document.getElementById('sessionIdleIndicator'))return true;
    const host=document.querySelector('.topbar-right');if(!host)return false;
    const logoutButton=host.querySelector('#topbarLogoutButton');
    const html='<button id="sessionIdleIndicator" class="session-idle-indicator session-ok" type="button" title="Tempo restante por inatividade" aria-label="Tempo restante da sessão"><i class="bi bi-shield-lock-fill"></i><span class="session-idle-label">Sessão</span><strong id="sessionIdleTime">30:00</strong></button>';
    if(logoutButton)logoutButton.insertAdjacentHTML('beforebegin',html);else host.insertAdjacentHTML('beforeend',html);
    document.getElementById('sessionIdleIndicator').addEventListener('click',()=>{const d=currentDeadlines();if(d.remaining<=MODAL_MS)showIdleWarning(d);});
    return true;
  }
  function ensureIdleModal(){
    let el=document.getElementById('sessionIdleModal');if(el)return el;
    document.body.insertAdjacentHTML('beforeend',`<div class="modal fade" id="sessionIdleModal" tabindex="-1" aria-labelledby="sessionIdleModalTitle" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content session-idle-modal"><div class="modal-header border-0"><div class="session-idle-modal-icon"><i class="bi bi-clock-history"></i></div><div><p class="session-idle-kicker mb-1">Segurança da sessão</p><h2 class="modal-title h5 mb-0" id="sessionIdleModalTitle">Sessão prestes a expirar</h2></div></div><div class="modal-body pt-0"><p id="sessionIdleMessage" class="text-secondary">Por segurança, sua sessão será encerrada por inatividade.</p><div id="sessionIdleModalTime" class="session-idle-countdown">02:00</div><div class="progress session-idle-progress" role="progressbar" aria-label="Tempo restante"><div id="sessionIdleProgressBar" class="progress-bar" style="width:100%"></div></div><p class="small text-secondary mt-3 mb-0">Se estiver trabalhando em um formulário, continuar conectado mantém a página e os dados preenchidos.</p></div><div class="modal-footer border-0"><button id="sessionIdleExitNow" type="button" class="btn btn-outline-secondary">Sair agora</button><button id="sessionIdleContinue" type="button" class="btn btn-primary"><i class="bi bi-shield-check me-1"></i>Continuar conectado</button></div></div></div></div>`);
    el=document.getElementById('sessionIdleModal');
    document.getElementById('sessionIdleExitNow').addEventListener('click',()=>logout('manual'));
    document.getElementById('sessionIdleContinue').addEventListener('click',continueConnected);
    el.addEventListener('shown.bs.modal',()=>{idleModalVisible=true});
    el.addEventListener('hidden.bs.modal',()=>{idleModalVisible=false});
    return el;
  }
  function showIdleWarning(deadlines){
    const el=ensureIdleModal();if(!window.bootstrap||!bootstrap.Modal)return;
    const absolute=deadlines&&deadlines.isAbsolute;
    const title=document.getElementById('sessionIdleModalTitle'),message=document.getElementById('sessionIdleMessage'),button=document.getElementById('sessionIdleContinue');
    if(absolute){title.textContent='Limite máximo da sessão próximo';message.textContent='Por segurança, esta sessão atingirá o limite máximo de 8 horas. Será necessário entrar novamente.';button.classList.add('d-none');}
    else{title.textContent='Sessão prestes a expirar';message.textContent='Por segurança, sua sessão será encerrada por inatividade. Clique em Continuar conectado para renovar mais 30 minutos.';button.classList.remove('d-none');}
    idleModal=bootstrap.Modal.getOrCreateInstance(el,{backdrop:'static',keyboard:false});if(!idleModalVisible)idleModal.show();
  }
  function hideIdleWarning(){if(idleModal){try{idleModal.hide()}catch(_){}}}
  function updateIdleUi(){
    const stored=readSession();if(!stored||!stored.authenticated)return;
    ensureIdleUi();const d=currentDeadlines(),remaining=d.remaining;
    const indicator=document.getElementById('sessionIdleIndicator'),time=document.getElementById('sessionIdleTime');
    if(time)time.textContent=formatRemaining(remaining);
    if(indicator){indicator.classList.toggle('session-warning',remaining<=WARNING_MS&&remaining>MODAL_MS);indicator.classList.toggle('session-danger',remaining<=MODAL_MS);indicator.classList.toggle('session-ok',remaining>WARNING_MS);indicator.title=d.isAbsolute?'Tempo restante até o limite máximo da sessão':'Tempo restante por inatividade';}
    const modalTime=document.getElementById('sessionIdleModalTime');if(modalTime)modalTime.textContent=formatRemaining(remaining);
    const bar=document.getElementById('sessionIdleProgressBar');if(bar){const base=d.isAbsolute?MODAL_MS:MODAL_MS;bar.style.width=`${Math.max(0,Math.min(100,(remaining/base)*100))}%`;}
    if(remaining<=0){logout(d.isAbsolute?'absolute':'idle');return;}
    if(remaining<=MODAL_MS)showIdleWarning(d);
  }
  async function renewSession(force=false){
    if(keepaliveInProgress||logoutInProgress||typeof ApiService==='undefined')return false;
    const now=Date.now();if(!force&&now-lastKeepalive()<KEEPALIVE_MIN_INTERVAL_MS)return true;
    keepaliveInProgress=true;
    try{
      const data=await ApiService.post('adminValidarSessao',{}, {timeout:20000,retries:0});
      const s=getSession();if(!s)return false;
      const merged={...s,user:data.user,expiresAt:data.absoluteExpiresAt||s.expiresAt};sessionStorage.setItem(SESSION_KEY,JSON.stringify(merged));
      syncDeadlineFromServer(data);return true;
    }catch(_){clearSession();location.replace('login.html?reason=expired');return false;}
    finally{keepaliveInProgress=false;}
  }
  async function continueConnected(){
    const button=document.getElementById('sessionIdleContinue');if(button){button.disabled=true;button.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Renovando...';}
    const ok=await renewSession(true);
    if(ok){setIdleDeadline(Math.min(Date.now()+IDLE_MS,(getSession()&&getSession().expiresAt)?new Date(getSession().expiresAt).getTime():Infinity));hideIdleWarning();updateIdleUi();}
    if(button){button.disabled=false;button.innerHTML='<i class="bi bi-shield-check me-1"></i>Continuar conectado';}
  }
  function isMeaningfulTarget(target){return !!(target&&target.closest&&target.closest('a,button,input,select,textarea,[role="button"],[contenteditable="true"]'))}
  function noteUserActivity(event){
    if(logoutInProgress||idleModalVisible||!getSession())return;
    if(event&&event.type==='pointerdown'&&!isMeaningfulTarget(event.target))return;
    if(event&&event.type==='keydown'&&!isMeaningfulTarget(event.target))return;
    const deadlines=currentDeadlines();if(deadlines.remaining<=MODAL_MS)return;
    const s=getSession(),absolute=s&&s.expiresAt?new Date(s.expiresAt).getTime():0,now=Date.now(),last=lastKeepalive();
    if(now-last>=KEEPALIVE_MIN_INTERVAL_MS){renewSession(false);return;}
    const serverAligned=(last||now)+IDLE_MS;setIdleDeadline(absolute?Math.min(serverAligned,absolute):serverAligned);updateIdleUi();
  }
  function startIdleTimer(){
    if(idleUiStarted||!getSession())return;
    if(!ensureIdleUi())return;
    idleUiStarted=true;ensureIdleModal();updateIdleUi();
    document.addEventListener('pointerdown',noteUserActivity,{passive:true});
    document.addEventListener('keydown',noteUserActivity);
    document.addEventListener('submit',noteUserActivity,true);
    idleTimer=setInterval(updateIdleUi,1000);
  }
  function stopIdleTimer(){
    if(idleTimer){clearInterval(idleTimer);idleTimer=null;}
    if(idleUiStarted){document.removeEventListener('pointerdown',noteUserActivity);document.removeEventListener('keydown',noteUserActivity);document.removeEventListener('submit',noteUserActivity,true);}
    idleUiStarted=false;idleModalVisible=false;
  }

  function rememberEmail(email,shouldRemember){if(shouldRemember)localStorage.setItem(REMEMBERED_EMAIL_KEY,String(email||'').trim().toLowerCase());else localStorage.removeItem(REMEMBERED_EMAIL_KEY)}
  function getRememberedEmail(){return localStorage.getItem(REMEMBERED_EMAIL_KEY)||''}
  function redirectAuthenticatedUser(){const s=getSession();if(!s)return false;location.replace(s.user&&s.user.mustChangePassword?'trocar-senha.html':getReturnUrl());return true}
  function getLockRemainingMs(){return 0}
  async function changePassword(currentPassword,newPassword){const data=await ApiService.post('adminAlterarMinhaSenha',{senhaAtual:currentPassword,novaSenha:newPassword});clearSession();saveSession(data);return data}
  return{login,logout,getSession,validateSession,requireAuthentication,rememberEmail,getRememberedEmail,redirectAuthenticatedUser,getLockRemainingMs,changePassword,clearSession,safeAdminUrl,safeDriveUrl,getReturnUrl,startIdleTimer,renewSession};
})();
