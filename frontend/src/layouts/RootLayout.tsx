import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export default function RootLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground">
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
