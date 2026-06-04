import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  History,
  PlusCircle,
  BrainCircuit,
  UserCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Mock Data สำหรับเมนู
const mainMenus = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
  { id: "interview", label: "Mock Interview", icon: MessageSquare, active: false },
  { id: "resume", label: "Resume Analysis", icon: FileText, active: false },
  { id: "history", label: "Past Sessions", icon: History, active: false },
];

const recentInterviews = [
  { id: 1, title: "Frontend Engineer - Google" },
  { id: 2, title: "Fullstack Developer - SCB" },
  { id: 3, title: "Data Scientist - Line" },
];

export const AppSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen border-r bg-zinc-50/50 dark:bg-zinc-950 flex flex-col font-sans transition-all duration-300 ${
        isCollapsed ? "w-[80px]" : "w-[20%] min-w-[240px]"
      }`}
    >
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="text-white w-5 h-5" />
          </div>

          {!isCollapsed && (
            <h1 className="font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
              AI Interview <span className="text-indigo-600">Pro</span>
            </h1>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed((v) => !v)}
          className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
        >
          {isCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>
      </div>

      {/* NEW SESSION */}
      <div className="px-3 mb-6">
        <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm">
          <PlusCircle size={18} />
          {!isCollapsed && <span className="text-sm font-medium">New Interview</span>}
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-2 space-y-1">
        {!isCollapsed && (
          <p className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
            Menu
          </p>
        )}

        {mainMenus.map((item) => (
          <button
            key={item.id}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group justify-center ${
              item.active
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <item.icon size={20} />

            {!isCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </button>
        ))}

        {/* RECENT */}
        {!isCollapsed && (
          <div className="mt-8">
            <p className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
              Recent Sessions
            </p>

            <div className="space-y-1">
              {recentInterviews.map((session) => (
                <button
                  key={session.id}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg truncate"
                >
                  # {session.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* FOOTER */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg">
          <Settings size={20} />
          {!isCollapsed && <span className="text-sm">Settings</span>}
        </button>

        <div className="flex items-center gap-3 px-3 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
          <UserCircle className="w-8 h-8 text-zinc-500" />
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">Somyot AI</p>
              <p className="text-[10px] text-zinc-500 truncate">Pro Account</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};