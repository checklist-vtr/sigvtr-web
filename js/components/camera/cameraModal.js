import camera from './camera.js';

class CameraModal{
 constructor(){this.modal=null;}
 open(el){this.modal=el;this.modal.classList.add('open');}
 async start(video){await camera.open(video);}
 async capture(video,canvas){return await camera.capture(canvas);}
 close(){camera.close();if(this.modal)this.modal.classList.remove('open');}
}
export default new CameraModal();
