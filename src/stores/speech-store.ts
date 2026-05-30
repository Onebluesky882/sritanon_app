import { Transcript } from "@/types/audio.type";
import { create } from "zustand";

type SpeechStore = {
  transcripts: Transcript[];
  isCapturing: boolean;
  addTranscript: (t: Transcript) => void;
  setCapturing: (v: boolean) => void;
  clear: () => void;
};

export const useSpeechStore = create<SpeechStore>((set) => ({
  transcripts: [],
  isCapturing: false,
  addTranscript: (t) =>
    set((state) => ({ transcripts: [t, ...state.transcripts].slice(0, 50) })),
  setCapturing: (v) => set({ isCapturing: v }),
  clear: () => set({ transcripts: [] }),
}));
