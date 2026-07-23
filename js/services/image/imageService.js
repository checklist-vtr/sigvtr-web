import imageCompression from './imageCompression.js';
import imageMetadata from './imageMetadata.js';

class ImageService{

 async process(base64,options={}){

  const compressed=await imageCompression.compress(base64,options);
  const metadata=await imageMetadata.extract(compressed);

  return{
   name:imageMetadata.buildFileName(options.prefix||'foto'),
   base64:compressed,
   metadata
  };

 }

 async createPhotoObject(base64,options={}){

  const result=await this.process(base64,options);

  return{
   nome:result.name,
   imagem:result.base64,
   mimeType:result.metadata.mimeType,
   tamanhoKB:result.metadata.sizeKB,
   largura:result.metadata.width,
   altura:result.metadata.height,
   dataHora:result.metadata.createdAt
  };

 }

}

export default new ImageService();
