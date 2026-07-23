/**
 * SIGVTR
 * cameraCapture.js
 * Captura imagens utilizando camera.js e imageService.js
 */

import camera from "./camera.js";
import imageService from "../../services/image/imageService.js";

class CameraCapture {

    async capture(videoElement, canvasElement, options = {}) {
        const base64 = await camera.capture(canvasElement);
        return await imageService.createPhotoObject(base64, options);
    }

}

export default new CameraCapture();
