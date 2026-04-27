"use client";

import { trpc } from "@/lib/trpc/client";
import { Copy, Info, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

export function EndpointsAdmin() {
  const endpointsQuery = trpc.core.admin["endpoints.list"].useQuery();
  const [filter, setFilter] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!endpointsQuery.data) return [];
    const q = filter.toLowerCase().trim();
    if (!q) return endpointsQuery.data;
    return endpointsQuery.data.filter(
      (e) =>
        e.path.toLowerCase().includes(q) ||
        e.areas.some((a) => a.toLowerCase().includes(q)) ||
        (e.adminOnly && "admin".includes(q)) ||
        (e.description ?? "").toLowerCase().includes(q),
    );
  }, [endpointsQuery.data, filter]);

  function copyExample(e: { path: string; type: string }) {
    const example =
      e.type === "mutation" ? `trpc.${e.path}.useMutation()` : `trpc.${e.path}.useQuery()`;
    navigator.clipboard.writeText(example).then(() => {
      setCopied(e.path);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-surface-border bg-surface-soft p-3 text-xs text-content-soft">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-penguin-violet" />
        <div className="space-y-1">
          <p>
            <strong className="text-content">Cómo se restringe un endpoint:</strong> el área
            requerida se declara en código (en el archivo del router, vía{" "}
            <code className="rounded bg-surface-muted px-1 font-mono">areaProcedure</code>). Esta
            página la lee automáticamente del meta del procedure.
          </p>
          <p>
            Para asignar áreas a usuarios, andá a <strong className="text-content">Usuarios</strong>
            . La intersección (áreas requeridas) ∩ (áreas del usuario) determina si el call pasa.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-content-soft">
          {endpointsQuery.data
            ? `${filtered.length} de ${endpointsQuery.data.length} endpoint(s)`
            : "Cargando..."}
        </p>
        <input
          type="search"
          placeholder="Filtrar por path, área o descripción"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 w-72 rounded-md border border-surface-border bg-surface px-3 text-sm focus:border-penguin-violet focus:outline-none focus:ring-1 focus:ring-penguin-violet/40"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-soft text-left text-xs uppercase tracking-wider text-content-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Path</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Áreas requeridas</th>
              <th className="px-3 py-2 font-medium">Descripción</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filtered.map((e) => (
              <tr key={e.path} className="hover:bg-surface-soft">
                <td className="px-3 py-2 font-mono text-xs">{e.path}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      e.type === "mutation"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                    }`}
                  >
                    {e.type}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {e.adminOnly ? (
                    <span className="rounded bg-penguin-violet/15 px-1.5 py-0.5 font-mono text-[10px] text-penguin-violet dark:bg-penguin-violet/25">
                      solo admin
                    </span>
                  ) : e.areas.length === 0 ? (
                    <span className="text-xs text-content-muted">cualquier user logueado</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {e.areas.map((a) => (
                        <span
                          key={a}
                          className="rounded bg-penguin-lime/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700 dark:bg-penguin-lime/20 dark:text-emerald-300"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-content">{e.description ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => copyExample(e)}
                    className="rounded p-1.5 text-content-muted hover:bg-surface-muted hover:text-content"
                    title="Copiar uso"
                  >
                    {copied === e.path ? (
                      <span className="text-xs text-emerald-700">✓</span>
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {endpointsQuery.isLoading && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-content-muted">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                </td>
              </tr>
            )}
            {!endpointsQuery.isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-content-muted">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
