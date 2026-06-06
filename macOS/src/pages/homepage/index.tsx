import { useState, useEffect, useRef, useMemo } from "react";
import { Mic, Sparkles, Zap, Hand } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useSpeechStore } from "@/stores/speech-store";
import { processSpeechChunk } from "@/services/whisper.service";
import { analyzeManual, autoDetectAndAnalyze } from "@/services/interview.service";
import type { SpeechChunk } from "@/types/audio.type";
import type { Language } from "@/stores/speech-store";
import { QuestionCard } from "@/components/homepage/QuestionCard";
import { AnalysisSection } from "@/components/homepage/AnalysisSection";
import { LanguageDropdown } from "@/components/homepage/ToggleLang";
import { JobInput } from "@/components/homepage/JobInput";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY ?? "";

export default function Homepage() {
  const {
    isCapturing, setCapturing,
    analyses, isAnalyzing,
    recentBuffer, mode, setMode,
    language, setLanguage,
    clearBuffer, detectedQuestions, markQuestionAnalyzed,
  } = useSpeechStore();

  const [selectedTranscriptIds, setSelectedTranscriptIds] = useState<Set<string>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [openLang, setOpenLang] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedTranscripts = useMemo(() => {
    return [...recentBuffer].reverse().filter((t) => selectedTranscriptIds.has(t.id));
  }, [recentBuffer, selectedTranscriptIds]);

  const toggleTranscript = (id: string) => {
    setSelectedTranscriptIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAnalyzeQuestion = async (id: string) => {
    try {
      await analyzeManual();
      markQuestionAnalyzed(id);
    } catch (err) {
      console.error("analyze question error", err);
    }
  };

  const handleAnalyzeSelected = async () => {
    if (selectedTranscriptIds.size === 0) return;
    await analyzeManual();
    setSelectedTranscriptIds(new Set());
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [analyses]);

  useEffect(() => {
    const unlisten = listen<SpeechChunk>("speech-chunk", async (event) => {
      const chunk = event.payload;
      if (chunk.duration_ms < 300) return;
      setIsProcessing(true);
      setLiveText("กำลัง transcribe...");
      try {
        const text = await processSpeechChunk(chunk, GROQ_API_KEY);
        if (text) {
          setLiveText(text);
          await autoDetectAndAnalyze();
        }
      } finally {
        setIsProcessing(false);
      }
    });
    return () => { unlisten.then((f) => f()) };
  }, []);

  const toggleCapture = async () => {
    if (!isListening) {
      try {
        await invoke("start_audio_capture");
        setIsListening(true);
        setCapturing(true);
        console.log("🎤 Started");
      } catch (e) {
        console.error("❌", e);
      }
    } else {
      setIsListening(false);
      setCapturing(false);
      setIsProcessing(false);
      setLiveText("");
      console.log("🛑 Stopped");
    }
  };

  return (
    <div className="flex h-screen border border-ring/10 rounded-2xl shadow bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <main className="flex-1 flex flex-col relative">

        {/* Header */}
        <header className="sticky top-0 h-16 border-b flex items-center justify-between px-6 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-10 gap-3">
          <div className="flex items-center gap-3 flex-wrap">

            {/* Status */}
            {isListening && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                LIVE
              </div>
            )  }

            {!isListening && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-zinc-600 text-white">
                <div className="w-2 h-2 rounded-full bg-zinc-400" />
                READY
              </div>
            )}

            {/* Mode */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setMode("manual")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === "manual" ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white" : "text-zinc-500"}`}
              >
                <Hand size={10} /> Manual
              </button>
              <button
                onClick={() => setMode("auto")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === "auto" ? "bg-white dark:bg-zinc-700 shadow text-indigo-600" : "text-zinc-500"}`}
              >
                <Zap size={10} /> Auto
              </button>
            </div>

            {/* Language */}
            <LanguageDropdown
              language={language as Language}
              open={openLang}
              setOpen={setOpenLang}
              setLanguage={setLanguage}
            />

            {/* Job Position */}
            <JobInput />

          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Analyze button — manual mode */}
            {mode === "manual" && isListening && (
              <button
                onClick={analyzeManual}
                disabled={isAnalyzing || recentBuffer.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
              >
                <Sparkles size={14} />
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </button>
            )}

            {/* Start / Stop toggle */}
            <button
              onClick={toggleCapture}
              className={`px-4 py-2 text-white rounded-xl font-bold text-sm transition-colors ${isListening
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
                }`}
            >
              {isListening ? "⏹ Stop" : "▶ Start"}
            </button>
          </div>
        </header>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">

            {/* LEFT COLUMN */}
            <div className="flex relative flex-col gap-4 overflow-hidden">
              {recentBuffer.length > 0 && (
                <div className="min-h-[80%] overflow-hidden rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                      Live Transcript ({recentBuffer.length})
                    </span>
                    <button onClick={clearBuffer} className="text-xs text-red-500 hover:text-red-600">Clear</button>
                  </div>
                  <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(80vh - 8rem)' }}>
                    {[...recentBuffer].map((t) => (
                      <div
                        key={t.id}
                        className={`rounded-xl p-3 border transition-all cursor-pointer ${selectedTranscriptIds.has(t.id) ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"}`}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">Speech</span>
                          <span className="text-[10px] text-zinc-400">{new Date(t.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <label className="flex items-center gap-2 text-xs mb-2">
                          <input type="checkbox" checked={selectedTranscriptIds.has(t.id)} onChange={() => toggleTranscript(t.id)} />
                          Select for AI group
                        </label>
                        <p className="text-sm">{t.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTranscriptIds.size > 0 && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 p-4">
                  <div className="flex justify-between mb-3">
                    <div>
                      <div className="text-xs font-black uppercase text-indigo-600">Group Analysis</div>
                      <div className="text-xs text-zinc-500">{selectedTranscriptIds.size} selected</div>
                    </div>
                    <button onClick={handleAnalyzeSelected} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                      AI Analyze
                    </button>
                  </div>
                  <div className="space-y-1">
                    {selectedTranscripts.map((t) => (
                      <div key={t.id} className="text-xs p-2 rounded bg-white dark:bg-zinc-900 border">{t.text}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex relative flex-col gap-4 overflow-y-auto max-h-[75vh] pr-2">
              {detectedQuestions.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    Detected Questions ({detectedQuestions.length})
                  </div>
                  {[...detectedQuestions].map((q) => (
                    <QuestionCard key={q.id} item={q} onAnalyze={handleAnalyzeQuestion} />
                  ))}
                </div>
              )}

              <AnimatePresence>
                {[...analyses].map(a => (
                  <AnalysisSection key={a.id} item={a} />
                ))}
              </AnimatePresence>

              {isAnalyzing && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20">
                    <span className="text-xs text-indigo-500">กำลังวิเคราะห์...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live bar */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="sticky bottom-0 px-4 pb-3 z-20"
            >
              <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex gap-1 h-3 items-center">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: isProcessing ? [4, 12, 4] : 4 }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                        className="w-1 bg-indigo-500 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    {isProcessing ? "Processing..." : "Listening..."}
                  </span>
                  {mode === "manual" && recentBuffer.length > 0 && (
                    <span className="ml-auto text-[10px] text-zinc-400">
                      {recentBuffer.length} chunks · กด Analyze
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 italic truncate">{liveText || "กำลังดักฟัง..."}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="h-10 border border-t flex items-center px-8 text-[10px] text-zinc-500 justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Sparkles size={10} /> Groq Whisper + qwen3-32b</span>
            <span className="flex items-center gap-1"><Mic size={10} /> System Audio</span>
          </div>
          <div className="font-mono">{isCapturing ? "LIVE" : "READY"}</div>
        </footer>

      </main>
    </div>
  );
}