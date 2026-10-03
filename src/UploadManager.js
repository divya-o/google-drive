const crypto=require('crypto');;

class File{
    constructor(fileHash, totalSize,chunkSize){
        this.fileHash= fileHash; this.totalChunks=Math.ceil(totalSize/chunkSize);
        this.committedParts= new Map();
    }
    isComplete() {
        return this.committedParts.size ===this.totalChunks;
    }
}

class UploadManager{
    constructor(FileStorage){
        this.FileStorage= FileStorage;
        this.sessionDb= new Map();
        this.metadataCatalog=new Map();
    }
    async initUpload(fileHash,totalSize,chunkSize){
        if(this.metadataCatalog.has(fileHash)){
            return{
                status:"deduplicated",  resource:this.metadataCatalog.get(fileHash)
            };
        }
        const s3UploadId= await this.FileStorage.initMultiPartUpload(fileHash);
        const sessionId= crypto.randomUUID();

        this.sessionDb.set(sessionId, {s3UploadId, file: new File(fileHash,totalSize,chunkSize) });

        return {status:"initiated", sessionId};
    }

        getChunkUrl(sessionId, partNumber){
            const session= this.sessionDb.get(sessionId);
            if(!session){
                throw new Error("invalid session-id");
            }
            return this.FileStorage.getPresignedUrl(session.s3UploadId, session.file.fileHash, partNumber);
        }
        commitChunk(sessionId, partNumber, etag){
            const session= this.sessionDb.get(sessionId);
            if(!session) return ;
            if(partNumber<1 || partNumber>session.file.totalChunks ){
                throw new Error("invalid part number");
            }
            session.file.committedParts.set(partNumber, etag);
        }

        getMissingChunks(sessionId) {
            const session = this.sessionDb.get(sessionId);

            if (!session) return [];
            const missing = [],  file = session.file;
            for (let i = 1;  i<= file.totalChunks ; i++) {
                if (!file.committedParts.has(i))  missing.push(i);
            }
            return missing;
        }
        async completeUpload(sessionId) {
            const session =this.sessionDb.get(sessionId);
            if (!session || !session.file.isComplete())  throw new Error("incomplete upload- missing chunks");
            
            const entity = session.file;
            const storageResource =  await this.FileStorage.completeMultiPartUpload(session.s3UploadId, entity.fileHash);
            
            this.metadataCatalog.set(entity.fileHash, storageResource); 
            this.sessionDb.delete(sessionId);                    // clear active txn memory
            return { 
                status: "success", fileUrl: storageResource.location
            };
    }

}
module.exports= UploadManager;
