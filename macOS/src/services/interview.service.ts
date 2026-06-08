import { detectQuestion, analyzeInterview } from "./groq.service";
import { useSpeechStore } from "@/stores/speech-store";
import { useJobStore } from "@/stores/job-store";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY ?? "";

export async function analyzeManual(): Promise<void> {
  const {
    recentBuffer,
    selectedChunkIds,
    addAnalysis,
    setAnalyzing,
    clearSelection,
    removeFromBuffer,
    language,
  } = useSpeechStore.getState();
  const { jobPosition } = useJobStore.getState();

  const buffer =
    selectedChunkIds.size > 0
      ? recentBuffer.filter((t) => selectedChunkIds.has(t.id))
      : recentBuffer;

  if (buffer.length === 0) return;
  if (useSpeechStore.getState().isAnalyzing) return;

  setAnalyzing(true);
  try {
    const result = await analyzeInterview(
      buffer,
      GROQ_API_KEY,
      language,        // ← ส่ง language
      jobPosition      // ← ส่ง jobPosition
    );
    addAnalysis(result);
    // ลบ chunk ที่วิเคราะห์ไปแล้วออกจาก buffer กัน analyze ซ้ำ → คำถามซ้ำ
    removeFromBuffer(buffer.map((t) => t.id));
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
  const { jobPosition } = useJobStore.getState();

  if (mode !== "auto") return;
  if (isAnalyzing) return;
  if (recentBuffer.length === 0) return;

  setAnalyzing(true);
  try {
    const { complete } = await detectQuestion(
      recentBuffer,
      GROQ_API_KEY,
      language          // ← ส่ง language
    );
    if (!complete) return;

    const result = await analyzeInterview(
      recentBuffer,
      GROQ_API_KEY,
      language,          // ← ส่ง language
      jobPosition        // ← ส่ง jobPosition
    );
    addAnalysis(result);
    clearBuffer();
  } catch (err) {
    console.error("autoDetect error:", err);
  } finally {
    setAnalyzing(false);
  }
}
