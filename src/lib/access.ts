/**
 * Access checks shared between tRPC procedures, page guards, and the sidebar.
 *
 * Two granularities:
 *   - Area: user has the area assigned (regardless of mode), OR has a grant
 *     for any module within that area. Admins always pass.
 *   - Module: user has the area, OR has a grant for that exact module slug.
 *     Admins always pass.
 *
 * The "area access" check is intentionally broader than "module access" so
 * that a user with grant `mining/efficiency` can call cross-module `core.*`
 * endpoints that require area `mining`. The sidebar narrows back to module-
 * level so they only see what they were explicitly granted.
 */
import type { AreaSlug } from "@/lib/areas";

export type AccessUser = {
  role?: string;
  areas: AreaSlug[];
  moduleGrants: string[]; // "<area>/<modulo>"
};

export function hasAreaAccess(user: AccessUser, area: AreaSlug): boolean {
  if (user.role === "admin") return true;
  if (user.areas.includes(area)) return true;
  return user.moduleGrants.some((slug) => slug.startsWith(`${area}/`));
}

export function hasAnyAreaAccess(user: AccessUser, areas: readonly AreaSlug[]): boolean {
  if (user.role === "admin") return true;
  return areas.some((a) => hasAreaAccess(user, a));
}

export function hasModuleAccess(user: AccessUser, area: AreaSlug, modulo: string): boolean {
  if (user.role === "admin") return true;
  if (user.areas.includes(area)) return true;
  return user.moduleGrants.includes(`${area}/${modulo}`);
}
