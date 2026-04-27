"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "hub:theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyClass(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({
  children,
  initialPreference = "system",
}: {
  children: ReactNode;
  initialPreference?: ThemePreference;
}) {
  // Hydrate from localStorage if present (per-device override). Server props
  // come from the user's DB-stored preference; localStorage wins after first
  // explicit change so a user can flip on a single laptop without affecting
  // the saved default.
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    initialPreference === "system" ? (systemPrefersDark() ? "dark" : "light") : initialPreference,
  );

  // On mount only — read localStorage override. We deliberately don't depend
  // on `preference` here; subsequent changes go through `setPreference`.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only effect
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (stored && stored !== preference) {
      setPreferenceState(stored);
    }
    const next: ResolvedTheme =
      (stored ?? preference) === "system"
        ? systemPrefersDark()
          ? "dark"
          : "light"
        : ((stored ?? preference) as ResolvedTheme);
    setResolved(next);
    applyClass(next);
  }, []);

  // Listen to system theme changes when preference is "system".
  useEffect(() => {
    if (preference !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next: ResolvedTheme = mql.matches ? "dark" : "light";
      setResolved(next);
      applyClass(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    localStorage.setItem(STORAGE_KEY, p);
    const next: ResolvedTheme = p === "system" ? (systemPrefersDark() ? "dark" : "light") : p;
    setResolved(next);
    applyClass(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
