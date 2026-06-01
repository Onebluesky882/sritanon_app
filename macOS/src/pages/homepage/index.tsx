import { useState, useEffect, useRef } from "react";
import { Mic, Play, Square, Sparkles, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useSpeechStore } from "@/stores/speech-store";
import { processSpeechChunk } from "@/services/whisper.service";
import type { SpeechChunk } from "@/types/audio.type";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY ?? "";

interface Message {
  role: "interviewer" | "assistant";
  content: string;
}

export default function Homepage() {
  const { isCapturing, setCapturing } = useSpeechStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, transcript]);

  // รับ speech-chunk จาก Rust → transcribe → แสดงผล
  useEffect(() => {
    const unlisten = listen<SpeechChunk>("speech-chunk", async (event) => {
      const chunk = event.payload;
      if (chunk.duration_ms < 300) return;

      setIsProcessing(true);
      try {
        // transcribe และรับ text กลับมา
        const text = await processSpeechChunk(chunk, GROQ_API_KEY);
        if (text) {
          setMessages((prev) => [
            ...prev,
            { role: "interviewer", content: text },
          ]);
          setTranscript("");
        }
      } finally {
        setIsProcessing(false);
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const startCapture = async () => {
    try {
      await invoke("start_audio_capture");
      setIsListening(true);
      setCapturing(true);
    } catch (error) {
      console.error("❌", error);
    }
  };

  return (
    <div className="flex h-screen border border-ring/10 rounded-2xl shadow bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isListening ? "bg-red-100 text-red-600 animate-pulse" : "bg-zinc-100 text-zinc-500"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isListening ? "bg-red-600" : "bg-zinc-400"}`}
              />
              {isListening ? "LIVE LISTENING (SPEAKER)" : "READY"}
            </div>
            <span className="text-zinc-400">|</span>
            <div className="text-sm font-medium text-foreground">
              Target: System Audio (Thai)
            </div>
          </div>

          <div className="p-6">
            <button
              onClick={startCapture}
              disabled={isListening}
              className={`${isListening ? "bg-red-500" : "bg-blue-500"} px-4 py-2 text-white rounded disabled:opacity-70`}
            >
              {isListening ? "🔴 Recording..." : "Start Audio Capture"}
            </button>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 relative space-y-6 custom-scrollbar pb-40"
        >
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i}
                className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === "assistant"
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-800 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {msg.role === "assistant" ? (
                      <Sparkles size={14} className="text-indigo-500" />
                    ) : (
                      <Volume2 size={14} className="text-zinc-500" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {msg.role === "assistant"
                        ? "AI Mentor Suggestion"
                        : "Interviewer Question"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Real-time Transcription Visualizer */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="  sticky -bottom-40 left-0 right-0 flex justify-center px-8 z-20"
              >
                <div className="  bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex gap-1 h-3 items-center">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: isProcessing ? [4, 12, 4] : 4 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6,
                            delay: i * 0.1,
                          }}
                          className="w-1 bg-indigo-500 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      {isProcessing ? "Processing..." : "AI Listening..."}
                    </span>
                  </div>

                  <p className="text-zinc-600 dark:text-zinc-300 text-sm font-medium leading-relaxed italic">
                    {transcript || "กำลังดักฟังเสียงลำโพง..."}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="h-12 border-t flex items-center px-8 text-[10px] text-zinc-500 justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <Sparkles size={10} /> Groq Whisper large-v3
            </span>
            <span className="flex items-center gap-1">
              <Mic size={10} /> System Audio (Thai)
            </span>
          </div>
          <div className="font-mono">
            {isCapturing ? "LIVE MODE: ACTIVE" : "READY"}
          </div>
        </footer>
      </main>
    </div>
  );
}
