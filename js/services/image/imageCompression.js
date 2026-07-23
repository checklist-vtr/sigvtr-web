/**
 * ==========================================================
 * SIGVTR
 * imageCompression.js
 * Serviço responsável pela compressão e redimensionamento
 * de imagens antes do envio ao Google Drive.
 * ==========================================================
 */

class ImageCompression {

    async compress(base64, {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.85
    } = {}) {

        return new Promise((resolve, reject) => {

            const img = new Image();

            img.onload = () => {

                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = Math.round(width * (maxHeight / height));
                    height = maxHeight;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img,0,0,width,height);

                resolve(canvas.toDataURL("image/jpeg", quality));

            };

            img.onerror = () => reject(new Error("Falha ao processar imagem."));
            img.src = base64;

        });

    }

}

export default new ImageCompression();
