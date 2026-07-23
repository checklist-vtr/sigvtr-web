class CameraPreview{
 render(id,titulo,imagem=''){
  const has=imagem!=='';
  return `<div class="camera-preview" id="${id}">
<h4>${titulo}</h4>
${has?`<img src="${imagem}" alt="${titulo}">`:`<div class="camera-empty">Nenhuma foto</div>`}
<button class="btn btn-secondary" data-camera="${id}">${has?'Refazer':'Capturar'}</button>
</div>`;
 }
}
export default new CameraPreview();
