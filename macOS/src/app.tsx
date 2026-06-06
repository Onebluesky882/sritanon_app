import { ThemeProvider } from "./components/theme-provider";
import AppRouter from "./app-router";
import "./App.css";
import { PermissionGate } from "./components/PermissionGate";
const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <PermissionGate>
        <AppRouter />
      </PermissionGate>
    </ThemeProvider>
  );
};
export default App;
