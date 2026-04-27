"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { type NavItem, visibleNavItems } from "@/lib/nav-registry";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const [collapsed, setCollapsed] = useLocalStorage<boolean>("hub:sidebar-collapsed", false);
  const pathname = usePathname();
  const session = useSession();
  const items = visibleNavItems({
    role: session.data?.user.role,
    areas: session.data?.user.areas ?? [],
    moduleGrants: session.data?.user.moduleGrants ?? [],
  });

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-surface-border bg-surface text-content theme-transition",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-surface-border",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-penguin-violet text-[11px] font-bold text-white shadow-sm">
            DC
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-content">DC Hub</span>
              <span className="text-[10px] text-content-muted">Penguin Digital</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item: NavItem) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-penguin-violet/10 text-penguin-violet dark:bg-penguin-violet/20"
                  : "text-content-soft hover:bg-surface-soft hover:text-content",
              )}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <span className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-penguin-violet" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-penguin-violet" : "text-content-muted",
                )}
              />
              {!collapsed && <span className="truncate font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse */}
      <button
        type="button"
        onClick={() => setCollapsed((p) => !p)}
        className={cn(
          "flex items-center gap-2 border-t border-surface-border px-4 py-3 text-xs text-content-muted transition-colors hover:bg-surface-soft hover:text-content",
          collapsed && "justify-center px-0",
        )}
        title={collapsed ? "Expandir" : "Colapsar"}
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronsLeft className="h-4 w-4" />
            <span>Colapsar</span>
          </>
        )}
      </button>
    </aside>
  );
}
