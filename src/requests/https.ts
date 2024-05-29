import Axios from 'axios'

const BASE_URL = 'https://salina-sg-region.s3.ap-southeast-1.amazonaws.com';

async function UploadFile(binary: any) {
    await Axios.put(`${BASE_URL}/transcriptions/try_jc/multipart/65d6c87a593a75487002e199?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAW5HKVDTGTYLW6UHZ%2F20240529%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20240529T014434Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=4fff2f250b4ae33ad7d0d6120ce83a51bece50369afd10ce76439ec242cf4ecd`, binary).then((response) => {
        return response.data;
    }).catch((err) => {
        throw new Error(err);
    })
}

export {
    UploadFile
}