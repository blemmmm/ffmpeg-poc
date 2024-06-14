export interface CreateProcessIDPayloadInterface {
  file_size: number;
  transcription_name: string;
  duration_in_seconds: number;
  access_token: string;
}

export interface CreateUploadLinksRequestPayloadInterface {
  chunk_size?: number;
  process_id: string;
  extension: string;
  file_size: number;
  access_token: string;
}

export interface DecodedTokenInterface {
    access_token: string;
}