import { detectQuestion, analyzeInterview } from "./groq.service";
import { useSpeechStore } from "@/stores/speech-store";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY ?? "";

export async function analyzeManual(): Promise<void> {
  const {
    recentBuffer,
    selectedChunkIds,
    addAnalysis,
    setAnalyzing,
    clearSelection,
    language,
  } = useSpeechStore.getState();

  // ถ้า user เลือก chunk → ใช้เฉพาะที่เลือก, ถ้าไม่เลือก → ใช้ทั้งหมด
  const buffer =
    selectedChunkIds.size > 0
      ? recentBuffer.filter((t) => selectedChunkIds.has(t.id))
      : recentBuffer;

  if (buffer.length === 0) return;

  setAnalyzing(true);
  try {
    const result = await analyzeInterview(buffer, GROQ_API_KEY, language);
    addAnalysis(result);
    clearSelection();
  } catch (err) {
    console.error("analyzeManual error:", err);
  } finally {
    setAnalyzing(false);
  }
}


export async function autoDetectAndAnalyze(): Promise<void> {
  const {
    recentBuffer,
    mode,
    isAnalyzing,
    addAnalysis,
    setAnalyzing,
    clearBuffer,
    language,
  } = useSpeechStore.getState();

  if (mode !== "auto") return;
  if (isAnalyzing) return;
  if (recentBuffer.length === 0) return;

  setAnalyzing(true);
  try {
    const { complete } = await detectQuestion(recentBuffer, GROQ_API_KEY);
    if (!complete) return;

    const result = await analyzeInterview(recentBuffer, GROQ_API_KEY, language);
    addAnalysis(result);
    clearBuffer();
  } catch (err) {
    console.error("autoDetect error:", err);
  } finally {
    setAnalyzing(false);
  }
}
