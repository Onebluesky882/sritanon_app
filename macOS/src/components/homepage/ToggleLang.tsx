import { Globe, ChevronDown } from "lucide-react";

const LANGUAGES = [
  { code: "th", label: "ไทย" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本" },
];

type LanguageCode = "th" | "en" | "zh" | "ja";

type Props = {
  open: boolean;
  language: LanguageCode;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLanguage: (lang: LanguageCode) => void;
};

export function LanguageDropdown({
  language,
  setLanguage,
  setOpen,
  open,
}: Props) {
  const current = LANGUAGES.find((l) => l.code === language);
 
  return (
    <div className="relative">
      {/* BUTTON */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg text-xs font-bold"
      >
        <Globe size={14} className="text-zinc-400" />
        <span>{current?.label}</span>
        <ChevronDown size={14} className="text-zinc-400" />
      </button>

      {/* DROPDOWN */}
      {open && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0"
            onClick={() => setOpen(false)}
          />

          <div className="absolute mt-2 w-full bg-white dark:bg-zinc-900 border rounded-xl shadow-lg overflow-hidden z-50">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code as LanguageCode);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 ${language === l.code
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                  : ""
                  }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}