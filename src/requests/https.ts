import Axios from "axios";

const BASE_URL = "https://salina-sg-region.s3.ap-southeast-1.amazonaws.com";

async function UploadFile(binary: any) {
  await Axios.put(
    `${BASE_URL}/transcriptions/bless/multipart/bless.mp3?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAW5HKVDTGTYLW6UHZ%2F20240529%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20240529T055217Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=093de5deb076adc2f2b3a3ab304acd5de4fb08206eaeb6ec7692fe5d6671a8cc`,
    binary,
    {
      headers: {
        "Content-Type": "application/binary",
      },
    }
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
}

export { UploadFile };
