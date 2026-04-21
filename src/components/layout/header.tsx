"use client";

import { usePathname } from "next/navigation";
import { AutoRefreshSelect } from "./auto-refresh-select";
import { HealthChip } from "./health-chip";
import { UserMenu } from "./user-menu";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/analytics": "Analytics",
  "/rentabilidad": "Rentabilidad",
  "/consumo": "Consumo",
  "/slas": "SLAs",
  "/mantenimientos": "Mantenimientos",
};

export function Header() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <h1 className="text-sm font-semibold text-penguin-obsidian">{title}</h1>
      <div className="flex items-center gap-3">
        <AutoRefreshSelect />
        <HealthChip />
        <div className="mx-1 h-6 w-px bg-slate-200" />
        <UserMenu />
      </div>
    </header>
  );
}
