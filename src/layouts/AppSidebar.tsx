import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  History,
  PlusCircle,
  BrainCircuit,
  UserCircle,
} from "lucide-react";

// Mock Data สำหรับเมนู
const mainMenus = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
  {
    id: "interview",
    label: "Mock Interview",
    icon: MessageSquare,
    active: false,
  },
  { id: "resume", label: "Resume Analysis", icon: FileText, active: false },
  { id: "history", label: "Past Sessions", icon: History, active: false },
];

const recentInterviews = [
  { id: 1, title: "Frontend Engineer - Google" },
  { id: 2, title: "Fullstack Developer - SCB" },
  { id: 3, title: "Data Scientist - Line" },
];

export const AppSidebar = () => {
  return (
    <aside className="w-[20%] min-w-[240px] h-screen border-r bg-zinc-50/50 dark:bg-zinc-950 flex flex-col font-sans">
      {/* 1. App Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <BrainCircuit className="text-white w-5 h-5" />
        </div>
        <h1 className="font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
          AI Interview <span className="text-indigo-600">Pro</span>
        </h1>
      </div>

      {/* 2. New Session Button */}
      <div className="px-4 mb-6">
        <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98]">
          <PlusCircle size={18} />
          <span className="text-sm font-medium">New Interview</span>
        </button>
      </div>

      {/* 3. Main Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
          Menu
        </p>
        {mainMenus.map((item) => (
          <button
            key={item.id}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
              item.active
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <item.icon
              size={20}
              className={
                item.active
                  ? "text-indigo-600"
                  : "text-zinc-500 group-hover:text-zinc-800"
              }
            />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}

        {/* 4. Recent Section */}
        <div className="mt-8">
          <p className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
            Recent Sessions
          </p>
          <div className="space-y-1">
            {recentInterviews.map((session) => (
              <button
                key={session.id}
                className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg truncate transition-all"
              >
                # {session.title}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 5. Bottom Footer (User & Settings) */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors">
          <Settings size={20} />
          <span className="text-sm font-medium">Settings</span>
        </button>

        <div className="mt-2 flex items-center gap-3 px-3 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 overflow-hidden">
            <UserCircle className="w-full h-full text-zinc-500" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
              Somyot AI
            </p>
            <p className="text-[10px] text-zinc-500 truncate">Pro Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
