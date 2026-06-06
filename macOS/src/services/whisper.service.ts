import type { SpeechChunk } from "@/types/audio.type"
import { pcmBase64ToWavBlob } from "./audio.service"
import { transcribeWav } from "./groq.service"
import { useSpeechStore } from "@/stores/speech-store"

let activeRequests = 0
const MAX_PARALLEL = 2

export async function processSpeechChunk(
  chunk: SpeechChunk,
  apiKey: string
): Promise<string | null> {
  if (chunk.duration_ms < 300) return null

  if (activeRequests >= MAX_PARALLEL) {
    console.warn(`⚠️ Groq busy — skip`)
    return null
  }

  activeRequests++
  const start = Date.now()

  try {
    const { language } = useSpeechStore.getState()
    const wav = pcmBase64ToWavBlob(chunk.pcm_base64)
    const text = await transcribeWav(wav, apiKey, language)
    const elapsed = Date.now() - start

    console.log(`${chunk.is_partial ? '📡 Partial' : '✅ Final'} ${chunk.duration_ms}ms → ${elapsed}ms: "${text?.slice(0, 50)}"`)

    if (!text) return null

    if (!chunk.is_partial) {
      useSpeechStore.getState().addTranscript({
        id: crypto.randomUUID(),
        text,
        duration_ms: chunk.duration_ms,
        timestamp: new Date(),
      })
    }

    return text
  } catch (err) {
    console.error("whisper error:", err)
    return null
  } finally {
    activeRequests--
  }
}
