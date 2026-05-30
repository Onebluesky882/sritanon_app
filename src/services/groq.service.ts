/**
 * GroqService
 * ส่ง WAV blob → Groq Whisper API → คืน transcript text
 */
export async function transcribeWav(
  wavBlob: Blob,
  apiKey: string,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", wavBlob, "audio.wav");
  formData.append("model", "whisper-large-v3");
  formData.append("language", "th");
  formData.append("response_format", "text");

  const res = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    },
  );

  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${await res.text()}`);
  }

  return (await res.text()).trim();
}
