/**
 * Sidebar navigation registry.
 *
 * Items with `requiredArea` are filtered by the user's areas (or shown to
 * admins). Items without `requiredArea` are visible to anyone logged in.
 *
 * The `pnpm new:module` generator appends entries here automatically — do
 * not reorder existing items by hand or the generator's anchor will drift.
 */
import type { AreaSlug } from "@/lib/areas";
import {
  LayoutDashboard,
  LineChart,
  type LucideIcon,
  MessageSquareText,
  Wrench, // default icon used by `pnpm new:module` for generated entries
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** If set, only users with this area (or admins) see the item. */
  requiredArea?: AreaSlug;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: MessageSquareText },
  { href: "/graficos", label: "Gráficos", icon: LineChart },
  // <pnpm:new-module:nav-anchor> — do not remove. The generator inserts module nav items above this line.
];

/**
 * Filter the nav for a given session. Admins see everything.
 */
export function visibleNavItems(opts: {
  role: string | undefined;
  areas: AreaSlug[];
}): NavItem[] {
  const { role, areas } = opts;
  return NAV_ITEMS.filter((item) => {
    if (!item.requiredArea) return true;
    if (role === "admin") return true;
    return areas.includes(item.requiredArea);
  });
}
