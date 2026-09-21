(()=>{
  // PWA - instalação opcional do Controle de Abastecimento
  let deferredInstallPrompt=null;
  const installBtn=document.getElementById('installBtn');
  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;if(installBtn)installBtn.hidden=false;});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;if(installBtn)installBtn.hidden=true;});
  const isIos=/iphone|ipad|ipod/i.test(navigator.userAgent);const isStandalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;if(installBtn&&isIos&&!isStandalone)installBtn.hidden=false;if(installBtn)installBtn.addEventListener('click',async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();try{await deferredInstallPrompt.userChoice;}catch(_){ }deferredInstallPrompt=null;installBtn.hidden=true;return;}if(isIos)alert('Para instalar no iPhone/iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”.');});
const API='https://script.google.com/macros/s/AKfycbzuEEeAptN9MenKWY1oynX6c3gmGY7HgVXyGiGWGaoXeNOrmNNMUBCtXnutHVxJ13rv/exec',$=id=>document.getElementById(id);let ctx={viaturas:[],militares:[]},entries=[],sid=localStorage.getItem('sigvtr_abast_session')||'',token=localStorage.getItem('sigvtr_abast_token')||'';const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();async function api(action,data={}){const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,data,token})}),j=await r.json();if(!j.success)throw new Error(j.message||'Falha na comunicação.');return j.data}function msg(t,type='info'){$('msg').className='alert alert-'+type;$('msg').textContent=t;$('msg').hidden=false;scrollTo({top:0,behavior:'smooth'});setTimeout(()=>$('msg').hidden=true,5000)}function wait(show,title,text){const m=bootstrap.Modal.getOrCreateInstance($('waitModal'));$('waitTitle').textContent=title||'Processando...';$('waitText').textContent=text||'Aguarde a confirmação do banco de dados.';show?m.show():m.hide()}function showLogin(error=''){const m=bootstrap.Modal.getOrCreateInstance($('loginModal'));$('loginError').hidden=!error;$('loginError').textContent=error;$('logoutBtn').hidden=true;m.show()}function fillTemp(prefix,m){$(prefix+'Temp').hidden=false;$(prefix+'Posto').value=m&&m.postoGraduacao||'';$(prefix+'Rg').value=m&&m.rg||'';$(prefix+'Guerra').value=m&&m.nomeGuerra||''}function setupSearch(prefix){const input=$(prefix+'Search'),hidden=$(prefix+'Id'),box=$(prefix+'Results');input.addEventListener('input',()=>{hidden.value='';$(prefix+'Temp').hidden=true;const q=norm(input.value);if(q.length<1){box.innerHTML='';return}const list=ctx.militares.filter(m=>norm([m.postoGraduacao,m.nomeGuerra,m.nomeCompleto,m.rg].join(' ')).includes(q)).slice(0,12);box.innerHTML=list.map(m=>`<button type="button" class="list-group-item list-group-item-action search-item" data-id="${m.id}"><strong>${m.postoGraduacao||''} ${m.nomeGuerra||m.nomeCompleto}</strong><br><small>RG ${m.rg||'—'} · ${m.nomeCompleto||''}</small></button>`).join('')+(q.length>=3?'<button type="button" class="list-group-item list-group-item-action text-primary" data-temp="1">Não encontrou/completar cadastro</button>':'');box.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const m=ctx.militares.find(x=>x.id===b.dataset.id);hidden.value=m.id;input.value=[m.postoGraduacao,m.nomeGuerra||m.nomeCompleto].filter(Boolean).join(' ');box.innerHTML='';if(!m.postoGraduacao||!m.rg||!m.nomeGuerra)fillTemp(prefix,m)});const temp=box.querySelector('[data-temp]');if(temp)temp.onclick=()=>{box.innerHTML='';fillTemp(prefix,null)}})}function tempData(prefix){if($(prefix+'Temp').hidden)return {};return {postoGraduacao:$(prefix+'Posto').value,rg:$(prefix+'Rg').value,nomeGuerra:$(prefix+'Guerra').value,nomeCompleto:$(prefix+'Search').value,cadastrar:$(prefix+'Cadastrar').checked}}function render(){$('count').textContent=entries.length;$('entries').innerHTML=entries.length?entries.map(e=>`<div class="entry ps-3 py-2 mb-2"><strong>${e.prefixo}</strong> · ${e.litros.toFixed(2).replace('.',',')} L · KM ${e.km}<br><small>${e.motorista} · ${e.nivelTanque} · Valor R$ ${Number(e.valorAbastecido||0).toFixed(2).replace('.',',')} · Saldo R$ ${e.saldoCartao.toFixed(2).replace('.',',')}</small></div>`).join(''):'Nenhum abastecimento registrado.';$('sessionStatus').textContent=sid?'Sessão em andamento · '+entries.length+' registro(s)':'Preparando sessão...'}function vehicleChanged(){const v=ctx.viaturas.find(x=>String(x.id)===String($('vehicle').value)),km=v&&v.ultimoKm!==null&&v.ultimoKm!==''?Number(v.ultimoKm):null;$('lastKm').textContent='Último KM registrado: '+(km===null||!Number.isFinite(km)?'—':km.toLocaleString('pt-BR'));if(km!==null&&Number.isFinite(km))$('km').min=km}async function loadApp(){ctx=await api('abastecimentoContexto');ctx.viaturas=(ctx.viaturas||[]).slice().sort((a,b)=>String(a.prefixo||'').localeCompare(String(b.prefixo||''),'pt-BR',{numeric:true}));if(!ctx.viaturas.length)throw new Error('Nenhuma viatura foi encontrada.');$('vehicle').innerHTML='<option value="">Selecione a viatura</option>'+ctx.viaturas.map(v=>`<option value="${v.id}">${v.prefixo}${v.placa?' · '+v.placa:''}</option>`).join('');const s=await api('abastecimentoAbrirSessao',{sessionId:sid});sid=s.sessionId;localStorage.setItem('sigvtr_abast_session',sid);$('logoutBtn').hidden=false;render()}async function init(){setupSearch('driver');setupSearch('closer');$('vehicle').addEventListener('change',vehicleChanged);if(!token)return showLogin();try{await loadApp()}catch(e){if(/autentic|sessão expirou|login/i.test(e.message)){token='';localStorage.removeItem('sigvtr_abast_token');showLogin(e.message)}else msg(e.message,'danger')}}$('loginForm').onsubmit=async ev=>{ev.preventDefault();$('loginBtn').disabled=true;$('loginError').hidden=true;try{const r=await api('abastecimentoLogin',{login:$('loginUser').value,password:$('loginPassword').value});token=r.token;localStorage.setItem('sigvtr_abast_token',token);bootstrap.Modal.getInstance($('loginModal')).hide();$('loginForm').reset();await loadApp()}catch(e){showLogin(e.message)}finally{$('loginBtn').disabled=false}};$('logoutBtn').onclick=async()=>{try{await api('abastecimentoLogout')}catch(_){}token='';localStorage.removeItem('sigvtr_abast_token');$('logoutBtn').hidden=true;showLogin()};$('fuelForm').onsubmit=async ev=>{ev.preventDefault();if(!$('driverId').value&&$('driverTemp').hidden)return msg('Selecione o motorista ou preencha os dados temporários.','warning');$('saveBtn').disabled=true;wait(true,'Registrando abastecimento','Enviando os dados e aguardando a confirmação. Não clique novamente.');try{const e=await api('abastecimentoRegistrar',{sessionId:sid,idVtr:$('vehicle').value,km:$('km').value,litros:$('litros').value,nivelTanque:$('tanque').value,militarId:$('driverId').value,saldoCartao:$('saldo').value,valorAbastecido:$('valorAbastecido').value,militarTemporario:tempData('driver')});entries.push(e);render();$('fuelForm').reset();$('driverId').value='';$('driverTemp').hidden=true;$('lastKm').textContent='Último KM registrado: —';msg('Abastecimento registrado.','success')}catch(e){msg(e.message,'danger')}finally{wait(false);$('saveBtn').disabled=false}};$('closeForm').onsubmit=async ev=>{ev.preventDefault();if(!$('closerId').value&&$('closerTemp').hidden)return msg('Selecione o abastecedor ou preencha os dados temporários.','warning');$('closeBtn').disabled=true;wait(true,'Encerrando abastecimento','Consolidando os registros e gerando o PDF. Aguarde sem fechar a página.');try{const r=await api('abastecimentoEncerrar',{sessionId:sid,abastecedorId:$('closerId').value,abastecedorTemporario:tempData('closer'),observacao:$('obs').value});const bytes=Uint8Array.from(atob(r.pdfBase64),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download=r.pdfNome||'controle-abastecimento.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);localStorage.removeItem('sigvtr_abast_session');sid='';entries=[];bootstrap.Modal.getInstance($('closeModal')).hide();msg('Abastecimento encerrado. PDF gerado com sucesso.','success');const s=await api('abastecimentoAbrirSessao',{});sid=s.sessionId;localStorage.setItem('sigvtr_abast_session',sid);$('closeForm').reset();$('closerId').value='';$('closerTemp').hidden=true;render()}catch(e){msg(e.message,'danger')}finally{wait(false);$('closeBtn').disabled=false}};init()})();

/* PWA_OPTIONAL_INSTALL_START */
(() => {
  const wrap = document.getElementById('pwaInstallWrap');
  const btn = document.getElementById('pwaInstallBtn');
  const dismiss = document.getElementById('pwaInstallDismiss');
  const iosHelp = document.getElementById('pwaIosHelp');
  const iosClose = document.getElementById('pwaIosClose');
  const text = document.getElementById('pwaInstallText');
  if (!wrap || !btn) return;

  let deferredPrompt = null;
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const dismissed = () => {
    try { return sessionStorage.getItem('sigvtr_pwa_install_dismissed') === '1'; }
    catch (_) { return false; }
  };
  const hide = () => { wrap.hidden = true; };
  const show = () => {
    if (!isStandalone() && !dismissed()) wrap.hidden = false;
  };

  // PWA já instalado/aberto em modo standalone: nunca exibe convite.
  if (isStandalone()) {
    hide();
    return;
  }

  // Android/Chromium: só mostra quando o navegador confirma que a instalação é possível.
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (text) text.textContent = 'Instalar aplicativo';
    show();
  });

  btn.addEventListener('click', async () => {
    if (deferredPrompt) {
      btn.disabled = true;
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') hide();
      } finally {
        deferredPrompt = null;
        btn.disabled = false;
      }
      return;
    }
    // iOS não fornece beforeinstallprompt; mostra somente a orientação opcional.
    if (isIOS && iosHelp) iosHelp.hidden = false;
  });

  if (dismiss) dismiss.addEventListener('click', () => {
    try { sessionStorage.setItem('sigvtr_pwa_install_dismissed', '1'); } catch (_) {}
    hide();
  });
  if (iosClose) iosClose.addEventListener('click', () => { iosHelp.hidden = true; });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hide();
    if (iosHelp) iosHelp.hidden = true;
    try { sessionStorage.removeItem('sigvtr_pwa_install_dismissed'); } catch (_) {}
  });

  // iOS: convite discreto e temporário apenas quando ainda não está instalado.
  if (isIOS && !isStandalone() && !dismissed()) {
    if (text) text.textContent = 'Adicionar à Tela de Início';
    show();
  }
})();
/* PWA_OPTIONAL_INSTALL_END */



