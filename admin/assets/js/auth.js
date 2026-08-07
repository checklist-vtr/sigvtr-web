const AuthService=(()=>{
  const TOKEN_KEY='sigvtr_admin_token';
  const SESSION_KEY='sigvtr_admin_session';
  const REMEMBERED_EMAIL_KEY='sigvtr_admin_remembered_email';
  let logoutInProgress=false;
  function readSession(){try{const raw=sessionStorage.getItem(SESSION_KEY);return raw?JSON.parse(raw):null}catch(_){return null}}
  function saveSession(data){sessionStorage.setItem(TOKEN_KEY,data.token);sessionStorage.setItem(SESSION_KEY,JSON.stringify({authenticated:true,expiresAt:data.expiresAt,user:data.user}));return readSession()}
  function clearSession(){sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(SESSION_KEY);try{Object.keys(sessionStorage).filter(k=>k.startsWith('sigvtr_admin_api_')).forEach(k=>sessionStorage.removeItem(k));Object.keys(localStorage).filter(k=>k.startsWith('sigvtr_admin_api_')).forEach(k=>localStorage.removeItem(k))}catch(_){}}
  function getReturnUrl(){const params=new URLSearchParams(location.search),value=params.get('return')||params.get('redirect');if(!value||value.includes('://')||value.startsWith('//'))return 'index.html';return value}
  function redirectToLogin(){const current=`${location.pathname.split('/').pop()||'index.html'}${location.search}`;location.replace(`login.html?return=${encodeURIComponent(current)}`)}
  async function login(login,password){try{const result=await ApiService.publicPost('adminLogin',{login,password});if(!result.success)return result;saveSession(result);return {...result,redirectUrl:result.user&&result.user.mustChangePassword?'trocar-senha.html':getReturnUrl()}}catch(error){return {success:false,code:error.code||'ERROR',message:error.message||'Não foi possível concluir o login.'}}}
  function getSession(){const s=readSession();let t='';try{t=sessionStorage.getItem(TOKEN_KEY)||''}catch(_){}if(!s||!s.authenticated||!s.user||!t)return null;if(s.expiresAt&&Date.now()>=new Date(s.expiresAt).getTime()){clearSession();return null}return s}
  async function validateSession(){const s=getSession();if(!s)return null;try{const data=await ApiService.post('adminValidarSessao',{});const merged={...s,user:data.user};sessionStorage.setItem(SESSION_KEY,JSON.stringify(merged));return merged}catch(_){clearSession();return null}}
  function requireAuthentication(){const s=getSession();if(!s){redirectToLogin();return null}const page=location.pathname.split('/').pop()||'index.html';if(s.user.mustChangePassword&&page!=='trocar-senha.html'){location.replace('trocar-senha.html');return null}return s}
  async function logout(){if(logoutInProgress)return;logoutInProgress=true;try{await ApiService.post('adminLogout',{})}catch(_){}finally{clearSession();location.replace('login.html')}}
  function rememberEmail(email,shouldRemember){if(shouldRemember)localStorage.setItem(REMEMBERED_EMAIL_KEY,String(email||'').trim().toLowerCase());else localStorage.removeItem(REMEMBERED_EMAIL_KEY)}
  function getRememberedEmail(){return localStorage.getItem(REMEMBERED_EMAIL_KEY)||''}
  function redirectAuthenticatedUser(){const s=getSession();if(!s)return false;location.replace(s.user&&s.user.mustChangePassword?'trocar-senha.html':getReturnUrl());return true}
  function getLockRemainingMs(){return 0}
  async function changePassword(currentPassword,newPassword){const data=await ApiService.post('adminAlterarMinhaSenha',{senhaAtual:currentPassword,novaSenha:newPassword});clearSession();saveSession(data);return data}
  return{login,logout,getSession,validateSession,requireAuthentication,rememberEmail,getRememberedEmail,redirectAuthenticatedUser,getLockRemainingMs,changePassword,clearSession};
})();
