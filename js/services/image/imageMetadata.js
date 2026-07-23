/**
 * ==========================================================
 * SIGVTR
 * imageMetadata.js
 * Extrai metadados básicos de imagens Base64.
 * ==========================================================
 */

class ImageMetadata {

    async extract(base64){

        return new Promise((resolve,reject)=>{

            const img=new Image();

            img.onload=()=>{

                const size=Math.round((base64.length*3/4)/1024);

                resolve({
                    mimeType:(base64.match(/^data:(.*?);/)||[])[1]||"",
                    width:img.width,
                    height:img.height,
                    sizeKB:size,
                    createdAt:new Date().toISOString()
                });

            };

            img.onerror=()=>reject(new Error("Não foi possível ler a imagem."));

            img.src=base64;

        });

    }

    buildFileName(prefixo="foto"){

        const d=new Date();

        const stamp=d.getFullYear().toString()+
            String(d.getMonth()+1).padStart(2,"0")+
            String(d.getDate()).padStart(2,"0")+"_"+
            String(d.getHours()).padStart(2,"0")+
            String(d.getMinutes()).padStart(2,"0")+
            String(d.getSeconds()).padStart(2,"0");

        return `${prefixo}_${stamp}.jpg`;
    }

}

export default new ImageMetadata();
