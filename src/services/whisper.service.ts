import { useSpeechStore } from "@/stores/speech-store";

export async function transcribeSpeech(audio: Float32Array) {
  const setTranscript = useSpeechStore.getState().setTranscript;

  console.log("transcribing audio", audio.length);

  // TEMP mock

  const fakeText = "Realtime speech detected";

  // Update store with transcript
  setTranscript(fakeText);

  return fakeText;
}
