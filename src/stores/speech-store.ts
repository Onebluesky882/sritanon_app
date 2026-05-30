import { create } from "zustand";

type SpeechStore = {
  transcript: string;
  setTranscript: (transcript: string) => void;
};

export const useSpeechStore = create<SpeechStore>((set) => ({
  transcript: "",
  setTranscript: (transcript) => set({ transcript }),
}));
