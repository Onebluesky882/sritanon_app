import { ThemeProvider } from "./components/theme-provider";
import AppRouter from "./app-router";
import "./App.css";
const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AppRouter />
    </ThemeProvider>
  );
};
export default App;
