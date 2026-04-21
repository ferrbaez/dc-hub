"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { type ReactNode, createContext, useContext, useMemo } from "react";

export type AutoRefreshValue = "off" | "1m" | "5m" | "30m";

const INTERVAL_MS: Record<AutoRefreshValue, number | false> = {
  off: false,
  "1m": 60_000,
  "5m": 5 * 60_000,
  "30m": 30 * 60_000,
};

export const AUTO_REFRESH_OPTIONS: { value: AutoRefreshValue; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "1m", label: "1 min" },
  { value: "5m", label: "5 min" },
  { value: "30m", label: "30 min" },
];

type Ctx = {
  value: AutoRefreshValue;
  setValue: (v: AutoRefreshValue) => void;
  intervalMs: number | false;
};

const AutoRefreshContext = createContext<Ctx | null>(null);

export function AutoRefreshProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useLocalStorage<AutoRefreshValue>("hub:auto-refresh", "off");
  const ctx = useMemo<Ctx>(
    () => ({ value, setValue, intervalMs: INTERVAL_MS[value] }),
    [value, setValue],
  );
  return <AutoRefreshContext.Provider value={ctx}>{children}</AutoRefreshContext.Provider>;
}

export function useAutoRefresh(): Ctx {
  const ctx = useContext(AutoRefreshContext);
  if (!ctx) throw new Error("useAutoRefresh must be used within AutoRefreshProvider");
  return ctx;
}
