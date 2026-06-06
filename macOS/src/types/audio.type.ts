export type SpeechChunk = {
  duration_ms: number
  pcm_base64: string
  is_partial: boolean
}

export type Transcript = {
  id: string
  text: string
  duration_ms: number
  timestamp: Date
}

export type InterviewAnalysis = {
  id: string
  question: string
  answer: string
  feedback: string
  isComplete: boolean
  timestamp: Date
}
export type DetectedQuestion = {

  id: string;

  transcript: string;

  question: string;

  complete: boolean;

  analyzed: boolean;

  timestamp: Date;

  transcriptIds: string[];

};