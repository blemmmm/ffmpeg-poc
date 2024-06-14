import { CONFIG } from "@/configs/config";
import { CreateProcessIDPayloadInterface, CreateUploadLinksRequestPayloadInterface } from "@/configs/interfaces";
import sign from 'jwt-encode';
import Axios from "axios";
import { TRANSCODER } from '../configs/endpoints';

const BASE_URL = CONFIG.API_URL;

async function CreateProcessIDRequest(payload: CreateProcessIDPayloadInterface){

  const encodedToken = sign(payload, CONFIG.ACCESS_SECRET);

  return await Axios.post(
    `${BASE_URL}${TRANSCODER.CREATE_PROCESS_ID}`,{
      token: encodedToken
  })
  .then((response) => {
    return response;
  })
  .catch((err) => {
    throw new Error(err);
  });
}

async function GetUploadLinksRequest(payload: CreateUploadLinksRequestPayloadInterface){

  const encodedToken = sign(payload, CONFIG.ACCESS_SECRET);

  return await Axios.get(
    `${BASE_URL}${TRANSCODER.UPLOAD_VIDEO}?token=${encodedToken}`)
  .then((response) => {
    return response;
  })
  .catch((err) => {
    throw new Error(err);
  });
}

export { 
  // UploadFile,
  CreateProcessIDRequest,
  GetUploadLinksRequest
};
