const {FileStorage}= require("./FileStorage");
const UploadManager= require("./UploadManager") ;

(async () =>{
    const manager= new UploadManager(new FileStorage());
    const hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const{sessionId}= await manager.initUpload(hash, 100,25);

    manager.commitChunk(sessionId, 1 , "etag_");
    manager.commitChunk( sessionId, 4, "etag_");

    console.log( "missing chunks : ", manager.getMissingChunks(sessionId));
    manager.commitChunk(sessionId,2, "etag_");
    manager.commitChunk(sessionId , 3, "etag_");

    console.log("upload result:",  await manager.completeUpload(sessionId));
})();