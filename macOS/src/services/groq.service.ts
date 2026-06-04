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
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(
      `Groq Whisper ${res.status}: ${await res.text()}`
    );
  }

  return (await res.text()).trim();
}


export async function detectQuestion(
  buffer: Transcript[],
  apiKey: string,
  language: Language = "en",
): Promise<{ complete: boolean; question: string }> {

  const outputLanguages: Record<Language, string> = {

    th: "Thai",

    en: "English",

    zh: "Simplified Chinese",

    ja: "Japanese",

  };
  const outputLanguage = outputLanguages[language as Language] ?? "English";
  const context = buffer.map((t) => t.text).join(" ");

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: ` You are an Interview Coach helping Junior to Mid-Level Software Engineer candidates.

IMPORTANT:

- Write ALL output fields in ${outputLanguage}

- Return JSON only

- Do NOT use markdown, code blocks, or any extra text

Your goal:

- Help generate answers that sound like a real human speaking in an interview

- Make responses feel natural, not robotic or formal

- Avoid sounding like AI, documentation, or textbook explanations

- Answers should feel believable, not perfect

Style:

- Simple conversational language

- Short and clear answers

- Slight hesitation is okay if natural

- Avoid excessive technical jargon

- Do NOT force STAR format unless it fits naturally

Rules:

- Do NOT invent or exaggerate experiences

- Do NOT sound like Senior, Staff, or Architect level

- Think like a real candidate under interview pressure

Tone:

- Friendly

- Natural

- Not academic

- Not overly structured

`,
        },
        {
          role: "user",
          content: context,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq detect ${res.status}`);
  }

  const data = await res.json();

  try {
    return parseJSON<{
      complete: boolean;
      question: string;
    }>(data.choices[0].message.content);
  } catch {
    return {
      complete: false,
      question: "",
    };
  }
}

export async function analyzeInterview(
  buffer: Transcript[],
  apiKey: string,
  language: string = "th",
): Promise<InterviewAnalysis> {
  const context = buffer.map((t) => t.text).join(" ");

  const langInstruction: Record<string, string> = {
    th: "ตอบทุกอย่างเป็นภาษาไทย",
    en: "Answer everything in English",
    zh: "用中文回答所有内容",
    ja: "すべて日本語で答えてください",
  };
  const langNote = langInstruction[language] ?? "ตอบเป็นภาษาไทย";

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "qwen/qwen3-32b",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
คุณเป็น Interview Coach สำหรับผู้สมัครงาน Software Engineer ระดับ Junior ถึง Mid Level

${langNote}

หลักการ:

- ตอบเหมือนผู้สมัครงานจริง
- ใช้ภาษาธรรมชาติ
- ไม่โอ้อวด
- ไม่แต่งประสบการณ์ที่ไม่มีในข้อมูล
- ไม่ใช้ศัพท์เทคนิคมากเกินจำเป็น
- เน้นความเข้าใจพื้นฐานที่ถูกต้อง
- คำตอบควรนำไปพูดในการสัมภาษณ์ได้จริง

สำหรับคำถามเชิงพฤติกรรม (Behavioral):
- ตอบแบบเล่าเรื่องสั้น ๆ
- แสดงวิธีคิด
- แสดงสิ่งที่เรียนรู้
- ใช้ STAR Method หากเหมาะสม

สำหรับคำถามเชิงเทคนิค (Technical):
- อธิบายจากพื้นฐานก่อน
- ยกตัวอย่างง่าย ๆ
- อธิบายข้อดีข้อเสียเมื่อเหมาะสม
- ไม่ลงลึกระดับ Architect หรือ Principal Engineer

Feedback:
- ระบุจุดแข็งของคำตอบ
- ระบุสิ่งที่ควรเพิ่ม
- อธิบายสิ่งที่ผู้สัมภาษณ์กำลังประเมิน

ตอบ JSON เท่านั้น
ห้าม markdown
ห้าม code block
ห้าม think tag
`,
        },
        {
          role: "user",
          content: `
Transcript จากการสัมภาษณ์:

"${context}"

งานที่ต้องทำ:

1. ตรวจจับคำถามที่ผู้สัมภาษณ์ถาม
2. วิเคราะห์ว่าผู้สัมภาษณ์ต้องการประเมินอะไร
3. สร้างคำตอบตัวอย่างที่:
   - ฟังเป็นธรรมชาติ
   - เหมือนผู้สมัครจริง
   - ไม่เวอร์เกินจริง
   - ไม่แต่งประสบการณ์
   - ใช้ความรู้ระดับพื้นฐานถึงปานกลาง
   - สามารถพูดจริงในการสัมภาษณ์ได้

ตอบเป็น JSON ตามรูปแบบนี้เท่านั้น:

{
  "question": "คำถามที่ตรวจจับได้",
  "answer": "คำตอบตัวอย่าง",
  "feedback": "ข้อเสนอแนะ",
  "isComplete": true
}
`,
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
      answer: "ไม่สามารถวิเคราะห์ได้",
      feedback: "",
      isComplete: true,
    };
  }
}
