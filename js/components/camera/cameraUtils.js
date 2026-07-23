/**
 * SIGVTR
 * cameraUtils.js
 * Funções auxiliares do módulo de câmera.
 */

class CameraUtils {

    isSupported() {
        return !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia
        );
    }

    dataURLToBlob(dataURL) {

        const parts = dataURL.split(",");
        const mime = parts[0].match(/:(.*?);/)[1];

        const binary = atob(parts[1]);
        const len = binary.length;

        const bytes = new Uint8Array(len);

        for(let i=0;i<len;i++){
            bytes[i]=binary.charCodeAt(i);
        }

        return new Blob([bytes], { type: mime });

    }

    blobToFile(blob,fileName){

        return new File(
            [blob],
            fileName,
            {
                type: blob.type,
                lastModified: Date.now()
            }
        );

    }

    download(dataURL,fileName="imagem.jpg"){

        const a=document.createElement("a");
        a.href=dataURL;
        a.download=fileName;
        a.click();

    }

}

export default new CameraUtils();
