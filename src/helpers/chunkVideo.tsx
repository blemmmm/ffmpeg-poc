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

  const handleChunkVideo = async (file: File) => {
    if (!file) return;

    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const base64Chunks = [];

    // Slice and convert each chunk to Base64
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const base64Chunk = await fileToBase64(chunk);
      base64Chunks.push(base64Chunk);
    }

    // Reassemble the Base64 chunks into a single Base64 string
    const fullBase64 = base64Chunks.join("");

    // Convert Base64 string back to a Blob
    // const videoBlob = base64ToBlob(fullBase64, file.type);

    // Create a URL for the Blob and set it as the video source
    // const videoUrl = URL.createObjectURL(videoBlob);
    return {
      video_base64: `data:application/octet-stream;base64,${fullBase64}`,
    };
  };

  return {
    base64ToBlob,
    fileToBase64,
    handleChunkVideo,
  };
};
