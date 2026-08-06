const API_URL="https://script.google.com/macros/s/AKfycbzuEEeAptN9MenKWY1oynX6c3gmGY7HgVXyGiGWGaoXeNOrmNNMUBCtXnutHVxJ13rv/exec";
const APP_VERSION="1.19.5-RC1";
const SHIFT_LABELS={TURNO_1:"1º Turno",TURNO_2:"2º Turno",EXTRAORDINARIO:"Extraordinário",OUTROS:"Outros"};
const RANK_LABELS={SD:"SD",CB:"CB","3_SGT":"3º SGT","2_SGT":"2º SGT","1_SGT":"1º SGT",SUB_TEN:"SUB TEN","2_TEN":"2º TEN","1_TEN":"1º TEN",CAP:"CAP",MAJ:"MAJ",TEN_CEL:"TEN CEL",CEL:"CEL"};
const FIXED_PREFIX=/^50-(200[1-9]|201[0-9]|202[0-1])$/;
const EXTERNAL_PREFIX=/^\d{1,20}$/;
const NAME_PATTERN=/^[A-Za-zÀ-ÖØ-öø-ÿ ]{2,80}$/;
const DESC_PATTERN=/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;()\/-]{3,300}$/;
const STEPS=["Identificação","Parte externa","Parte interna","Mecânica","Fotos finais","Resumo e envio"];
const ITEMS={
 external:[
  {key:"lataria_geral",name:"Lataria Geral",aliases:["lataria","capo","porta","para_choque","para_lama","lateral","teto","grade"]},
  {key:"vidros_para_brisas",name:"Vidros e Para-brisas",aliases:["vidro","para_brisa","retrovisor","limpador"]},
  {key:"iluminacao_externa",name:"Iluminação Externa",note:"Faróis, lanternas e giroflex",aliases:["farol","lanterna","luz","giroflex","iluminacao"]},
  {key:"pneus_rodas",name:"Pneus e Rodas",aliases:["pneu","roda","calota","aro"]},
  {key:"outras_alteracoes_externas",name:"Outras alterações externas",note:"Use Com alteração para registrar outro ponto externo não listado acima.",aliases:["outras_alteracoes_externas","outra_alteracao_externa","externa","parte_externa"]}
 ],
 internal:[
  {key:"multimidia",name:"Multimídia",aliases:["multimidia","radio","tablet","modulo"]},
  {key:"ar_condicionado",name:"Ar-condicionado",aliases:["ar_condicionado","ventilacao"]},
  {key:"painel_instrumentos",name:"Painel de Instrumentos",aliases:["painel"]},
  {key:"freio",name:"Freio",note:"Inclui freio de estacionamento",aliases:["freio"]},
  {key:"buzina",name:"Buzina",aliases:["buzina"]},
  {key:"sirene",name:"Sirene",aliases:["sirene","alto_falante","megafone"]},
  {key:"xadrez",name:"Xadrez",aliases:["xadrez","detidos"]},
  {key:"tapete",name:"Tapete",aliases:["tapete"]},
  {key:"estepe",name:"Estepe",note:"Obrigatório",aliases:["estepe"]},
  {key:"macaco",name:"Macaco",optional:true,aliases:["macaco"]},
  {key:"triangulo",name:"Triângulo",optional:true,aliases:["triangulo"]},
  {key:"chave_roda",name:"Chave de roda",optional:true,aliases:["chave_de_roda","chave_roda"]},
  {key:"outras_alteracoes_internas",name:"Outras alterações internas",note:"Use Com alteração para registrar outro ponto interno não listado acima.",aliases:["outras_alteracoes_internas","outra_alteracao_interna","interna","parte_interna"]}
 ],
 engine:[
  {key:"nivel_oleo_motor",name:"Nível de óleo do motor",aliases:["oleo_motor","nivel_oleo_motor","motor"]},
  {key:"nivel_oleo_hidraulico",name:"Nível do óleo hidráulico",note:"Direção hidráulica",aliases:["oleo_hidraulico","direcao_hidraulica"]},
  {key:"nivel_oleo_freio",name:"Nível do óleo de freio",aliases:["oleo_freio","fluido_freio"]},
  {key:"nivel_fluido_arrefecimento",name:"Nível do fluido de arrefecimento",aliases:["arrefecimento","radiador","fluido"]},
  {key:"nivel_agua_limpador",name:"Nível da água do limpador do para-brisa",aliases:["agua_limpador","reservatorio_limpador"]},
  {key:"outras_alteracoes_mecanica",name:"Outras alterações mecânicas",note:"Use Com alteração para descrever manualmente.",aliases:["mecanica","outras_alteracoes"]}
 ]
};
const FINAL_PHOTOS=[{type:"frontal",label:"Frente"},{type:"traseira",label:"Traseira"},{type:"lado_esquerdo",label:"Lado esquerdo"},{type:"lado_direito",label:"Lado direito"}];
const state={step:1,status:{},descriptions:{},photos:{},pending:[],decisions:{},device:{},pendingPhoto:null,isSubmitting:false,sendingTimer:null,requestId:""};
const $=s=>document.querySelector(s);const $$=s=>Array.from(document.querySelectorAll(s));
window.addEventListener("DOMContentLoaded",()=>{buildPrefixes();buildStepper();renderItems();renderFinalPhotos();bind();detectDevice();registerSW();showStep(1)});
function buildPrefixes(){const select=$("#prefixoSelect");if(!select)return;if(select.options.length>2)return;let html='<option value="">Selecione</option>';for(let n=2001;n<=2021;n++)html+=`<option value="50-${n}">50-${n}</option>`;html+='<option value="OUTRO">Outros</option>';select.innerHTML=html}
function buildStepper(){$("#stepDots").innerHTML=STEPS.map((_,i)=>`<button type="button" class="step-dot" data-jump="${i+1}">${i+1}</button>`).join("")}
function renderItems(){renderGroup("externalItems",ITEMS.external);renderGroup("internalItems",ITEMS.internal);renderGroup("engineItems",ITEMS.engine)}
function renderGroup(id,items){$("#"+id).innerHTML=items.map(item=>`<article class="inspection-card" data-key="${item.key}"><h3>${escapeHtml(item.name)}</h3><p class="item-note">${escapeHtml(item.note|| (item.optional?"Opcional — use Não se aplica quando ausente de fábrica.":"Selecione a condição encontrada."))}</p><div class="known-damages"></div><div class="additional-damage-question" hidden></div><div class="status-buttons"><button type="button" class="status-choice ok" data-status="ok">SEM ALTERAÇÃO</button><button type="button" class="status-choice change" data-status="nao">COM ALTERAÇÃO</button>${item.optional?'<button type="button" class="status-choice na" data-status="na">NÃO SE APLICA</button>':''}</div><div class="change-panel" hidden><textarea maxlength="300" placeholder="Descreva a alteração encontrada"></textarea><div class="inline-photo"><button type="button" data-capture="avaria_${item.key}">INSERIR FOTO DA ALTERAÇÃO</button><input id="photo_avaria_${item.key}" type="file" accept="image/*" capture="environment" hidden><div class="photo-preview"></div></div></div></article>`).join("")}
function renderFinalPhotos(){$("#finalPhotoGrid").innerHTML=FINAL_PHOTOS.map(p=>`<div class="photo-card" data-photo-card="${p.type}"><h3>${p.label}</h3><p>Obrigatória</p><button type="button" data-capture="${p.type}">INSERIR FOTO</button><input id="photo_${p.type}" type="file" accept="image/*" capture="environment" hidden><div class="photo-preview"></div></div>`).join("")}
function bind(){
  document.addEventListener("click",e=>{
    const confirmButton=e.target.closest("#confirmPhotoQuality");
    const retakeButton=e.target.closest("#retakePhoto");
    if(confirmButton){e.preventDefault();e.stopPropagation();confirmPendingPhoto();return}
    if(retakeButton){e.preventDefault();e.stopPropagation();retakePendingPhoto();return}
    const n=e.target.closest(".next-button"),p=e.target.closest(".prev-button"),c=e.target.closest(".status-choice"),cap=e.target.closest("[data-capture]"),rm=e.target.closest(".remove-photo"),dd=e.target.closest("[data-damage-decision]");
    const jump=e.target.closest("[data-jump]");
    if(n)next(Number(n.dataset.next));
    if(p)showStep(Number(p.dataset.prev));
    if(jump)navigateToStep(Number(jump.dataset.jump));
    if(c)setStatus(c.closest(".inspection-card"),c.dataset.status);
    if(cap){const input=$("#photo_"+cap.dataset.capture);if(input)input.click()}
    if(rm){delete state.photos[rm.dataset.removePhoto];renderPhoto(rm.dataset.removePhoto)}
    if(dd){state.decisions[dd.dataset.damageId]=dd.dataset.damageDecision;renderKnownDamages()}
  });
  document.addEventListener("change",async e=>{if(e.target.id==="turno"){const other=e.target.value==="OUTROS";$("#otherOperationWrap").hidden=!other;if(!other)$("#otherOperation").value=""}if(e.target.id==="prefixoSelect"){const other=e.target.value==="OUTRO";$("#otherPrefixWrap").hidden=!other;if(!other)$("#otherPrefix").value="";await loadPending()}if(e.target.type==="file"&&e.target.id.startsWith("photo_")){const type=e.target.id.replace("photo_","");if(e.target.files[0])await loadPhoto(type,e.target.files[0]);e.target.value=""}});
  document.addEventListener("input",e=>{if(e.target.id==="condutor")e.target.value=e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g,"").replace(/\s+/g," ");if(["rg","kmInicial","otherPrefix"].includes(e.target.id))e.target.value=e.target.value.replace(/\D/g,"");if(e.target.id==="otherOperation")e.target.value=sanitizeDescription(e.target.value).slice(0,100);if(e.target.matches(".change-panel textarea")){const key=e.target.closest(".inspection-card").dataset.key;e.target.value=sanitizeDescription(e.target.value);state.descriptions[key]=e.target.value.trim()}});
  $("#checklistForm").addEventListener("submit",submit);
  $("#newChecklistButton").addEventListener("click",()=>location.reload());
  $("#closeAndRefreshButton").addEventListener("click",()=>location.reload());
  $("#photoQualityModal").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();confirmPendingPhoto()}else if(e.key==="Escape"){e.preventDefault();retakePendingPhoto()}});
}
function navigateToStep(target){
  if(!Number.isInteger(target)||target<1||target>STEPS.length||state.isSubmitting)return;
  if(target<=state.step){showStep(target);return;}
  for(let current=state.step;current<target;current++){
    if(!validateStep(current)){toast("Conclua a etapa "+current+" antes de avançar.");showStep(current);return;}
  }
  showStep(target);
}
function getPrefix(){return $("#prefixoSelect").value==="OUTRO"?$("#otherPrefix").value.trim():$("#prefixoSelect").value}
async function loadPending(){state.pending=[];state.decisions={};const prefix=getPrefix();$("#pendingSummary").hidden=true;if(!prefix||(!FIXED_PREFIX.test(prefix)&&!EXTERNAL_PREFIX.test(prefix)))return;try{const r=await fetch(`${API_URL}?action=avariasPendentes&prefixo=${encodeURIComponent(prefix)}`,{cache:"no-store"});const data=await r.json();if(!data.success)throw new Error(data.message||"Falha na consulta");state.pending=data.avarias||[];renderPendingSummary();renderKnownDamages()}catch(err){toast("Não foi possível consultar avarias: "+err.message)}}
function renderPendingSummary(){const box=$("#pendingSummary");if(!state.pending.length){box.innerHTML="<h3>Nenhuma avaria pendente</h3><p>Não há registros administrativos em aberto para esta viatura.</p>";box.hidden=false;return}box.innerHTML=`<h3>${state.pending.length} avaria(s) pendente(s)</h3>${state.pending.map(d=>`<p><strong>${escapeHtml(d.item||"Item não informado")}</strong> — ${escapeHtml(d.descricao||"")} (${escapeHtml(d.situacao||"PENDENTE")})</p>`).join("")}`;box.hidden=false}
function matchDamageToKey(d){const text=normalizeKey(`${d.item||""} ${d.posicaoLocal||""}`);for(const group of Object.values(ITEMS))for(const item of group)if(item.aliases.some(a=>text.includes(a)))return item.key;return ""}
function renderKnownDamages(){$$(".inspection-card").forEach(card=>{const host=card.querySelector(".known-damages"),question=card.querySelector(".additional-damage-question"),key=card.dataset.key,item=findItemByKey(key),damages=state.pending.filter(d=>matchDamageToKey(d)===key),okButton=card.querySelector('[data-status="ok"]'),changeButton=card.querySelector('[data-status="nao"]'),naButton=card.querySelector('[data-status="na"]');host.innerHTML=damages.map(d=>`<div class="damage-alert"><strong>AVARIA JÁ REGISTRADA</strong><div class="damage-meta">Data: ${escapeHtml(d.dataDeteccao||"não informada")} · Registrado por: ${escapeHtml(d.registradoPor||"não informado")} · Local: ${escapeHtml(d.posicaoLocal||d.item||"não informado")} · Situação: ${escapeHtml(d.situacao||"PENDENTE")}</div><p class="damage-desc">${escapeHtml(d.descricao||"Sem descrição.")}</p><div class="damage-actions"><button type="button" data-damage-id="${escapeHtml(d.idAvaria)}" data-damage-decision="continua" class="${state.decisions[d.idAvaria]==="continua"?"selected":""}">CONTINUA IGUAL</button><button type="button" data-damage-id="${escapeHtml(d.idAvaria)}" data-damage-decision="agravou" class="${state.decisions[d.idAvaria]==="agravou"?"selected":""}">AGRAVOU</button><button type="button" data-damage-id="${escapeHtml(d.idAvaria)}" data-damage-decision="solicitar_verificacao" class="${state.decisions[d.idAvaria]==="solicitar_verificacao"?"selected":""}">SOLICITAR VERIFICAÇÃO</button></div></div>`).join("");const hasKnown=damages.length>0;card.classList.toggle("has-known-damages",hasKnown);if(hasKnown){const label=additionalDamageLabel(key,item&&item.name);question.innerHTML=`<strong>${damages.length===1?"Avaria conhecida avaliada":"Avarias conhecidas avaliadas"}</strong><span>Depois de confirmar ${damages.length===1?"a situação acima":"todas as situações acima"}, informe se foi encontrada outra alteração ${escapeHtml(label.preposition)}.</span>`;question.hidden=false;okButton.textContent="NENHUMA OUTRA ALTERAÇÃO";changeButton.textContent=`SIM, OUTRA ALTERAÇÃO ${label.button}`;if(naButton)naButton.hidden=true;}else{question.hidden=true;question.innerHTML="";okButton.textContent="SEM ALTERAÇÃO";changeButton.textContent="COM ALTERAÇÃO";if(naButton)naButton.hidden=false;}})}
function findItemByKey(key){for(const group of Object.values(ITEMS)){const item=group.find(i=>i.key===key);if(item)return item}return null}
function additionalDamageLabel(key,name){const labels={lataria_geral:{preposition:"na Lataria",button:"NA LATARIA"},vidros_para_brisas:{preposition:"em Vidros e Para-brisas",button:"EM VIDROS E PARA-BRISAS"},iluminacao_externa:{preposition:"na Iluminação Externa",button:"NA ILUMINAÇÃO EXTERNA"},pneus_rodas:{preposition:"em Pneus e Rodas",button:"EM PNEUS E RODAS"}};return labels[key]||{preposition:`no item ${name||"avaliado"}`,button:`NO ITEM ${(name||"AVALIADO").toUpperCase()}`}}
function setStatus(card,status){const key=card.dataset.key;state.status[key]=status;card.classList.toggle("is-ok",status==="ok"||status==="na");card.classList.toggle("is-change",status==="nao");card.querySelectorAll(".status-choice").forEach(b=>b.classList.toggle("selected",b.dataset.status===status));card.querySelector(".change-panel").hidden=status!=="nao";if(status!=="nao"){delete state.descriptions[key];delete state.photos["avaria_"+key];const ta=card.querySelector("textarea");if(ta)ta.value="";renderPhoto("avaria_"+key)}}
async function loadPhoto(type,file){if(!file.type.startsWith("image/")){toast("Selecione uma imagem válida.");return}try{const processed=await compressImage(file);if(type==="painel_inicial"||FINAL_PHOTOS.some(p=>p.type===type)){openPhotoQuality(type,processed);return}state.photos[type]=processed;renderPhoto(type)}catch(err){toast("Falha ao processar a foto.")}}

