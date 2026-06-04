import { detectQuestion } from "./groq.service";
import { useSpeechStore } from "@/stores/speech-store";

const GROQ_API_KEY =
  import.meta.env.VITE_GROQ_API_KEY ?? "";

export async function detectQuestionFromBuffer() {
  const store = useSpeechStore.getState();

  if (store.recentBuffer.length === 0) {
    return;
  }

  try {
    const result =
      await detectQuestion(
        store.recentBuffer,
        GROQ_API_KEY,
        store.language,
      );

    console.log(
      "🤖 Question Detection:",
      result,
    );

    if (!result.complete) {
      return;
    }

    store.addDetectedQuestion({
      id: crypto.randomUUID(),

      transcript: store.recentBuffer
        .map((t) => t.text)
        .join(" "),

      question: result.question,

      complete: true,

      analyzed: false,

      timestamp: new Date(),

      transcriptIds: store.recentBuffer.map(
        (t) => t.id,
      ),
    });
  } catch (err) {
    console.error(
      "detectQuestion error:",
      err,
    );
  }
}