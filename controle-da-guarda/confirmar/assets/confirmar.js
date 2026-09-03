const GuardConfirmPage=(()=>{
  const $=id=>document.getElementById(id);let rawToken='',operation='RETIRADA',submitting=false;
  const TOKEN_STORAGE_KEY='sigvtr.guarda.confirmacao.token';
  function show(id){$(id).classList.remove('d-none')}function hide(id){$(id).classList.add('d-none')}
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function enforceNoGuardCache(){
    try{if('serviceWorker' in navigator)navigator.serviceWorker.register('../../sw.js?v=1.18.5-rc1').catch(()=>{})}catch(_){}
    try{if(!('caches' in window))return;const names=await caches.keys();for(const name of names){const cache=await caches.open(name),requests=await cache.keys();for(const request of requests){const u=new URL(request.url);if(u.origin===location.origin&&u.pathname.includes('/controle-da-guarda/'))await cache.delete(request)}}}catch(_){}
  }
  function saveTokenForTab(token){try{sessionStorage.setItem(TOKEN_STORAGE_KEY,String(token||''))}catch(_){}}
  function loadTokenForTab(){try{return sessionStorage.getItem(TOKEN_STORAGE_KEY)||''}catch(_){return ''}}
  function clearTokenForTab(){try{sessionStorage.removeItem(TOKEN_STORAGE_KEY)}catch(_){} }
  function formatDateTime(iso){if(!iso)return '';const d=new Date(iso);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(d)}
  function friendlyTokenError(msg){const s=String(msg||'');if(s.includes('QR_CODE_EXPIRADO'))return 'Este QR Code expirou. Solicite ao Comandante da Guarda um novo QR.';if(s.includes('QR_CODE_JA_UTILIZADO'))return 'Esta confirmação já foi concluída.';if(s.includes('QR_CODE_INVALIDO'))return 'QR Code inválido ou não disponível.';return s||'Não foi possível validar esta confirmação.'}
  function isTransientNetworkError(msg){return /temporariamente indisponível|demorou mais que o esperado|failed to fetch|networkerror|load failed|abort/i.test(String(msg||''))}
  function showError(message){hide('loadingView');hide('formView');hide('successView');$('errorMessage').textContent=friendlyTokenError(message);show('errorView')}
  function showSuccess(data){submitting=false;clearTokenForTab();hide('loadingView');hide('formView');hide('errorView');const isReturn=data.operacao==='DEVOLUCAO'||operation==='DEVOLUCAO';$('successTitle').textContent=isReturn?'Devolução confirmada':'Retirada confirmada';$('successDetails').innerHTML=isReturn?`<strong>VTR ${data.vtr?.prefixo||''}</strong><span>KM final: ${data.km??''}</span><span>Percorrido: ${data.kmPercorrido??0} km</span><span>${formatDateTime(data.confirmacaoEm)}</span>`:`<strong>VTR ${data.vtr?.prefixo||''}</strong><span>KM registrado: ${data.km??''}</span><span>${formatDateTime(data.confirmacaoEm)}</span>`;show('successView')}
  function renderTokenInfo(data){operation=data.operacao||'RETIRADA';if(data.confirmado){showSuccess(data);return}const isReturn=operation==='DEVOLUCAO';$('operationTitle').textContent=isReturn?'Confirmação de devolução':'Confirmação de retirada';$('confirmButtonText').textContent=isReturn?'Confirmar devolução':'Confirmar recebimento';$('vtrInfo').textContent=[data.vtr?.prefixo,data.vtr?.placa].filter(Boolean).join(' • ');$('driverInfo').textContent=[data.condutor?.postoGraduacao,data.condutor?.nomeGuerra].filter(Boolean).join(' ');$('requestInfo').textContent=formatDateTime(data.solicitacaoEm);hide('lastKmInfo');hide('initialKmInfo');if(isReturn){$('initialKmInfo').textContent=`KM inicial da retirada: ${data.kmInicial??0}`;show('initialKmInfo')}else if(data.ultimoKmConhecido!==null&&data.ultimoKmConhecido!==undefined){$('lastKmInfo').textContent=`Último KM conhecido no SIGVTR: ${data.ultimoKmConhecido}`;show('lastKmInfo')}hide('loadingView');hide('errorView');show('formView');setTimeout(()=>$('kmInput').focus(),80)}
  async function fetchTokenInfo(){return ApiService.publicPost('guardaPublicoTokenInfo',{token:rawToken},{timeout:15000,retries:0})}
  async function load(){const fromUrl=new URLSearchParams(location.search).get('token')||'';rawToken=fromUrl||loadTokenForTab();if(!rawToken){showError('QR_CODE_INVALIDO');return}if(fromUrl)saveTokenForTab(rawToken);try{history.replaceState(null,document.title,location.pathname)}catch(_){}try{const data=await fetchTokenInfo();renderTokenInfo(data)}catch(error){if(/QR_CODE_EXPIRADO|QR_CODE_INVALIDO/i.test(String(error.message||'')))clearTokenForTab();showError(error.message)}}
  async function reconcileAfterUncertainResult(originalError){
    $('formAlert').textContent='Conexão instável. Verificando se a confirmação foi registrada...';$('formAlert').classList.remove('d-none','alert-danger');$('formAlert').classList.add('alert-warning');
    let lastError=originalError;
    for(let attempt=0;attempt<5;attempt++){
      if(attempt)await sleep(1400+attempt*350);
      try{const info=await fetchTokenInfo();if(info&&info.confirmado){showSuccess(info);return true}if(info&&info.confirmado===false){lastError=null;break}}
      catch(error){lastError=error;if(/QR_CODE_JA_UTILIZADO/i.test(String(error.message||'')))continue;if(!isTransientNetworkError(error.message)&&!/QR_CODE_INVALIDO/i.test(String(error.message||'')))break}
    }
    $('formAlert').classList.remove('alert-warning');$('formAlert').classList.add('alert-danger');
    if(lastError&&isTransientNetworkError(lastError.message))$('formAlert').textContent='Não foi possível confirmar o resultado por causa da conexão. Verifique a rede e toque em Confirmar novamente.';
    else if(lastError)$('formAlert').textContent=friendlyTokenError(lastError.message);
    else $('formAlert').textContent='A confirmação ainda não consta no servidor. Verifique a conexão e toque em Confirmar novamente.';
    return false;
  }
  async function confirm(event){event.preventDefault();if(submitting)return;const km=$('kmInput').value.trim();$('formAlert').classList.add('d-none');$('formAlert').classList.remove('alert-warning');$('formAlert').classList.add('alert-danger');const btn=$('confirmButton');submitting=true;btn.disabled=true;btn.querySelector('.button-label').classList.add('d-none');btn.querySelector('.button-loading').classList.remove('d-none');let completed=false;try{const action=operation==='DEVOLUCAO'?'guardaPublicoConfirmarDevolucao':'guardaPublicoConfirmarRetirada';const data=await ApiService.publicPost(action,{token:rawToken,km},{timeout:20000,retries:0});showSuccess(data);completed=true}catch(error){if(isTransientNetworkError(error.message)||/QR_CODE_JA_UTILIZADO/i.test(String(error.message||''))){completed=await reconcileAfterUncertainResult(error)}else{$('formAlert').textContent=friendlyTokenError(error.message);$('formAlert').classList.remove('d-none')}}finally{if(!completed){submitting=false;btn.disabled=false;btn.querySelector('.button-label').classList.remove('d-none');btn.querySelector('.button-loading').classList.add('d-none')}}}
  function init(){$('confirmForm').addEventListener('submit',confirm);enforceNoGuardCache();load()}
  return{init};
})();
document.addEventListener('DOMContentLoaded',GuardConfirmPage.init);