function openPhotoQuality(type,photo){
  const isPanel=type==="painel_inicial";
  const finalPhoto=FINAL_PHOTOS.find(p=>p.type===type);
  state.pendingPhoto={type,photo};
  $("#photoQualityPreview").src=`data:${photo.mimeType};base64,${photo.data}`;
  $("#photoQualityTitle").textContent=isPanel?"O painel está legível?":`A foto de ${finalPhoto?finalPhoto.label.toLowerCase():"viatura"} está legível?`;
  $("#photoQualityText").textContent=isPanel?"Confirme se o KM e o nível de combustível aparecem nítidos, sem reflexo, corte ou imagem embaçada.":"Confirme se toda a face da viatura está enquadrada, nítida, sem corte, reflexo excessivo ou imagem embaçada.";
  $("#photoQualityChecklist").innerHTML=isPanel?"<span>✓ KM visível</span><span>✓ Combustível visível</span><span>✓ Imagem nítida</span>":"<span>✓ Viatura inteira visível</span><span>✓ Lado correto</span><span>✓ Imagem nítida</span>";
  $("#photoQualityModal").hidden=false;
  document.body.classList.add("modal-open");
  setTimeout(()=>$("#confirmPhotoQuality").focus(),0);
}
function confirmPendingPhoto(){const pending=state.pendingPhoto;if(!pending){toast("Selecione novamente a fotografia.");$("#photoQualityModal").hidden=true;return}state.photos[pending.type]=pending.photo;renderPhoto(pending.type);state.pendingPhoto=null;$("#photoQualityPreview").removeAttribute("src");$("#photoQualityModal").hidden=true;document.body.classList.remove("modal-open");toast("Foto confirmada como legível.")}
function retakePendingPhoto(){const pending=state.pendingPhoto;state.pendingPhoto=null;$("#photoQualityModal").hidden=true;$("#photoQualityPreview").removeAttribute("src");document.body.classList.remove("modal-open");if(pending){const input=$("#photo_"+pending.type);if(input)setTimeout(()=>input.click(),180)}}
function compressImage(file){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const max=1600,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);const dataUrl=canvas.toDataURL("image/jpeg",.72);resolve({tipo:"",name:(file.name||"foto.jpg").replace(/[^A-Za-z0-9._-]/g,"_"),mimeType:"image/jpeg",data:dataUrl.split(",")[1]})};img.onerror=reject;img.src=url})}
function renderPhoto(type){const input=$("#photo_"+CSS.escape(type));if(!input)return;const host=input.parentElement.querySelector(".photo-preview"),photo=state.photos[type];host.innerHTML=photo?`<img src="data:${photo.mimeType};base64,${photo.data}" alt="Prévia"><button type="button" class="remove-photo" data-remove-photo="${type}">REMOVER</button>`:""}
function next(target){if(!validateStep(state.step))return;if(target===6)renderSummary();showStep(target)}
function validateStep(step){hideErrors();if(step===1){const prefix=getPrefix(),name=$("#condutor").value.trim(),rank=$("#postoGraduacao").value,rg=$("#rg").value.trim(),km=$("#kmInicial").value.trim(),turno=$("#turno").value,otherOperation=$("#otherOperation").value.trim(),fuel=$("#combustivel").value;let msg="";if(!prefix||(!FIXED_PREFIX.test(prefix)&&!EXTERNAL_PREFIX.test(prefix)))msg="Selecione uma viatura ou informe um prefixo externo somente numérico.";else if(!NAME_PATTERN.test(name))msg="O nome do fiscal deve conter somente letras e espaços.";else if(!RANK_LABELS[rank])msg="Selecione o Posto/Graduação.";else if(!/^\d{1,20}$/.test(rg))msg="O RG deve conter somente números.";else if(!/^\d{1,9}$/.test(km))msg="O KM deve conter somente números.";else if(!turno)msg="Selecione o turno.";else if(turno==="OUTROS"&&!DESC_PATTERN.test(otherOperation))msg="Informe corretamente a operação ou o turno em Outros.";else if(!fuel)msg="Selecione o nível de combustível.";else if(!state.photos.painel_inicial)msg="Insira uma foto legível mostrando, na mesma imagem, o odômetro e o marcador de combustível.";if(msg)return error("identificationError",msg),false;return true}if(step>=2&&step<=4){const items=step===2?ITEMS.external:step===3?ITEMS.internal:ITEMS.engine;for(const item of items){const st=state.status[item.key];if(!st)return sectionError(step,`Avalie o item: ${item.name}`),false;if(st==="nao"){if(!DESC_PATTERN.test(state.descriptions[item.key]||""))return sectionError(step,`Descreva corretamente a alteração em: ${item.name}`),false;if(!state.photos["avaria_"+item.key])return sectionError(step,`Insira a foto da alteração em: ${item.name}`),false}}const related=state.pending.filter(d=>items.some(i=>i.key===matchDamageToKey(d)));for(const d of related)if(!state.decisions[d.idAvaria])return sectionError(step,"Informe a situação das avarias já registradas exibidas nesta etapa."),false;return true}if(step===5){for(const p of FINAL_PHOTOS)if(!state.photos[p.type])return error("finalPhotosError",`Insira a foto obrigatória: ${p.label}.`),false;return true}return true}
function sectionError(step,msg){const page=$(`[data-page="${step}"]`),el=page.querySelector(".section-error");el.textContent=msg;el.hidden=false;toast(msg)}
function hideErrors(){$$(".form-error").forEach(e=>e.hidden=true)}function error(id,msg){const el=$("#"+id);el.textContent=msg;el.hidden=false;toast(msg)}
function showStep(step){state.step=step;$$('.form-page').forEach(p=>p.hidden=Number(p.dataset.page)!==step);$$('.step-dot').forEach((d,i)=>{d.classList.toggle('active',i+1===step);d.classList.toggle('done',i+1<step)});$("#progressBar").style.width=((step-1)/(STEPS.length-1)*100)+"%";$("#stepLabel").textContent=`Etapa ${step} de ${STEPS.length} — ${STEPS[step-1]}`;scrollTo({top:0,behavior:"smooth"})}
function renderSummary(){
 const changed=Object.keys(state.status).filter(k=>state.status[k]==="nao");
 const rank=RANK_LABELS[$("#postoGraduacao").value]||"";
 const driver=(rank+" "+$("#condutor").value.trim()).trim();
 const newDamageHtml=changed.length?`<div class="new-damage-notice"><strong>${changed.length===1?"Nova avaria registrada":"Novas avarias registradas"}</strong><p>${changed.length===1?"Esta alteração será registrada como avaria pendente após a conclusão do envio e permanecerá aberta até a baixa realizada pela Administração.":"Estas alterações serão registradas como avarias pendentes após a conclusão do envio e permanecerão abertas até a baixa realizada pela Administração."}</p></div>`:"";
 const knownHtml=state.pending.length?state.pending.map(d=>{
   const decision=state.decisions[d.idAvaria];
   const labels={continua:"Continua igual",agravou:"Agravou",solicitar_verificacao:"Solicitar verificação"};
   return `<div class="summary-damage"><p><strong>${escapeHtml(d.item||d.posicaoLocal||"Item não informado")}</strong></p><p>${escapeHtml(d.descricao||"Sem descrição.")}</p><p><strong>Registrada em:</strong> ${escapeHtml(d.dataDeteccao||"não informada")} · <strong>Registrado por:</strong> ${escapeHtml(d.registradoPor||"não informado")} · <strong>Situação:</strong> ${escapeHtml(d.situacao||"PENDENTE")}</p><p><strong>Confirmação no checklist:</strong> ${escapeHtml(labels[decision]||"Não informada")}</p></div>`;
 }).join(""):"<p>Nenhuma avaria pendente conhecida.</p>";
 $("#summaryContent").innerHTML=`<div class="summary-block"><h3>Identificação</h3><p><strong>Viatura:</strong> ${escapeHtml(getPrefix())}</p><p><strong>Fiscal:</strong> ${escapeHtml(driver)}</p><p><strong>RG:</strong> ${escapeHtml($("#rg").value)}</p><p><strong>KM:</strong> ${escapeHtml($("#kmInicial").value)}</p><p><strong>Turno:</strong> ${escapeHtml(SHIFT_LABELS[$("#turno").value]||$("#turno").value)}${$("#turno").value==="OUTROS"?" — "+escapeHtml($("#otherOperation").value):""}</p><p><strong>Combustível:</strong> ${escapeHtml($("#combustivel").value)}</p></div><div class="summary-block"><h3>Novas alterações registradas</h3><p><strong>Itens avaliados:</strong> ${Object.keys(state.status).length}</p><p><strong>Com alteração:</strong> ${changed.length}</p>${changed.map(k=>`<p><strong>${escapeHtml(itemName(k))}:</strong> ${escapeHtml(state.descriptions[k])}</p>`).join("")||"<p>Sem novas alterações.</p>"}${newDamageHtml}</div><div class="summary-block"><h3>Avarias pendentes conhecidas</h3>${knownHtml}</div>`;
}

