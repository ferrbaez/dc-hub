"use client";

import { trpc } from "@/lib/trpc/client";
import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

export function ModulesAdmin() {
  const modulesQuery = trpc.core.admin["modules.list"].useQuery();

  return (
    <div className="space-y-4">
      <p className="text-sm text-content-soft">
        {modulesQuery.data ? `${modulesQuery.data.length} módulo(s)` : "Cargando..."}
      </p>

      <div className="overflow-hidden rounded-lg border border-surface-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-soft text-left text-xs uppercase tracking-wider text-content-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Slug</th>
              <th className="px-3 py-2 font-medium">Área</th>
              <th className="px-3 py-2 font-medium">Ruta</th>
              <th className="px-3 py-2 font-medium">Usuarios con acceso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {modulesQuery.data?.map((m) => {
              const unique = Array.from(new Map(m.accessUsers.map((u) => [u.id, u])).values());
              return (
                <tr key={m.slug} className="hover:bg-surface-soft">
                  <td className="px-3 py-2 font-mono text-xs">{m.slug}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-penguin-lime/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700">
                      {m.area}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={m.href}
                      className="inline-flex items-center gap-1 font-mono text-xs text-penguin-violet hover:underline"
                    >
                      {m.href}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {unique.length === 0 ? (
                      <span className="text-xs text-content-muted">nadie</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {unique.map((u) => (
                          <span
                            key={u.id}
                            className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-content"
                            title={`vía ${u.via}`}
                          >
                            {u.email}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {modulesQuery.isLoading && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-content-muted">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                </td>
              </tr>
            )}
            {!modulesQuery.isLoading && (modulesQuery.data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-12 text-center text-sm text-content-muted">
                  Todavía no hay módulos creados. Usá{" "}
                  <code className="font-mono">pnpm new:module &lt;area&gt;/&lt;nombre&gt;</code>{" "}
                  para arrancar el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
