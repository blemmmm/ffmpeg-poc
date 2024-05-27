import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface IVideo {
  id: string;
  video_url: string;
  audio_url: string;
  file_name: string;
  source_file_type: string;
  created_at: string;
}

export interface StoreState {
  uploadedVideos: IVideo[];
  setUploadedVideos: (value: IVideo[]) => void;
  removeVideos: () => void;
}

export const useVideoStore = create<StoreState>()(
  persist(
    (set) => ({
      uploadedVideos: [],
      setUploadedVideos: (value: IVideo[]) => set({ uploadedVideos: value }),
      removeVideos: () => set({ uploadedVideos: [] }),
    }),
    {
      name: "video-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