function createRequestId(){
 if(window.crypto&&typeof window.crypto.randomUUID==="function")return window.crypto.randomUUID();
 return `REQ-${Date.now()}-${Math.random().toString(36).slice(2,12)}`;
}
function buildSubmissionPayload(){
 const fotos=Object.keys(state.photos).map(tipo=>({...state.photos[tipo],tipo}));
 const avariasConhecidas=state.pending.map(d=>({idAvaria:d.idAvaria,item:d.item||d.posicaoLocal||"",itemKey:matchDamageToKey(d),decisao:state.decisions[d.idAvaria]||""}));
 return {action:"salvarRetiradaMobile",data:{
  tipoChecklist:"FISCAL",
  idRequisicao:state.requestId,
  prefixo:getPrefix(),
  dataCliente:new Date().toLocaleDateString("en-CA",{timeZone:"America/Belem"}),
  condutor:$("#condutor").value.trim(),
  postoGraduacao:$("#postoGraduacao").value,
  rg:$("#rg").value.trim(),
  kmInicial:$("#kmInicial").value.trim(),
  turno:$("#turno").value,
  operacaoOutro:$("#otherOperation").value.trim(),
  combustivel:$("#combustivel").value,
  itens:{...state.status},
  descricoesAlteracoes:{...state.descriptions},
  avariasConhecidas,
  fotos,
  dispositivo:{...state.device,versaoApp:APP_VERSION}
 }};
}
async function postChecklist(payload,timeoutMs=120000){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload),cache:"no-store",redirect:"follow",signal:controller.signal});
  const raw=await response.text();
  if(!response.ok)throw new Error(`Falha de comunicação com a API (HTTP ${response.status}).`);
  if(!raw.trim())throw new Error("A API não retornou confirmação do registro.");
  let result;try{result=JSON.parse(raw)}catch(_){throw new Error("A API retornou uma resposta inválida. O formulário foi preservado para nova tentativa.")}
  if(!result||result.success!==true)throw new Error(result&&result.message?result.message:"O backend não confirmou o registro do checklist.");
  if(!result.protocolo||!result.id)throw new Error("A resposta da API não contém protocolo válido. Confirme o registro antes de tentar novamente.");
  return result;
 }catch(err){
  if(err&&err.name==="AbortError")throw new Error("O envio excedeu o tempo de confirmação. Os dados permanecem na tela. Verifique a conexão antes de tentar novamente.");
  throw err;
 }finally{clearTimeout(timeout)}
}
async function confirmSavedChecklist(idRequisicao,attempts=4){
 for(let attempt=0;attempt<attempts;attempt++){
  if(attempt>0)await new Promise(resolve=>setTimeout(resolve,1200*attempt));
  try{
   const url=new URL(API_URL);url.searchParams.set("action","confirmarRetiradaMobile");url.searchParams.set("idRequisicao",idRequisicao);url.searchParams.set("_ts",Date.now());
   const response=await fetch(url.toString(),{method:"GET",cache:"no-store",redirect:"follow"});
   if(!response.ok)continue;
   const raw=await response.text();if(!raw.trim())continue;
   const json=JSON.parse(raw),result=json.data||json;
   if(json.success===true&&result&&result.found===true&&result.id&&result.protocolo)return result;
  }catch(_){}
 }
 return null;
}
async function submit(event){
 event.preventDefault();
 event.stopPropagation();
 if(state.isSubmitting)return;
 hideErrors();
 if(!validateStep(1)||!validateStep(2)||!validateStep(3)||!validateStep(4)||!validateStep(5)){toast("Revise as etapas indicadas antes de enviar.");return}
 if(!$("#finalConfirmation").checked){error("submitError","Confirme que realizou a inspeção e que as informações são verdadeiras.");return}
 state.isSubmitting=true;
 if(!state.requestId)state.requestId=createRequestId();
 const button=$("#submitButton"),form=$("#checklistForm");
 button.disabled=true;button.textContent="ENVIANDO...";form.classList.add("loading");
 $("#sendingModal").hidden=false;document.body.classList.add("modal-open");startSendingMessages();
 try{
  const result=await postChecklist(buildSubmissionPayload());
  stopSendingMessages();$("#sendingModal").hidden=true;
  const novas=Number(result.novasAvarias||0);
  const detail=novas?` ${novas===1?"Uma nova avaria foi registrada e permanecerá pendente até a baixa administrativa.":`${novas} novas avarias foram registradas e permanecerão pendentes até a baixa administrativa.`}`:"";
  $("#successMessage").textContent=`Protocolo ${result.protocolo}. Registro concluído com sucesso.${detail}`;
  $("#successModal").hidden=false;
  toast("Checklist registrado com sucesso.");
 }catch(err){
  // A API pode concluir a gravação e a confirmação HTTP se perder durante o
  // retorno. Antes de permitir novo envio, confirmamos pelo idRequisicao.
  const recovered=await confirmSavedChecklist(state.requestId);
  if(recovered){
   stopSendingMessages();$("#sendingModal").hidden=true;
   const novas=Number(recovered.novasAvarias||0);
   const detail=novas?` ${novas===1?"Uma nova avaria foi registrada e permanecerá pendente até a baixa administrativa.":`${novas} novas avarias foram registradas e permanecerão pendentes até a baixa administrativa.`}`:"";
   $("#successMessage").textContent=`Protocolo ${recovered.protocolo}. O registro foi localizado e confirmado com sucesso após uma oscilação na comunicação.${detail}`;
   $("#successModal").hidden=false;
   toast("Checklist confirmado no banco de dados.");
   return;
  }
  stopSendingMessages();$("#sendingModal").hidden=true;document.body.classList.remove("modal-open");
  error("submitError",(err&&err.message?err.message:"Não foi possível concluir o envio.")+" O registro não foi localizado pelo identificador da requisição; os dados foram preservados.");
  button.disabled=false;button.textContent="TENTAR ENVIAR NOVAMENTE";form.classList.remove("loading");
  state.isSubmitting=false;
 }
}
function startSendingMessages(){const messages=["Preparando fotos e informações. Não feche esta página e não toque novamente em enviar.","Enviando as fotografias com segurança. Este processo pode levar alguns instantes.","Registrando avarias e histórico da viatura. Aguarde a confirmação final.","Finalizando o protocolo. Mantenha esta página aberta."];let index=0;$("#sendingMessage").textContent=messages[index];clearInterval(state.sendingTimer);state.sendingTimer=setInterval(()=>{$("#sendingMessage").textContent=messages[Math.min(++index,messages.length-1)]},4500)}
function stopSendingMessages(){clearInterval(state.sendingTimer);state.sendingTimer=null}
function itemName(key){for(const g of Object.values(ITEMS)){const i=g.find(x=>x.key===key);if(i)return i.name}return key.replace(/_/g," ")}
function sanitizeDescription(v){return v.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;()\/-]/g,"").replace(/\s+/g," ").slice(0,300)}
function normalizeKey(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")}
function escapeHtml(v){return String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(t._id);t._id=setTimeout(()=>t.classList.remove("show"),3200)}
function detectDevice(){state.device={tipo:/Mobi|Android/i.test(navigator.userAgent)?"MOBILE":"DESKTOP",navegador:navigator.userAgent.slice(0,100),idioma:navigator.language,resolucao:`${screen.width}x${screen.height}`}}
function registerSW(){if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js?v=1.19.0-rc1").catch(()=>{})}
