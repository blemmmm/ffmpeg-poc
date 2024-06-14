import { create } from "zustand";

export interface IVideo {
  id: string;
  video_url: string;
  audio_url: string;
  file_name: string;
  source_file_type: string;
  created_at: string;
  video_base64?: string | ArrayBuffer | Blob | null;
  audio_base64?: string | ArrayBuffer | Blob | null;
  thumbnail?: string;
}

export interface StoreState {
  uploadedVideos: IVideo[];
  setUploadedVideos: (value: IVideo[]) => void;
  removeVideos: () => void;
}

export const useVideoStore = create<StoreState>()((set) => ({
  uploadedVideos: [],
  setUploadedVideos: (value: IVideo[]) => set({ uploadedVideos: value }),
  removeVideos: () => set({ uploadedVideos: [] }),
}));
