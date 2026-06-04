import { DetectedQuestion } from "@/types/audio.type";

export function QuestionCard({
  item,
  onAnalyze,
}: {
  item: DetectedQuestion;
  onAnalyze: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase tracking-wider text-blue-600">
          Detected Question
        </span>
        <span className="text-[10px] text-zinc-500">
          {item.timestamp instanceof Date
            ? item.timestamp.toLocaleTimeString()
            : new Date(item.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <p className="text-sm font-medium mb-2">{item.question}</p>

      <p className="text-xs text-zinc-500 line-clamp-3 mb-3">
        {item.transcript}
      </p>

      {!item.analyzed ? (
        <button
          onClick={() => onAnalyze(item.id)}
          className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold"
        >
          Analyze Question
        </button>
      ) : (
        <span className="text-xs font-bold text-green-600">
          ✓ Analyzed
        </span>
      )}
    </div>
  );
}