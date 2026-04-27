/**
 * Sidebar navigation registry.
 *
 * Items with `requiredArea` are filtered by the user's areas (or shown to
 * admins). Items without `requiredArea` are visible to anyone logged in.
 *
 * The `pnpm new:module` generator appends entries here automatically — do
 * not reorder existing items by hand or the generator's anchor will drift.
 */
import type { AccessUser } from "@/lib/access";
import { hasModuleAccess } from "@/lib/access";
import type { AreaSlug } from "@/lib/areas";
import {
  LayoutDashboard,
  LineChart,
  type LucideIcon,
  MessageSquareText,
  ShieldCheck,
  Wrench, // default icon used by `pnpm new:module` for generated entries
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** If set, only users with this area (or admins) see the item. */
  requiredArea?: AreaSlug;
  /** Module slug for grant-based access. Set automatically for module pages. */
  moduleSlug?: string;
  /** If true, only users with role=admin see the item. */
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: MessageSquareText },
  { href: "/graficos", label: "Gráficos", icon: LineChart },
  { href: "/admin/users", label: "Admin", icon: ShieldCheck, adminOnly: true },
  // <pnpm:new-module:nav-anchor> — do not remove. The generator inserts module nav items above this line.
];

/**
 * Filter the nav for a given session. Admins see everything.
 * Module-bound items respect both area membership and per-module grants.
 */
export function visibleNavItems(user: AccessUser): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return user.role === "admin";
    if (!item.requiredArea) return true;
    if (user.role === "admin") return true;
    if (item.moduleSlug) {
      const [, modulo] = item.moduleSlug.split("/");
      if (!modulo) return user.areas.includes(item.requiredArea);
      return hasModuleAccess(user, item.requiredArea, modulo);
    }
    return user.areas.includes(item.requiredArea);
  });
}
