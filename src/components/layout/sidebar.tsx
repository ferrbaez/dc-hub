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
  const role = session.data?.user.role;
  const areas = session.data?.user.areas ?? [];
  const items = visibleNavItems({ role, areas });

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-penguin-obsidian-soft/40 bg-penguin-obsidian text-slate-300 transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-penguin-obsidian-soft/40",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-penguin-violet text-[11px] font-bold text-white shadow-sm">
            WH
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-white">DC Hub</span>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item: NavItem) => {
          const active = !item.disabled && pathname === item.href;
          const Icon = item.icon;
          const baseClass = cn(
            "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            collapsed && "justify-center px-0",
            item.disabled
              ? "cursor-not-allowed text-slate-600"
              : active
                ? "bg-penguin-obsidian-soft text-white"
                : "text-slate-400 hover:bg-penguin-obsidian-soft/60 hover:text-white",
          );
          const content = (
            <>
              {active && (
                <span className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-penguin-lime" />
              )}
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-penguin-lime")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.disabled && (
                <span className="ml-auto rounded-full bg-penguin-obsidian-soft/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Soon
                </span>
              )}
            </>
          );
          if (item.disabled) {
            return (
              <div key={item.href} className={baseClass} title={collapsed ? item.label : undefined}>
                {content}
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={baseClass}
              title={collapsed ? item.label : undefined}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((p) => !p)}
        className={cn(
          "flex items-center gap-2 border-t border-penguin-obsidian-soft/40 px-4 py-3 text-xs text-slate-500 transition-colors hover:bg-penguin-obsidian-soft/40 hover:text-white",
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
