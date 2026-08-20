const AuthService=(()=>{
  const TOKEN_KEY='sigvtr_admin_token';
  const SESSION_KEY='sigvtr_admin_session';
  const REMEMBERED_EMAIL_KEY='sigvtr_admin_remembered_email';
  const ALLOWED_ADMIN_PAGES=new Set([
    'index.html','alertas.html','arquivamento.html','assistente.html','avarias.html',
    'busca-global.html','cartoes.html','checklists.html','configuracoes.html',
    'historico-viatura.html','prontuario.html','relatorios.html','trocar-senha.html',
    'usuarios.html','viaturas.html'
  ]);
  const GOOGLE_FILE_HOSTS=new Set(['drive.google.com','docs.google.com','drive.usercontent.google.com']);
  let logoutInProgress=false;

  function readSession(){try{const raw=sessionStorage.getItem(SESSION_KEY);return raw?JSON.parse(raw):null}catch(_){return null}}
  function saveSession(data){sessionStorage.setItem(TOKEN_KEY,data.token);sessionStorage.setItem(SESSION_KEY,JSON.stringify({authenticated:true,expiresAt:data.expiresAt,user:data.user}));return readSession()}
  function clearSession(){sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(SESSION_KEY);try{Object.keys(sessionStorage).filter(k=>k.startsWith('sigvtr_admin_api_')).forEach(k=>sessionStorage.removeItem(k));Object.keys(localStorage).filter(k=>k.startsWith('sigvtr_admin_api_')).forEach(k=>localStorage.removeItem(k))}catch(_){}}

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
  function getSession(){const s=readSession();let t='';try{t=sessionStorage.getItem(TOKEN_KEY)||''}catch(_){}if(!s||!s.authenticated||!s.user||!t)return null;if(s.expiresAt&&Date.now()>=new Date(s.expiresAt).getTime()){clearSession();return null}return s}
  async function validateSession(){const s=getSession();if(!s)return null;try{const data=await ApiService.post('adminValidarSessao',{});const merged={...s,user:data.user};sessionStorage.setItem(SESSION_KEY,JSON.stringify(merged));return merged}catch(_){clearSession();return null}}
  function requireAuthentication(){const s=getSession();if(!s){redirectToLogin();return null}const page=location.pathname.split('/').pop()||'index.html';if(s.user.mustChangePassword&&page!=='trocar-senha.html'){location.replace('trocar-senha.html');return null}if(['usuarios.html','arquivamento.html'].includes(page)&&String(s.user.role||'').toUpperCase()!=='DEV'){location.replace('acesso-negado.html');return null}return s}

  function showLogoutOverlay(){
    document.querySelectorAll('#logoutButton,#topbarLogoutButton').forEach(button=>{button.disabled=true;button.setAttribute('aria-disabled','true')});
    if(document.getElementById('sigvtrLogoutOverlay'))return;
    document.body.insertAdjacentHTML('beforeend','<div id="sigvtrLogoutOverlay" class="logout-overlay" role="status" aria-live="assertive" aria-busy="true"><div class="logout-overlay-card"><span class="spinner-border text-primary" aria-hidden="true"></span><strong>Encerrando sessão...</strong><span>Aguarde enquanto finalizamos seu acesso com segurança.</span></div></div>');
  }

  async function logout(){
    if(logoutInProgress)return;
    logoutInProgress=true;
    try{window.dispatchEvent(new CustomEvent('sigvtr:logout-start'));}catch(_){}
    showLogoutOverlay();
    let remoteConfirmed=false;
    try{
      await ApiService.post('adminLogout',{}, {timeout:20000,retries:0});
      remoteConfirmed=true;
    }catch(_){
      // A revogação remota não pôde ser confirmada. O comportamento existente de limpeza local é preservado.
    }finally{
      clearSession();
      location.replace(remoteConfirmed?'login.html?logout=ok':'login.html?logout=local');
    }
  }

  function rememberEmail(email,shouldRemember){if(shouldRemember)localStorage.setItem(REMEMBERED_EMAIL_KEY,String(email||'').trim().toLowerCase());else localStorage.removeItem(REMEMBERED_EMAIL_KEY)}
  function getRememberedEmail(){return localStorage.getItem(REMEMBERED_EMAIL_KEY)||''}
  function redirectAuthenticatedUser(){const s=getSession();if(!s)return false;location.replace(s.user&&s.user.mustChangePassword?'trocar-senha.html':getReturnUrl());return true}
  function getLockRemainingMs(){return 0}
  async function changePassword(currentPassword,newPassword){const data=await ApiService.post('adminAlterarMinhaSenha',{senhaAtual:currentPassword,novaSenha:newPassword});clearSession();saveSession(data);return data}
  return{login,logout,getSession,validateSession,requireAuthentication,rememberEmail,getRememberedEmail,redirectAuthenticatedUser,getLockRemainingMs,changePassword,clearSession,safeAdminUrl,safeDriveUrl,getReturnUrl};
})();
