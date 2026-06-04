import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  opacity: number;
  setTheme: (theme: Theme) => void;
  setOpacity: (opacity: number) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  opacity: 1,
  setTheme: () => null,
  setOpacity: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const opacityStorageKey = "vite-ui-opacity";

  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  const [opacity, setOpacityState] = useState<number>(() => {
    const saved = localStorage.getItem(opacityStorageKey);

    if (!saved) return 1;

    const value = Number(saved);

    return Number.isNaN(value) ? 1 : value;
  });

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-opacity",
      opacity.toString(),
    );
  }, [opacity]);

  const value: ThemeProviderState = {
    theme,
    opacity,

    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setThemeState(theme);
    },

    setOpacity: (opacity: number) => {
      localStorage.setItem(opacityStorageKey, opacity.toString());

      setOpacityState(opacity);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
