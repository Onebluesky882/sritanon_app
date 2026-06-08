import type { InterviewAnalysis, Transcript } from "@/types/audio.type";

const GROQ_BASE = "https://api.groq.com/openai/v1";

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/```json|```/g, "")
    .trim();
  return JSON.parse(cleaned);
}

type Language = "th" | "en" | "zh" | "ja";
type GroqAnalysis = Omit<InterviewAnalysis, "id" | "timestamp">;

const LANG_NAME: Record<Language, string> = {
  th: "Thai",
  en: "English",
  zh: "Simplified Chinese",
  ja: "Japanese",
}

const LANG_FORCE: Record<Language, string> = {
  th: "YOU MUST answer ALL fields in Thai language only. No English allowed.",
  en: "YOU MUST answer ALL fields in English language only. No other language allowed.",
  zh: "YOU MUST answer ALL fields in Simplified Chinese only. No other language allowed.",
  ja: "YOU MUST answer ALL fields in Japanese only. No other language allowed.",
}

export async function transcribeWav(
  wavBlob: Blob,
  apiKey: string,
  language: Language = "th",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", wavBlob, "audio.wav");
  formData.append("model", "whisper-large-v3");
  formData.append("language", language);
  formData.append("response_format", "text");

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`Groq Whisper ${res.status}: ${await res.text()}`);
  return (await res.text()).trim();
}

export async function detectQuestion(
  buffer: Transcript[],
  apiKey: string,
  language: Language = "th",
): Promise<{ complete: boolean; question: string }> {
  const context = buffer.map((t) => t.text).join(" ");
  const langName = LANG_NAME[language] ?? "English"

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an interview assistant.
Detect if the text contains a complete interview question.
Write the "question" field in ${langName}.
Return JSON only. No markdown.`,
        },
        {
          role: "user",
          content: `Text: "${context}"\n\nReturn: {"complete": true/false, "question": "question in ${langName} if complete, or empty string"}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Groq detect ${res.status}`);
  const data = await res.json();
  try {
    return parseJSON<{ complete: boolean; question: string }>(data.choices[0].message.content);
  } catch {
    return { complete: false, question: "" };
  }
}

export async function analyzeInterview(
  buffer: Transcript[],
  apiKey: string,
  language: Language | string = "th",
  jobPosition: string = "",
): Promise<InterviewAnalysis> {
  const context = buffer.map((t) => t.text).join(" ");
  const lang = (language as Language) in LANG_NAME ? language as Language : "th"
  const langName = LANG_NAME[lang]
  const langForce = LANG_FORCE[lang]
  const jobContext = jobPosition
    ? `The candidate is applying for: ${jobPosition}`
    : "No specific position mentioned — answer generally"

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "qwen/qwen3-32b",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert Interview Coach for job candidates.

⚠️ LANGUAGE RULE (HIGHEST PRIORITY): ${langForce}
Every single word in "question", "answer", and "feedback" fields MUST be in ${langName}.

${jobContext}

Your role:
- Coach candidates at Junior to Mid level
- Help them answer naturally, like a real person talking
- NOT like reading a script or textbook

Interview answer principles (from standard interview books):

For Behavioral questions:
- Use STAR Method: Situation → Task → Action → Result
- Use real examples, do not fabricate
- Mention measurable results

For Technical questions, the example "answer" MUST walk through this exact order so the interviewer can see the candidate knows the basic-optimization hierarchy before jumping to advanced ideas:
  1) Restate/clarify what the problem is asking
  2) Standard / fundamental approach first — the textbook first steps (e.g. for a DB performance question: check the execution plan → add a proper index → select only needed columns → optimize join conditions)
  3) Then advanced / production-level solution, framed as "if that's still not enough..." (e.g. denormalized/materialized tables, scheduled sync jobs, caching layer such as Redis as an in-memory data store — not "a DB wrapper")
  4) Explicitly state the trade-off of each step (cost, complexity, data freshness, maintenance)
- Skipping straight to the advanced solution without mentioning the fundamentals first makes the candidate look like they "skipped the basics" even if their idea is production-correct — always show the basic step before the advanced one
- Tailor the technical examples and vocabulary to the candidate's target role from "${jobPosition || "general software role"}" (e.g. a Backend/Data role example should reference databases, queries, pipelines; a Frontend role should reference rendering, state, performance in the browser)
- Use precise terminology for the role (e.g. Redis = in-memory data store / cache layer, not "database wrapper")

For General questions:
- Be direct and concise
- Show understanding of the role
- Connect experience to what the company needs

Language style:
- Natural conversational tone
- Simple words, avoid excessive jargon
- Appropriate length, not too short or too long

Return JSON only. No markdown. No think tags.`,
        },
        {
          role: "user",
          content: `Interview transcript:
"${context}"

Analyze and return JSON in ${langName}:
{
  "question": "detected interview question (in ${langName})",
  "answer": "example answer that sounds natural in a real interview (in ${langName})",
  "feedback": "what the interviewer is evaluating and what to improve (in ${langName})",
  "isComplete": true
}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Groq analyze ${res.status}`);
  const data = await res.json();
  const raw = data.choices[0].message.content;

  try {
    const parsed = parseJSON<GroqAnalysis>(raw);
    return { ...parsed, id: crypto.randomUUID(), timestamp: new Date() };
  } catch {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      question: context,
      answer: "Unable to analyze",
      feedback: "",
      isComplete: true,
    };
  }
}
