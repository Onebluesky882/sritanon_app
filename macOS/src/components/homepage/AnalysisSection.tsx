import { InterviewAnalysis } from "@/types/audio.type";
import { motion } from "framer-motion";
import { Sparkles, Volume2 } from "lucide-react";

export function AnalysisSection({ item }: { item: InterviewAnalysis }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Question */}
      <div className="flex justify-end">
        <div className="max-w-[85%] p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 size={12} className="text-zinc-500" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
              Question
            </span>
            <span className="ml-auto text-[10px] text-zinc-400">
              {item.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{item.question}</p>
        </div>
      </div>

      {/* Answer */}
      <div className="flex justify-start">
        <div className="max-w-[85%] p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
              AI Suggested Answer
            </span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {item.answer}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {item.feedback && (
        <div className="flex justify-start">
          <div className="max-w-[85%] p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                💡 Feedback
              </span>
            </div>
            <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
              {item.feedback}
            </p>
          </div>
        </div>
      )}

      {/* divider */}
      <div className="border-b border-dashed border-zinc-200 dark:border-zinc-800 pt-2" />
    </motion.div>
  );
}