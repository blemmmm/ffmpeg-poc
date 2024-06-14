import { PromisedUploadRequest } from "@/requests/https";

export const useVideoChunk = () => {
  const fileToBase64 = (file: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.addEventListener("load", (e: ProgressEvent<FileReader>) => {
        const base64String =
          e.target && e.target.result && typeof e.target.result === "string"
            ? e.target.result.split(",")[1]
            : ""; // Remove the data URL prefix
        resolve(base64String);
      });
      reader.onerror = reject;
    });
  };

  // Helper function to convert a Base64 string to a Blob
  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleChunkVideo = async (file: File, urls: string[]) => {
    const parts = [];
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let currentChunk = 0;

    try {
      // const urls = await Promise.all(presigned_url);

      const chunkUploadPromises = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        chunkUploadPromises.push(
          PromisedUploadRequest(urls[i], chunk).then((etag_value) => {
            parts.push({ PartNumber: i + 1, ETag: etag_value });
            currentChunk++; // Increment counter for each successfully uploaded chunk
              //   progressElement.innerHTML = `${currentChunk} / ${totalChunks}`; // Update progress element
          }),
          // sendChunk(urls[i], chunk).then((etag_value) => {
          //   parts.push({ PartNumber: i + 1, ETag: etag_value });
          //   currentChunk++; // Increment counter for each successfully uploaded chunk
          //   //   progressElement.innerHTML = `${currentChunk} / ${totalChunks}`; // Update progress element
          // }),
        );
      }
    }catch(ex: any){
      throw new Error(ex);
    }
  };

  return {
    base64ToBlob,
    fileToBase64,
    handleChunkVideo,
  };
};
