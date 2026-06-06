import { Routes, Route } from "react-router-dom";
import Homepage from "@/pages/homepage";
import SettingsPage from "@/pages/setting";
import RootLayout from "@/layouts/RootLayout";
import ProfilePage from "@/pages/profile.tsx";
import Board from "./pages/board/board";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Homepage />} />

        <Route path="board" element={<Board />} />
        <Route path="settings" element={<SettingsPage />} />

        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
