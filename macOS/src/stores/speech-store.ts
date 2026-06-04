import { create } from "zustand";
import type {
  Transcript,
  InterviewAnalysis,
  DetectedQuestion,
} from "@/types/audio.type";

const BUFFER_WINDOW_MS = 30000;

type Mode = "manual" | "auto";
export type Language = "th" | "en" | "zh" | "ja";

type SpeechStore = {
  transcripts: Transcript[];
  recentBuffer: Transcript[];

  selectedChunkIds: Set<string>;

  analyses: InterviewAnalysis[];
  detectedQuestions: DetectedQuestion[];

  isCapturing: boolean;
  isAnalyzing: boolean;

  mode: Mode;
  language: Language;

  addTranscript: (t: Transcript) => void;
  addAnalysis: (a: InterviewAnalysis) => void;
  addDetectedQuestion: (q: DetectedQuestion) => void;

  markQuestionAnalyzed: (id: string) => void;

  toggleChunk: (id: string) => void;
  clearSelection: () => void;

  setCapturing: (v: boolean) => void;
  setAnalyzing: (v: boolean) => void;

  setMode: (m: Mode) => void;
  setLanguage: (l: Language) => void;

  clearBuffer: () => void;
  clear: () => void;
};

export const useSpeechStore = create<SpeechStore>((set) => ({
  transcripts: [],
  recentBuffer: [],

  selectedChunkIds: new Set(),

  analyses: [],
  detectedQuestions: [],

  isCapturing: false,
  isAnalyzing: false,

  mode: "manual",
  language: "th",

  // -------------------------
  // TRANSCRIPT (stable buffer)
  // -------------------------
  addTranscript: (t) =>
    set((state) => {
      const now = Date.now();

      return {
        transcripts: [t, ...state.transcripts].slice(0, 50),

        recentBuffer: [
          t,
          ...state.recentBuffer,
        ].filter(
          (x) =>
            now - x.timestamp.getTime() <
            BUFFER_WINDOW_MS
        ),
      };
    }),

  // -------------------------
  // ANALYSIS (NEW ON TOP)
  // -------------------------
  addAnalysis: (a) =>
    set((state) => ({
      analyses: [a, ...state.analyses],
    })),

  // -------------------------
  // QUESTIONS (NEW ON TOP)
  // -------------------------
  addDetectedQuestion: (q) =>
    set((state) => ({
      detectedQuestions: [
        q,
        ...state.detectedQuestions,
      ].slice(0, 20),
    })),

  markQuestionAnalyzed: (id) =>
    set((state) => ({
      detectedQuestions: state.detectedQuestions.map(
        (q) =>
          q.id === id
            ? { ...q, analyzed: true }
            : q
      ),
    })),

  // -------------------------
  // SELECTION
  // -------------------------
  toggleChunk: (id) =>
    set((state) => {
      const next = new Set(state.selectedChunkIds);

      next.has(id)
        ? next.delete(id)
        : next.add(id);

      return {
        selectedChunkIds: next,
      };
    }),

  clearSelection: () =>
    set({
      selectedChunkIds: new Set(),
    }),

  // -------------------------
  // FLAGS
  // -------------------------
  setCapturing: (isCapturing) =>
    set({ isCapturing }),

  setAnalyzing: (isAnalyzing) =>
    set({ isAnalyzing }),

  setMode: (mode) => set({ mode }),

  setLanguage: (language) => set({ language }),

  // -------------------------
  // CLEAR
  // -------------------------
  clearBuffer: () =>
    set({
      recentBuffer: [],
      selectedChunkIds: new Set(),
    }),

  clear: () =>
    set({
      transcripts: [],
      recentBuffer: [],
      analyses: [],
      detectedQuestions: [],
      selectedChunkIds: new Set(),
    }),
}));