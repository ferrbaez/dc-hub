"use client";

import { type ThemePreference, useTheme } from "@/lib/theme/provider";
import { trpc } from "@/lib/trpc/client";
import { Monitor, Moon, Sun } from "lucide-react";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  // Persist to DB (best-effort; if it fails we still keep the localStorage override).
  const persist = trpc.core.users.setThemePreference.useMutation();

  function pick(p: ThemePreference) {
    setPreference(p);
    persist.mutate({ preference: p });
  }

  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-surface-border bg-surface-soft p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => pick(value)}
            className={`grid h-6 w-6 place-items-center rounded transition-colors ${
              active ? "bg-surface text-content shadow-sm" : "text-content-muted hover:text-content"
            }`}
            title={label}
            aria-label={label}
            aria-pressed={active}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
