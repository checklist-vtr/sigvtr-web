const AssistentePage=(()=>{
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let busy=false;

  function renderSafeAnswer(text){
    let html=esc(text||'').replace(/\r\n?/g,'\n');
    html=html.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    const lines=html.split('\n');
    let out='',inList=false;
    for(const raw of lines){
      const line=raw.trim();
      if(/^[-•]\s+/.test(line)){
        if(!inList){out+='<ul>';inList=true;}
        out+='<li>'+line.replace(/^[-•]\s+/,'')+'</li>';
        continue;
      }
      if(inList){out+='</ul>';inList=false;}
      if(!line){out+='<div class="mb-2"></div>';continue;}
      out+='<p class="mb-2">'+line+'</p>';
    }
    if(inList)out+='</ul>';
    return out;
  }

  function scrollBottom(){const box=$('aiConversation');box.scrollTop=box.scrollHeight;}

  function addUserMessage(question){
    $('aiConversation').insertAdjacentHTML('beforeend',
      `<div class="ai-message user"><div class="ai-bubble">${esc(question)}</div></div>`);
    scrollBottom();
  }

  function addLoading(){
    const id='aiLoadingMessage';
    $('aiConversation').insertAdjacentHTML('beforeend',
      `<div id="${id}" class="ai-message assistant"><div class="ai-avatar"><i class="bi bi-robot"></i></div><div class="ai-bubble"><div class="ai-loading"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Analisando dados...</span></div></div></div>`);
    scrollBottom();
    return id;
  }

  function removeLoading(){document.getElementById('aiLoadingMessage')?.remove();}

  function addAssistantMessage(data){
    const meta=[
      data.category?`Categoria: ${esc(data.category)}`:'',
      data.generatedAt?`Gerado em: ${esc(data.generatedAt)}`:'',
      data.source?esc(data.source):'',
      data.model?`Modelo: ${esc(data.model)}`:''
    ].filter(Boolean).map(x=>`<span>${x}</span>`).join('');
    $('aiConversation').insertAdjacentHTML('beforeend',
      `<div class="ai-message assistant"><div class="ai-avatar"><i class="bi bi-robot"></i></div><div class="ai-bubble"><div class="small fw-bold text-primary mb-2">Assistente SIGVTR — IA</div>${renderSafeAnswer(data.answer)}<div class="ai-meta">${meta}</div><div class="small text-secondary mt-2"><i class="bi bi-info-circle me-1"></i>Auxílio à decisão administrativa. Confira os registros do SIGVTR quando necessário.</div></div></div>`);
    scrollBottom();
  }

  function addError(message){
    $('aiConversation').insertAdjacentHTML('beforeend',
      `<div class="ai-message assistant"><div class="ai-avatar"><i class="bi bi-exclamation-triangle"></i></div><div class="ai-bubble ai-error"><strong>Assistente SIGVTR</strong><p class="mb-0 mt-1">${esc(message||'Assistente temporariamente indisponível.')}</p></div></div>`);
    scrollBottom();
  }

  function friendlyError(error){
    const code=String(error&&error.code||'');
    const msg=String(error&&error.message||'');
    if(/^SESSION_/.test(code))return 'Sua sessão expirou. Entre novamente no painel.';
    if(/limite gratuito|429|Too Many Requests/i.test(msg))return 'O Assistente SIGVTR atingiu temporariamente o limite gratuito da IA. Aguarde um momento e tente novamente.';
    if(/desabilitad/i.test(msg))return 'O Assistente SIGVTR está temporariamente desabilitado.';
    if(/permiss/i.test(msg))return 'Seu perfil não possui permissão para utilizar o Assistente SIGVTR.';
    if(/700|long|comprida|tamanho/i.test(msg))return 'A pergunta é muito longa. Resuma a solicitação e tente novamente.';
    return msg||'Assistente temporariamente indisponível.';
  }

  function setBusy(value){
    busy=value;
    $('aiSend').disabled=value;
    $('aiQuestion').disabled=value;
    document.querySelectorAll('.ai-quick').forEach(b=>b.disabled=value);
    $('aiSend').innerHTML=value?'<span class="spinner-border spinner-border-sm me-2"></span>Analisando...':'<i class="bi bi-send-fill me-2"></i>Enviar';
  }

  async function ask(question){
    question=String(question||'').trim();
    if(!question||busy)return;
    addUserMessage(question);
    setBusy(true);
    addLoading();
    try{
      const data=await ApiService.post('adminAiAsk',{question});
      removeLoading();
      addAssistantMessage(data||{});
    }catch(error){
      removeLoading();
      addError(friendlyError(error));
      if(/^SESSION_/.test(String(error&&error.code||''))){
        setTimeout(()=>{AuthService.clearSession();location.replace('login.html?return=assistente.html');},1200);
      }
    }finally{
      setBusy(false);
    }
  }

  function init(){
    const session=AdminLayout.init();
    if(!session)return;
    const q=$('aiQuestion'),counter=$('aiCounter');
    const updateCounter=()=>counter.textContent=`${q.value.length}/700`;
    q.addEventListener('input',updateCounter);
    q.addEventListener('keydown',e=>{
      if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){
        e.preventDefault();
        $('aiForm').requestSubmit();
      }
    });
    $('aiForm').addEventListener('submit',e=>{
      e.preventDefault();
      const value=q.value.trim();
      if(!value)return;
      q.value='';
      updateCounter();
      ask(value);
    });
    document.querySelectorAll('.ai-quick').forEach(btn=>btn.addEventListener('click',()=>{
      const value=btn.dataset.question||'';
      q.value=value;
      updateCounter();
      q.focus();
    }));
    updateCounter();
  }

  return{init};
})();
document.addEventListener('DOMContentLoaded',AssistentePage.init);
