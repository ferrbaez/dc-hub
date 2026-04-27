import { hasModuleAccess } from "@/lib/access";
import type { AreaSlug } from "@/lib/areas";
import { auth } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";

/**
 * Server component wrapper for module pages. Renders the children only if
 * the current user has access to (area, modulo). Otherwise renders a
 * friendly 403. The middleware already redirects unauthenticated users to
 * /login, so we assume there's a session here.
 *
 * Used automatically by `pnpm new:module` generated pages.
 */
export async function RequireModuleAccess({
  area,
  modulo,
  children,
}: {
  area: AreaSlug;
  modulo: string;
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) return null; // middleware should have redirected

  const allowed = hasModuleAccess(
    {
      role: session.user.role,
      areas: session.user.areas ?? [],
      moduleGrants: session.user.moduleGrants ?? [],
    },
    area,
    modulo,
  );

  if (allowed) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="mb-2 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          <h1 className="text-base font-semibold">Acceso restringido</h1>
        </div>
        <p className="text-sm">
          Este módulo es de área <code className="font-mono">{area}</code> y tu cuenta no tiene
          permiso para verlo. Pedile acceso a Willian si lo necesitás.
        </p>
        <p className="mt-3 text-xs text-amber-800/70">
          Módulo:{" "}
          <code className="font-mono">
            {area}/{modulo}
          </code>
        </p>
      </div>
    </div>
  );
}
