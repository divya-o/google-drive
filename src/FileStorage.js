const crypto=require('crypto');

class StorageResource{
    constructor(identifier,pathLocation){
        this.id=identifier;
        this.location=pathLocation;
    }
}
class FileStorage {
    async initMultiPartUpload(fileHash) {
        return crypto.randomUUID();
    }
    getPresignedUrl(uploadId,key,partNum){
        const signature = crypto.createHash('sha256').update(`${key}${partNum}`).digest('hex');
        return `/chunks/upload?session=${uploadId} &part=${partNum} &sig=${signature.substring(0,8)}`;
    }
    async completeMultiPartUpload( uploadId, key ){
        return new StorageResource(uploadId ,`/storage/objects/${key}`);
    }
}
module.exports= {FileStorage};