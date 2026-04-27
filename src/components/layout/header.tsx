"use client";

import { usePathname } from "next/navigation";
import { AutoRefreshSelect } from "./auto-refresh-select";
import { HealthChip } from "./health-chip";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/analytics": "Analytics",
  "/graficos": "Gráficos",
  "/admin/users": "Administración · Usuarios",
  "/admin/endpoints": "Administración · Endpoints",
  "/admin/modules": "Administración · Módulos",
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/m/")) {
    const [, , area, modulo] = pathname.split("/");
    if (area && modulo) return `${area} · ${modulo}`;
  }
  return "DC Hub";
}

export function Header() {
  const pathname = usePathname();
  const title = titleFor(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-surface-border bg-surface/80 px-6 backdrop-blur theme-transition">
      <h1 className="text-sm font-semibold tracking-tight text-content">{title}</h1>
      <div className="flex items-center gap-3">
        <AutoRefreshSelect />
        <HealthChip />
        <div className="mx-1 h-6 w-px bg-surface-border" />
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-surface-border" />
        <UserMenu />
      </div>
    </header>
  );
}
