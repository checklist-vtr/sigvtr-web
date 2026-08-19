const LoginPage=(()=>{
  const elements={};
  let loginInProgress=false;
  function cacheElements(){elements.form=document.getElementById('loginForm');elements.email=document.getElementById('email');elements.password=document.getElementById('password');elements.remember=document.getElementById('rememberEmail');elements.alert=document.getElementById('loginAlert');elements.button=document.getElementById('loginButton');elements.label=elements.button.querySelector('.button-label');elements.loading=elements.button.querySelector('.button-loading')}
  function showAlert(message,type='danger'){elements.alert.className=`alert alert-${type}`;elements.alert.textContent=message}
  function hideAlert(){elements.alert.className='alert d-none';elements.alert.textContent=''}
  function setLoading(v){elements.button.disabled=v;elements.label.classList.toggle('d-none',v);elements.loading.classList.toggle('d-none',!v)}
  function showLogoutResult(){const state=new URLSearchParams(location.search).get('logout');if(state==='local')showAlert('Sessão encerrada neste dispositivo. A confirmação de encerramento no servidor não pôde ser concluída.','warning')}
  async function handleSubmit(event){
    event.preventDefault();
    if(loginInProgress)return;
    hideAlert();
    if(!elements.form.checkValidity()){elements.form.classList.add('was-validated');return}
    loginInProgress=true;
    setLoading(true);
    let redirectPending=false;
    try{
      const result=await AuthService.login(elements.email.value,elements.password.value);
      if(!result.success){elements.password.value='';elements.password.focus();showAlert(result.message||'Usuário ou senha inválidos.');return}
      AuthService.rememberEmail(elements.email.value,elements.remember.checked);
      showAlert('Acesso autorizado. Redirecionando...','success');
      redirectPending=true;
      setTimeout(()=>location.replace(result.redirectUrl||AuthService.getReturnUrl()),250);
    }catch(error){showAlert('Não foi possível concluir o login. Atualize a página e tente novamente.')}finally{if(!redirectPending){loginInProgress=false;setLoading(false)}}
  }
  function bindEvents(){elements.form.addEventListener('submit',handleSubmit);document.getElementById('togglePassword').addEventListener('click',event=>{const visible=elements.password.type==='text';elements.password.type=visible?'password':'text';event.currentTarget.innerHTML=visible?'<i class="bi bi-eye"></i>':'<i class="bi bi-eye-slash"></i>';event.currentTarget.setAttribute('aria-label',visible?'Mostrar senha':'Ocultar senha')});document.getElementById('forgotPassword').addEventListener('click',()=>showAlert('Solicite ao DEV a redefinição da senha.','info'))}
  function init(){cacheElements();if(AuthService.redirectAuthenticatedUser())return;const remembered=AuthService.getRememberedEmail();if(remembered){elements.email.value=remembered;elements.remember.checked=true;elements.password.focus()}bindEvents();showLogoutResult()}
  return{init};
})();document.addEventListener('DOMContentLoaded',LoginPage.init);
