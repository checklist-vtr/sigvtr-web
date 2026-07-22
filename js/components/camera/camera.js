/**
 * SIGVTR - camera.js
 * Estrutura inicial do componente de câmera.
 */

class Camera {

    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
    }

    async open(videoElement) {
        this.video = videoElement;

        this.stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false
        });

        this.video.srcObject = this.stream;
        await this.video.play();
    }

    async capture(canvasElement) {

        this.canvas = canvasElement;

        const ctx = this.canvas.getContext("2d");

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        ctx.drawImage(this.video,0,0);

        return this.canvas.toDataURL("image/jpeg",0.85);

    }

    close() {

        if(!this.stream) return;

        this.stream.getTracks().forEach(track=>track.stop());

        this.stream = null;

    }

}

const camera = new Camera();

export default camera;
