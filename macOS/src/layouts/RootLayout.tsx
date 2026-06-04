import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useTheme } from "@/components/theme-provider";

export default function RootLayout() {
  const { opacity } = useTheme();
  return (
    <div className="flex h-screen text-foreground" style={{ opacity }}>
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-auto p-2 ">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
