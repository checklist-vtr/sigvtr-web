const GuardPage=(()=>{
  const TOKEN_KEY='sigvtr_admin_token',SESSION_KEY='sigvtr_admin_session';
  const GUARD_IDLE_TIMEOUT_MS=30*60*1000;
  const state={context:null,vehicles:[],selectedVehicle:null,selectedMilitary:null,searchTimer:null,commanderSearchTimer:null,loginBusy:false,currentMovement:null,currentOperation:'RETIRADA',pollTimer:null,pendingPassword:false,closeMode:'NORMAL',closeTurnId:'',lastPdf:null,idleTimer:null,idleExpiring:false};
  const $=id=>document.getElementById(id);
  const show=id=>$(id)?.classList.remove('d-none');
  const hide=id=>$(id)?.classList.add('d-none');
  function escapeHtml(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function alertBox(message,type='danger',target='appAlert'){const el=$(target);if(!el)return;el.className=`alert alert-${type}`;el.textContent=message;el.classList.remove('d-none')}
  function clearAlert(target='appAlert'){const el=$(target);if(!el)return;el.className='alert d-none';el.textContent=''}
  function token(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch(_){return ''}}
  function clearSession(){try{sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(SESSION_KEY)}catch(_){}}
  function saveLogin(result){sessionStorage.setItem(TOKEN_KEY,result.token);sessionStorage.setItem(SESSION_KEY,JSON.stringify({authenticated:true,expiresAt:result.expiresAt,user:result.user}));resetIdleTimer()}
  function formatDateTime(iso){if(!iso)return '';const d=new Date(iso);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(d)}
  function setLoading(on){$('loadingScreen').style.display=on?'flex':'none'}
  function stopIdleTimer(){if(state.idleTimer){clearTimeout(state.idleTimer);state.idleTimer=null}}
  function resetIdleTimer(){
    if(!token()||state.idleExpiring)return;stopIdleTimer();state.idleTimer=setTimeout(expireForInactivity,GUARD_IDLE_TIMEOUT_MS)
  }
  async function expireForInactivity(){
    if(state.idleExpiring||!token())return;state.idleExpiring=true;stopPolling();stopIdleTimer();
    try{await ApiService.post('adminLogout',{}, {timeout:5000,retries:0})}catch(_){}
    clearSession();state.context=null;state.idleExpiring=false;hide('appView');show('loginView');setLoading(false);$('password').value='';alertBox('Sessão encerrada após 30 minutos de inatividade. Entre novamente.','warning','loginAlert');setTimeout(()=>$('login').focus(),50)
  }
  function bindIdleActivity(){
    ['pointerdown','keydown','touchstart','scroll'].forEach(name=>window.addEventListener(name,()=>{if(token())resetIdleTimer()},{passive:true}))
  }

  async function loadContext(){const data=await ApiService.post('guardaContexto',{});state.context=data;state.vehicles=Array.isArray(data.viaturas)?data.viaturas:[];resetIdleTimer();renderApp();if(data.turno&&(!Array.isArray(data.movimentacoes)||data.movimentacoes.length===0)){setTimeout(()=>refreshMovements(false),250)}}
  function renderApp(){
    hide('loginView');show('appView');
    $('operatorName').textContent=state.context?.operator?.name||state.context?.operator?.login||'Operador';
    $('moduleVersion').textContent=`v${state.context?.moduleVersion||'0.6.3'}`;
    renderPendingShifts(state.context?.turnosPendentes||[]);
    if(state.context?.turno){
      hide('noShiftView');show('shiftView');$('shiftStartedAt').textContent=`Iniciado em ${formatDateTime(state.context.turno.inicioEm)}`;
      renderVehicleResults('');renderMovements(state.context.movimentacoes||[]);
    }else{show('noShiftView');hide('shiftView')}
  }
  function showLogin(){if(!token())stopIdleTimer();hide('appView');show('loginView');setLoading(false);setTimeout(()=>$('login').focus(),50)}
  async function bootstrap(){setLoading(true);if(!token()){showLogin();return}try{await loadContext();setLoading(false)}catch(error){if(/^SESSION_/.test(error.code||error.message||'')){clearSession();showLogin()}else if((error.code||error.message||'')==='PASSWORD_CHANGE_REQUIRED'){showLogin();alertBox('Primeiro acesso: entre com a senha temporária para definir uma nova senha neste módulo.','warning','loginAlert')}else{setLoading(false);showLogin();alertBox(error.message||'Não foi possível carregar o Controle da Guarda.','danger','loginAlert')}}}
  async function handleLogin(event){event.preventDefault();if(state.loginBusy)return;clearAlert('loginAlert');state.loginBusy=true;$('loginButton').disabled=true;$('loginButton').querySelector('.button-label').classList.add('d-none');$('loginButton').querySelector('.button-loading').classList.remove('d-none');try{const result=await ApiService.publicPost('adminLogin',{login:$('login').value,password:$('password').value});if(!result.success)throw new Error(result.message||'Usuário ou senha inválidos.');saveLogin(result);if(result.user?.mustChangePassword){state.pendingPassword=true;show('passwordOverlay');$('currentPassword').value=$('password').value;setLoading(false);return}await loadContext()}catch(error){alertBox(error.message||'Não foi possível entrar.','danger','loginAlert');$('password').value=''}finally{state.loginBusy=false;$('loginButton').disabled=false;$('loginButton').querySelector('.button-label').classList.remove('d-none');$('loginButton').querySelector('.button-loading').classList.add('d-none');setLoading(false)}}
  async function startShift(){clearAlert();const btn=$('startShiftButton');btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Iniciando...';try{const data=await ApiService.post('guardaIniciarTurno',{});state.context.turno=data.turno;state.context.turnosPendentes=data.turnosPendentes||state.context.turnosPendentes||[];state.context.movimentacoes=Array.isArray(data.movimentacoes)?data.movimentacoes:[];renderApp();if(!state.context.movimentacoes.length)setTimeout(()=>refreshMovements(false),250)}catch(error){alertBox(error.message||'Não foi possível iniciar o turno.')}finally{btn.disabled=false;btn.textContent='Iniciar turno'}}

  async function startNewShift(){
    if(!state.context?.turno)return startShift();
    const ok=window.confirm('O turno atual ficará como PENDENTE DE ENCERRAMENTO e um novo turno será iniciado. Deseja continuar?');if(!ok)return;
    const btn=$('newShiftButton');btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Iniciando...';clearAlert();
    try{const data=await ApiService.post('guardaIniciarNovoTurno',{});state.context.turno=data.turno;state.context.turnosPendentes=data.turnosPendentes||[];state.context.movimentacoes=Array.isArray(data.movimentacoes)?data.movimentacoes:[];state.selectedVehicle=null;state.selectedMilitary=null;renderApp();if(!state.context.movimentacoes.length)setTimeout(()=>refreshMovements(false),250);alertBox('Novo turno iniciado. O turno anterior ficou pendente de encerramento.','warning')}catch(error){alertBox(error.message||'Não foi possível iniciar um novo turno.')}finally{btn.disabled=false;btn.innerHTML='<i class="bi bi-plus-circle me-1"></i>Novo turno'}
  }

  function renderPendingShifts(list){
    list=Array.isArray(list)?list:[];if(!list.length){hide('pendingShiftsSection');return}show('pendingShiftsSection');$('pendingShiftsCount').textContent=String(list.length);
    $('pendingShiftsList').innerHTML=list.map(t=>{const r=t.resumo||{};return `<div class="pending-shift-item"><div class="pending-shift-main"><strong>Turno iniciado em ${escapeHtml(formatDateTime(t.inicioEm))}</strong><span>${escapeHtml(r.movimentacoes||0)} movimentações • ${escapeHtml(r.devolvidas||0)} devolvidas • ${escapeHtml(r.emUso||0)} ainda em uso</span><small>O turno anterior permanece preservado e pode ser encerrado por substituto.</small></div><button class="btn btn-sm btn-outline-warning" type="button" data-pending-close="${escapeHtml(t.id)}">Encerrar pendente</button></div>`}).join('');
    document.querySelectorAll('[data-pending-close]').forEach(b=>b.addEventListener('click',()=>openCloseShift(b.dataset.pendingClose,true)));
  }

  function movementLabel(status){return ({AGUARDANDO_CONFIRMACAO_RETIRADA:'Aguardando retirada',EM_USO:'Em uso',AGUARDANDO_CONFIRMACAO_DEVOLUCAO:'Aguardando devolução',ENCERRADA:'Devolvida'})[status]||status||'—'}
  function movementClass(status){return ({AGUARDANDO_CONFIRMACAO_RETIRADA:'warning',EM_USO:'use',AGUARDANDO_CONFIRMACAO_DEVOLUCAO:'warning',ENCERRADA:'done'})[status]||''}
  function renderMovements(list){
    list=Array.isArray(list)?list:[];
    const emUso=list.filter(m=>m.status==='EM_USO'||m.status==='AGUARDANDO_CONFIRMACAO_DEVOLUCAO').length;
    const devolvidas=list.filter(m=>m.status==='ENCERRADA').length;
    $('movementsSummary').innerHTML=`<span><strong>${list.length}</strong> movimentações</span><span><strong>${emUso}</strong> em uso</span><span><strong>${devolvidas}</strong> devolvidas</span>`;
    if(!list.length){$('movementsList').innerHTML='<div class="text-secondary small py-2">Nenhuma movimentação registrada neste turno.</div>';return}
    $('movementsList').innerHTML=list.map(m=>{
      const canReturn=m.status==='EM_USO'||m.status==='AGUARDANDO_CONFIRMACAO_DEVOLUCAO';
      const button=canReturn?`<button class="btn btn-sm ${m.status==='EM_USO'?'btn-primary':'btn-outline-primary'}" type="button" data-return-id="${escapeHtml(m.id)}"><i class="bi bi-qr-code me-1"></i>${m.status==='EM_USO'?'Iniciar devolução':'Gerar novo QR'}</button>`:'';
      const km=m.status==='ENCERRADA'?`KM ${escapeHtml(m.kmRetirada||'—')} → ${escapeHtml(m.kmDevolucao||'—')} • ${escapeHtml(m.kmPercorrido||'0')} km`:m.kmRetirada?`KM inicial ${escapeHtml(m.kmRetirada)}`:'Retirada ainda não confirmada';
      const originNote=m.retiradaEmTurnoAnterior?'<small class="movement-origin-note"><i class="bi bi-arrow-left-right"></i> Retirada em turno anterior</small>':'';return `<div class="movement-item"><div class="movement-main"><div class="movement-top"><strong>VTR ${escapeHtml(m.vtrPrefixo||'')}</strong><span class="movement-badge ${movementClass(m.status)}">${escapeHtml(movementLabel(m.status))}</span></div><span>${escapeHtml([m.militarPostoGraduacao,m.militarNomeGuerra].filter(Boolean).join(' '))}</span><small>${escapeHtml(km)}</small>${originNote}</div>${button}</div>`;
    }).join('');
    document.querySelectorAll('[data-return-id]').forEach(btn=>btn.addEventListener('click',()=>startReturn(btn.dataset.returnId,btn)));
  }
  async function refreshMovements(showBusy=false){
    const btn=$('refreshMovementsButton');if(showBusy&&btn){btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm"></span>'}
    try{const data=await ApiService.post('guardaListarMovimentacoes',{});state.context.movimentacoes=data.movimentacoes||[];renderMovements(state.context.movimentacoes)}catch(error){if(showBusy)alertBox(error.message||'Não foi possível atualizar as movimentações.')}finally{if(showBusy&&btn){btn.disabled=false;btn.innerHTML='<i class="bi bi-arrow-clockwise"></i>'}}
  }

  function renderVehicleResults(q){const norm=String(q||'').trim().toLocaleLowerCase('pt-BR');const items=state.vehicles.filter(v=>!norm||[v.prefixo,v.placa,v.modelo].some(x=>String(x||'').toLocaleLowerCase('pt-BR').includes(norm))).slice(0,12);$('vehicleResults').innerHTML=items.length?items.map(v=>`<button class="result-item" type="button" data-vehicle-index="${state.vehicles.indexOf(v)}"><span><span class="result-main">${escapeHtml(v.prefixo?`VTR ${v.prefixo}`:(v.placa||'Viatura'))}</span><span class="result-sub">${escapeHtml([v.placa,v.modelo].filter(Boolean).join(' • ')||'Cadastro SIGVTR')}</span></span><i class="bi bi-chevron-right"></i></button>`).join(''):'<div class="text-secondary small py-2">Nenhuma VTR cadastrada encontrada. Use “Outros” se for uma reserva.</div>';document.querySelectorAll('[data-vehicle-index]').forEach(b=>b.addEventListener('click',()=>selectVehicle(state.vehicles[Number(b.dataset.vehicleIndex)])))}
  function selectVehicle(v){state.selectedVehicle={origem:'CADASTRADA',id:v.id,prefixo:String(v.prefixo||''),placa:String(v.placa||''),modelo:String(v.modelo||'')};renderSelectedVehicle();enableMilitary();resetMilitary()}
  function selectOtherVehicle(prefixo,placa){state.selectedVehicle={origem:'OUTROS',id:'',prefixo:String(prefixo||'').trim(),placa:String(placa||'').trim().toUpperCase(),modelo:''};renderSelectedVehicle();enableMilitary();resetMilitary()}
  function renderSelectedVehicle(){const v=state.selectedVehicle;if(!v){hide('selectedVehicle');show('vehiclePicker');return}$('selectedVehicle').innerHTML=`<div><strong>${escapeHtml(v.prefixo?`VTR ${v.prefixo}`:'VTR')}</strong><small>${escapeHtml([v.placa,v.modelo,v.origem==='OUTROS'?'Reserva / Outros':''].filter(Boolean).join(' • '))}</small></div><button id="changeVehicle" class="btn btn-sm btn-outline-primary" type="button">Alterar</button>`;show('selectedVehicle');hide('vehiclePicker');hide('otherVehicleForm');$('changeVehicle').addEventListener('click',()=>{state.selectedVehicle=null;resetMilitary();renderSelectedVehicle();$('militaryCard').classList.add('is-disabled');$('militarySearch').disabled=true;hide('reviewCard')});updateReview()}
  function enableMilitary(){$('militaryCard').classList.remove('is-disabled');$('militarySearch').disabled=false;$('militarySearch').focus()}
  function resetMilitary(){state.selectedMilitary=null;hide('selectedMilitary');show('militaryPicker');hide('militaryForm');$('militarySearch').value='';$('militaryResults').innerHTML='';hide('newMilitaryButton');hide('reviewCard')}
  async function searchMilitary(){const q=$('militarySearch').value.trim();$('militaryResults').innerHTML='';hide('newMilitaryButton');if(q.length<2)return;try{const data=await ApiService.post('guardaPesquisarMilitar',{query:q,limit:20});const list=data.militares||[];renderMilitaryResults(list);if(!list.length)show('newMilitaryButton')}catch(error){alertBox(error.message||'Falha ao pesquisar militar.')}}
  function renderMilitaryResults(list){$('militaryResults').innerHTML=list.map(m=>`<button class="result-item" type="button" data-military-id="${escapeHtml(m.id)}"><span><span class="result-main">${escapeHtml([m.postoGraduacao,m.nomeGuerra||m.nomeCompleto].filter(Boolean).join(' '))}</span><span class="result-sub">RG ${escapeHtml(m.rg||'—')} • ${escapeHtml(m.nomeCompleto||'')}</span></span><i class="bi bi-chevron-right"></i></button>`).join('');document.querySelectorAll('[data-military-id]').forEach((b,i)=>b.addEventListener('click',()=>chooseMilitary(list[i])))}
  function chooseMilitary(m){if(!m.postoGraduacao||!m.nomeGuerra){openMilitaryForm(m);return}state.selectedMilitary=m;renderSelectedMilitary();updateReview()}
  function renderSelectedMilitary(){const m=state.selectedMilitary;if(!m)return;$('selectedMilitary').innerHTML=`<div><strong>${escapeHtml([m.postoGraduacao,m.nomeGuerra].filter(Boolean).join(' '))}</strong><small>${escapeHtml(m.nomeCompleto)} • RG ${escapeHtml(m.rg)}</small></div><button id="changeMilitary" class="btn btn-sm btn-outline-primary" type="button">Alterar</button>`;show('selectedMilitary');hide('militaryPicker');hide('militaryForm');$('changeMilitary').addEventListener('click',()=>resetMilitary())}
  function openMilitaryForm(m={}){$('militaryId').value=m.id||'';$('militaryRank').value=m.postoGraduacao||'';$('militaryRg').value=m.rg||'';$('militaryName').value=m.nomeCompleto||'';$('militaryWarName').value=m.nomeGuerra||'';$('militaryCpf').value=m.cpf||'';$('militaryOpm').value=m.opm||'';hide('militaryPicker');show('militaryForm');setTimeout(()=>$(m.postoGraduacao?'militaryWarName':'militaryRank').focus(),50)}
  async function saveMilitary(event){event.preventDefault();clearAlert();const payload={id:$('militaryId').value,postoGraduacao:$('militaryRank').value,rg:$('militaryRg').value,nomeCompleto:$('militaryName').value,nomeGuerra:$('militaryWarName').value,cpf:$('militaryCpf').value,opm:$('militaryOpm').value};const btn=$('saveMilitaryButton');btn.disabled=true;try{const data=await ApiService.post('guardaSalvarMilitar',payload);state.selectedMilitary=data.militar;renderSelectedMilitary();updateReview()}catch(error){alertBox(error.message||'Não foi possível salvar o militar.')}finally{btn.disabled=false}}
  function updateReview(){if(!state.selectedVehicle||!state.selectedMilitary){hide('reviewCard');return}const v=state.selectedVehicle,m=state.selectedMilitary;$('reviewSummary').innerHTML=`<div class="review-row"><span>VTR</span><strong>${escapeHtml([v.prefixo,v.placa].filter(Boolean).join(' • '))}</strong></div><div class="review-row"><span>Militar</span><strong>${escapeHtml([m.postoGraduacao,m.nomeGuerra].filter(Boolean).join(' '))}</strong></div><div class="review-row"><span>RG</span><strong>${escapeHtml(m.rg||'')}</strong></div>`;show('reviewCard')}

  function buildConfirmUrl(rawToken){const url=new URL('./confirmar/',window.location.href);url.searchParams.set('token',rawToken);return url.toString()}
  function stopPolling(){if(state.pollTimer){clearTimeout(state.pollTimer);state.pollTimer=null}}
  function renderQr(data,operation){
    const movement=data.movimentacao;state.currentMovement=movement;state.currentOperation=operation||data.operacao||'RETIRADA';
    const isReturn=state.currentOperation==='DEVOLUCAO',confirmUrl=buildConfirmUrl(data.token);
    $('qrKicker').textContent=isReturn?'CONFIRMAÇÃO DE DEVOLUÇÃO':'CONFIRMAÇÃO DE RETIRADA';
    $('qrTitle').textContent=`VTR ${movement.vtrPrefixo||''}`;$('qrSubtitle').textContent=`${movement.militarPostoGraduacao||''} ${movement.militarNomeGuerra||''}`.trim();
    $('qrExpires').textContent=`QR válido até ${formatDateTime(data.expiraEm)}`;$('qrcode').innerHTML='';
    new QRCode($('qrcode'),{text:confirmUrl,width:260,height:260,colorDark:'#111827',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
    $('qrStatus').className='qr-status waiting';$('qrStatus').innerHTML=`<span class="spinner-border spinner-border-sm me-2"></span>Aguardando confirmação ${isReturn?'da devolução':'do condutor'}...`;
    hide('qrSuccess');show('qrWaiting');show('qrOverlay');startPolling(movement.id,state.currentOperation)
  }
  async function createWithdrawalQr(){clearAlert();const btn=$('prepareQrButton');if(btn.disabled)return;btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Gerando QR...';try{const data=await ApiService.post('guardaCriarRetirada',{viatura:state.selectedVehicle,militarId:state.selectedMilitary?.id});renderQr(data,'RETIRADA')}catch(error){alertBox(error.message||'Não foi possível gerar o QR de retirada.')}finally{btn.disabled=false;btn.innerHTML='<i class="bi bi-qr-code me-2"></i>Gerar QR de retirada'}}
  async function startReturn(movementId,btn){clearAlert();if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Gerando...'}try{const data=await ApiService.post('guardaIniciarDevolucao',{movimentacaoId:movementId});renderQr(data,'DEVOLUCAO')}catch(error){alertBox(error.message||'Não foi possível iniciar a devolução.');await refreshMovements(false)}finally{if(btn)btn.disabled=false}}
  function startPolling(movementId,operation){stopPolling();const poll=async()=>{try{const data=await ApiService.post('guardaStatusMovimentacao',{movimentacaoId:movementId},{timeout:15000,retries:0});const done=operation==='DEVOLUCAO'?data.status==='ENCERRADA':data.status==='EM_USO';if(done){showConfirmed(data,operation);return}}catch(_){}state.pollTimer=setTimeout(poll,5000)};state.pollTimer=setTimeout(poll,2500)}
  async function showConfirmed(data,operation){
    stopPolling();hide('qrWaiting');const isReturn=operation==='DEVOLUCAO';
    $('qrStatus').className='qr-status confirmed';$('qrStatus').innerHTML=`<i class="bi bi-check-circle-fill me-2"></i>${isReturn?'Devolução confirmada':'Retirada confirmada'}`;
    $('qrSuccessDetails').innerHTML=isReturn?`<strong>VTR ${escapeHtml(data.vtr?.prefixo||'')}</strong><span>KM final: ${escapeHtml(data.kmDevolucao||'')}</span><span>Percorrido: ${escapeHtml(data.kmPercorrido||'0')} km</span><span>${escapeHtml(formatDateTime(data.confirmacaoDevolucaoEm))}</span>`:`<strong>VTR ${escapeHtml(data.vtr?.prefixo||'')}</strong><span>KM registrado: ${escapeHtml(data.kmRetirada||'')}</span><span>${escapeHtml(formatDateTime(data.confirmacaoRetiradaEm))}</span>`;
    $('qrContinueButton').textContent=isReturn?'Fechar':'Registrar próxima retirada';show('qrSuccess');await refreshMovements(false)
  }
  function closeQr(){stopPolling();hide('qrOverlay');state.currentMovement=null;state.currentOperation='RETIRADA';hide('qrSuccess');show('qrWaiting');$('qrStatus').className='qr-status waiting';$('qrStatus').innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Aguardando confirmação do condutor...'}
  async function qrContinue(){if(state.currentOperation==='DEVOLUCAO'){closeQr();return}newWithdrawal();await refreshMovements(false)}
  function newWithdrawal(){closeQr();state.currentMovement=null;state.selectedVehicle=null;state.selectedMilitary=null;renderSelectedVehicle();resetMilitary();$('militaryCard').classList.add('is-disabled');$('militarySearch').disabled=true;$('vehicleSearch').value='';renderVehicleResults('');window.scrollTo({top:0,behavior:'smooth'});alertBox('Retirada confirmada. Pronto para registrar a próxima VTR.','success')}

  function clearCommanderFields(){
    $('commanderMilitaryId').value='';$('commanderSearch').value='';$('commanderSearchResults').innerHTML='';hide('commanderSearchResults');
    $('commanderRank').value='';$('commanderRg').value='';$('commanderName').value='';$('commanderWarName').value='';
  }
  function fillCommanderFields(m){
    m=m||{};$('commanderMilitaryId').value=m.id||'';$('commanderSearch').value=[m.postoGraduacao,m.nomeGuerra||m.nomeCompleto].filter(Boolean).join(' ');
    $('commanderRank').value=m.postoGraduacao||'';$('commanderRg').value=m.rg||'';$('commanderName').value=m.nomeCompleto||'';$('commanderWarName').value=m.nomeGuerra||'';
    $('commanderSearchResults').innerHTML='';hide('commanderSearchResults');
    setTimeout(()=>{if(!$('commanderRank').value)$('commanderRank').focus();else if(!$('commanderWarName').value)$('commanderWarName').focus();},30);
  }
  async function searchCommander(){
    const q=$('commanderSearch').value.trim(),box=$('commanderSearchResults');$('commanderMilitaryId').value='';
    if(q.length<2){box.innerHTML='';hide('commanderSearchResults');return}
    box.innerHTML='<div class="commander-search-status"><span class="spinner-border spinner-border-sm me-2"></span>Pesquisando...</div>';show('commanderSearchResults');
    try{
      const data=await ApiService.post('guardaPesquisarMilitar',{query:q,limit:12}),list=Array.isArray(data.militares)?data.militares:[];
      if(!list.length){box.innerHTML='<div class="commander-search-status">Nenhum militar encontrado. Você pode preencher os dados manualmente.</div>';return}
      box.innerHTML=list.map((m,i)=>`<button class="commander-result" type="button" data-commander-index="${i}"><strong>${escapeHtml([m.postoGraduacao,m.nomeGuerra||m.nomeCompleto].filter(Boolean).join(' '))}</strong><span>${escapeHtml([m.rg?`RG ${m.rg}`:'',m.nomeCompleto].filter(Boolean).join(' • '))}</span></button>`).join('');
      box._items=list;document.querySelectorAll('[data-commander-index]').forEach(b=>b.addEventListener('click',()=>fillCommanderFields(box._items[Number(b.dataset.commanderIndex)])));
    }catch(error){box.innerHTML=`<div class="commander-search-status text-danger">${escapeHtml(error.message||'Não foi possível pesquisar.')}</div>`}
  }
  async function openCloseShift(turnoId='',substitute=false){
    clearAlert();clearAlert('closeShiftAlert');clearCommanderFields();state.closeMode=substitute?'SUBSTITUTO':'NORMAL';state.closeTurnId=turnoId||'';
    $('closeShiftTitle').textContent=substitute?'Encerrar turno pendente':'Fechar turno da Guarda';
    $('closeShiftContext').textContent=substitute?'Este encerramento será registrado como realizado por outro militar. Informe o motivo.':'Confirme os dados do Comandante da Guarda deste serviço.';
    if(substitute){show('substituteReasonGroup');$('substituteReason').required=true;$('confirmCloseShiftButton').textContent='Confirmar e encerrar turno pendente'}else{hide('substituteReasonGroup');$('substituteReason').required=false;$('substituteReason').value='';$('confirmCloseShiftButton').textContent='Confirmar dados e fechar turno'}
    show('closeShiftOverlay');hide('closeShiftSuccess');show('closeShiftLoading');hide('closeShiftContent');const btn=substitute?null:$('closeShiftButton');if(btn)btn.disabled=true;
    try{const data=await ApiService.post('guardaPreviaFechamento',substitute?{turnoId:turnoId}:{}),r=data.resumo||{};
      $('closeShiftSummary').innerHTML=`<div class="close-summary-row"><span>Movimentações</span><strong>${escapeHtml(r.movimentacoes||0)}</strong></div><div class="close-summary-row"><span>Devolvidas</span><strong>${escapeHtml(r.devolvidas||0)}</strong></div><div class="close-summary-row"><span>Ainda em uso</span><strong>${escapeHtml(r.emUso||0)}</strong></div><div class="close-summary-row"><span>Aguardando confirmação</span><strong>${escapeHtml(r.aguardandoConfirmacao||0)}</strong></div>${r.devolucoesTurnoAnterior?`<div class="close-summary-row"><span>Devoluções de turno anterior</span><strong>${escapeHtml(r.devolucoesTurnoAnterior)}</strong></div>`:''}`;
      hide('closeShiftLoading');show('closeShiftContent');setTimeout(()=>$('commanderSearch').focus(),50)
    }catch(error){hide('closeShiftLoading');show('closeShiftContent');alertBox(error.message||'Não foi possível preparar o fechamento do turno.','danger','closeShiftAlert')}finally{if(btn)btn.disabled=false}
  }
  function closeCloseShift(){hide('closeShiftOverlay');hide('closeShiftSuccess');show('closeShiftContent');state.closeMode='NORMAL';state.closeTurnId='';state.lastPdf=null}
  function downloadPdf(pdf){if(!pdf?.base64)return false;try{const binary=atob(pdf.base64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);const blob=new Blob([bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=pdf.filename||'controle-da-guarda.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);return true}catch(_){return false}}
  async function handleDownloadPdf(){const btn=$('downloadShiftPdfButton');if(!state.lastPdf?.turnoId){alertBox('PDF indisponível para download.','warning');return}btn.disabled=true;const old=btn.innerHTML;btn.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Preparando PDF...';try{let pdf=state.lastPdf;if(!pdf.base64)pdf=await ApiService.post('guardaBaixarPdfTurno',{turnoId:state.lastPdf.turnoId},{timeout:30000,retries:0});state.lastPdf=pdf;if(!downloadPdf(pdf))throw new Error('Não foi possível preparar o arquivo.')}catch(error){alertBox(error.message||'PDF indisponível para download.','warning')}finally{btn.disabled=false;btn.innerHTML=old}}
  async function submitCloseShift(event){event.preventDefault();clearAlert('closeShiftAlert');const substitute=state.closeMode==='SUBSTITUTO',btn=$('confirmCloseShiftButton');btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Fechando turno...';
    const payload={turnoId:state.closeTurnId,militarId:$('commanderMilitaryId').value,postoGraduacao:$('commanderRank').value,rg:$('commanderRg').value,nomeCompleto:$('commanderName').value,nomeGuerra:$('commanderWarName').value,motivo:$('substituteReason').value.trim()};
    try{
      const data=await ApiService.post(substitute?'guardaEncerrarTurnoPendente':'guardaFecharTurno',payload,{timeout:30000,retries:0});
      const resp=data.responsavel||data.comandante||{};state.lastPdf=null;hide('closeShiftContent');show('closeShiftLoading');$('closeShiftLoading').innerHTML='<div class="spinner-border text-primary mb-3" role="status"></div><h3>Turno encerrado</h3><p>Gerando PDF do serviço...</p>';
      try{
        const pdf=await ApiService.post('guardaRegenerarPdfTurno',{turnoId:data.turno?.id||state.closeTurnId,returnBase64:false},{timeout:45000,retries:0});state.lastPdf=pdf;
        hide('closeShiftLoading');show('closeShiftSuccess');$('closeShiftSuccessText').textContent=`${substitute?'Turno pendente':'Turno'} encerrado por ${[resp.postoGraduacao,resp.nomeGuerra].filter(Boolean).join(' ')}. O PDF está pronto.`;$('downloadShiftPdfButton').disabled=false;setTimeout(()=>loadContext().catch(()=>{}),250);
      }catch(pdfError){
        hide('closeShiftLoading');show('closeShiftSuccess');$('closeShiftSuccessText').textContent=`Turno encerrado com sucesso. ${pdfError.message||'O PDF não pôde ser gerado agora.'}`;$('downloadShiftPdfButton').disabled=true;
      }
    }catch(error){hide('closeShiftLoading');show('closeShiftContent');alertBox(error.message||'Não foi possível encerrar o turno.','danger','closeShiftAlert')}finally{btn.disabled=false;btn.textContent=substitute?'Confirmar e encerrar turno pendente':'Confirmar dados e fechar turno'}
  }
  async function changeGuardPassword(event){event.preventDefault();clearAlert('passwordAlert');const current=$('currentPassword').value,next=$('newPassword').value,confirm=$('confirmPassword').value;if(next!==confirm){alertBox('A confirmação da nova senha não confere.','danger','passwordAlert');return}const btn=$('passwordSaveButton');btn.disabled=true;btn.textContent='Alterando...';try{const data=await ApiService.post('adminAlterarMinhaSenha',{senhaAtual:current,novaSenha:next});if(data.token){saveLogin(data)}hide('passwordOverlay');state.pendingPassword=false;await loadContext()}catch(error){alertBox(error.message||'Não foi possível alterar a senha.','danger','passwordAlert')}finally{btn.disabled=false;btn.textContent='Alterar senha'}}
  async function logout(){stopPolling();stopIdleTimer();show('logoutOverlay');$('logoutButton').disabled=true;try{await ApiService.post('adminLogout',{})}catch(_){}clearSession();location.reload()}
  function bind(){
    $('loginForm').addEventListener('submit',handleLogin);$('startShiftButton').addEventListener('click',startShift);$('newShiftButton').addEventListener('click',startNewShift);$('refreshMovementsButton').addEventListener('click',()=>refreshMovements(true));
    $('vehicleSearch').addEventListener('input',e=>renderVehicleResults(e.target.value));$('otherVehicleButton').addEventListener('click',()=>{hide('vehiclePicker');show('otherVehicleForm');$('otherPrefix').focus()});$('cancelOtherVehicle').addEventListener('click',()=>{hide('otherVehicleForm');show('vehiclePicker')});$('otherVehicleForm').addEventListener('submit',e=>{e.preventDefault();const p=$('otherPrefix').value.trim(),pl=$('otherPlate').value.trim();if(!p||!pl)return;selectOtherVehicle(p,pl)});
    $('militarySearch').addEventListener('input',()=>{clearTimeout(state.searchTimer);state.searchTimer=setTimeout(searchMilitary,280)});$('newMilitaryButton').addEventListener('click',()=>openMilitaryForm({rg:/^\d+$/.test($('militarySearch').value.trim())?$('militarySearch').value.trim():'',nomeCompleto:/\D/.test($('militarySearch').value)?$('militarySearch').value.trim():''}));$('militaryForm').addEventListener('submit',saveMilitary);$('cancelMilitaryForm').addEventListener('click',()=>{hide('militaryForm');show('militaryPicker')});
    $('prepareQrButton').addEventListener('click',createWithdrawalQr);$('qrCloseButton').addEventListener('click',closeQr);$('qrContinueButton').addEventListener('click',qrContinue);
    $('closeShiftButton').addEventListener('click',()=>openCloseShift('',false));$('closeShiftCloseButton').addEventListener('click',closeCloseShift);$('commanderSearch').addEventListener('input',()=>{clearTimeout(state.commanderSearchTimer);state.commanderSearchTimer=setTimeout(searchCommander,280)});$('closeShiftForm').addEventListener('submit',submitCloseShift);$('downloadShiftPdfButton').addEventListener('click',handleDownloadPdf);$('finishCloseShiftButton').addEventListener('click',closeCloseShift);$('passwordForm').addEventListener('submit',changeGuardPassword);$('logoutButton').addEventListener('click',logout)
  }
  function init(){bind();bindIdleActivity();bootstrap()}return{init};
})();
document.addEventListener('DOMContentLoaded',GuardPage.init);
