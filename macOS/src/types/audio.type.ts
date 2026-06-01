export type SpeechChunk = {
  duration_ms: number;
  pcm_base64: string;
};

export type Transcript = {
  id: string;
  text: string;
  duration_ms: number;
  timestamp: Date;
};
