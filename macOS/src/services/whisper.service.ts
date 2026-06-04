import type { SpeechChunk } from "@/types/audio.type"
import { pcmBase64ToWavBlob } from "./audio.service"
import { transcribeWav } from "./groq.service"
import { useSpeechStore } from "@/stores/speech-store"

export async function processSpeechChunk(
  chunk: SpeechChunk,
  apiKey: string
): Promise<string | null> {
  if (chunk.duration_ms < 300) return null

  try {
    const wav = pcmBase64ToWavBlob(chunk.pcm_base64)
    const text = await transcribeWav(wav, apiKey)
    if (!text) return null

    const transcript = {
      id: crypto.randomUUID(),
      text,
      duration_ms: chunk.duration_ms,
      timestamp: new Date(),
    }

    useSpeechStore.getState().addTranscript(transcript)


    return text
  } catch (err) {
    console.error("whisper error: ", err)
    return null
  }
}