/* ABAST_INACTIVITY_TIMEOUT_START */
(() => {
  // Segurança local: encerra a tela após 15 minutos sem interação.
  // A sessão do servidor continua sujeita à validade definida no Apps Script.
  const IDLE_LIMIT_MS = 15 * 60 * 1000;
  const WARNING_BEFORE_MS = 60 * 1000;
  const STORAGE_KEY = 'sigvtr_abast_last_activity';
  let warningTimer = null;
  let logoutTimer = null;
  let warningEl = null;

  const now = () => Date.now();
  const setLastActivity = () => {
    try { localStorage.setItem(STORAGE_KEY, String(now())); } catch (_) {}
  };
  const getLastActivity = () => {
    try { return Number(localStorage.getItem(STORAGE_KEY) || now()); } catch (_) { return now(); }
  };

  function removeWarning() {
    if (warningEl) warningEl.remove();
    warningEl = null;
  }

  function showWarning() {
    if (warningEl || document.hidden) return;
    warningEl = document.createElement('div');
    warningEl.setAttribute('role','alertdialog');
    warningEl.setAttribute('aria-modal','true');
    warningEl.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:1200;display:flex;align-items:center;justify-content:center;padding:18px">
        <div style="background:#fff;border-radius:14px;max-width:430px;width:100%;padding:22px;box-shadow:0 16px 40px rgba(0,0,0,.25);color:#172033">
          <h3 style="margin:0 0 8px">Sessão prestes a expirar</h3>
          <p style="margin:0 0 16px;line-height:1.45">Por segurança, o Controle de Abastecimento será bloqueado após 15 minutos sem atividade.</p>
          <button type="button" id="abastContinueSession" style="width:100%;min-height:44px;border:0;border-radius:9px;background:#0d6efd;color:#fff;font-weight:600">Continuar sessão</button>
        </div>
      </div>`;
    document.body.appendChild(warningEl);
    warningEl.querySelector('#abastContinueSession')?.addEventListener('click', () => {
      touch();
    });
  }

  async function expireSession() {
    clearTimeout(warningTimer);
    clearTimeout(logoutTimer);
    removeWarning();
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}

    // Usa a rotina de logout já existente quando disponível.
    try {
      if (typeof window.abastecLogout === 'function') {
        await window.abastecLogout();
      } else if (typeof window.logoutAbastecimento === 'function') {
        await window.logoutAbastecimento();
      }
    } catch (_) {}

    // Remove tokens locais conhecidos sem depender de um nome único.
    try {
      Object.keys(localStorage).forEach(k => {
        if (/abast.*(token|session)|sigvtr.*abast.*(token|session)/i.test(k)) localStorage.removeItem(k);
      });
      Object.keys(sessionStorage).forEach(k => {
        if (/abast.*(token|session)|sigvtr.*abast.*(token|session)/i.test(k)) sessionStorage.removeItem(k);
      });
    } catch (_) {}

    alert('Sessão encerrada por inatividade. Faça login novamente para continuar.');
    location.reload();
  }

  function schedule() {
    clearTimeout(warningTimer);
    clearTimeout(logoutTimer);
    const elapsed = now() - getLastActivity();
    const remaining = Math.max(0, IDLE_LIMIT_MS - elapsed);
    if (remaining <= 0) return expireSession();
    if (remaining <= WARNING_BEFORE_MS) showWarning();
    else warningTimer = setTimeout(showWarning, remaining - WARNING_BEFORE_MS);
    logoutTimer = setTimeout(expireSession, remaining);
  }

  function touch() {
    setLastActivity();
    removeWarning();
    schedule();
  }

  // Eventos reais de uso; limitados para não reiniciar timers em excesso.
  let lastTouch = 0;
  const activity = () => {
    const t = now();
    if (t - lastTouch < 1000) return;
    lastTouch = t;
    touch();
  };
  ['click','keydown','touchstart','pointerdown'].forEach(evt =>
    document.addEventListener(evt, activity, {passive:true})
  );
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) schedule();
  });

  if (!localStorage.getItem(STORAGE_KEY)) setLastActivity();
  schedule();
})();
/* ABAST_INACTIVITY_TIMEOUT_END */

