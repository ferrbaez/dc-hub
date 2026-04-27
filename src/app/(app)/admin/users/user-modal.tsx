"use client";

import type { AreaSlug } from "@/lib/areas";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export type UserModalValue = {
  email: string;
  displayName: string;
  password?: string;
  role: "admin" | "user";
  areas: { area: AreaSlug; mode: "dev" | "viewer" }[];
  moduleGrants: string[];
};

type Props = {
  mode: "create" | "edit";
  initial?: Partial<UserModalValue> & { id?: string };
  availableAreas: AreaSlug[];
  availableModules: string[];
  onCancel: () => void;
  onSubmit: (value: UserModalValue) => void;
  submitting?: boolean;
  error?: string;
};

export function UserModal({
  mode,
  initial,
  availableAreas,
  availableModules,
  onCancel,
  onSubmit,
  submitting,
  error,
}: Props) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">(
    (initial?.role as "admin" | "user" | undefined) ?? "user",
  );
  const [areaModes, setAreaModes] = useState<Record<string, "dev" | "viewer" | "none">>(() => {
    const m: Record<string, "dev" | "viewer" | "none"> = {};
    for (const a of availableAreas) m[a] = "none";
    if (initial?.areas) for (const a of initial.areas) m[a.area] = a.mode;
    return m;
  });
  const [grants, setGrants] = useState<string[]>(initial?.moduleGrants ?? []);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onCancel]);

  function toggleGrant(slug: string) {
    setGrants((g) => (g.includes(slug) ? g.filter((s) => s !== slug) : [...g, slug]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) return;
    if (mode === "create" && password.length < 8) return;
    const areas = (Object.entries(areaModes) as [AreaSlug, "dev" | "viewer" | "none"][])
      .filter(([, m]) => m !== "none")
      .map(([area, mode]) => ({ area, mode: mode as "dev" | "viewer" }));
    onSubmit({
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      password: password || undefined,
      role,
      areas,
      moduleGrants: grants,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-3">
          <h2 className="text-base font-semibold text-content">
            {mode === "create" ? "Crear usuario" : "Editar usuario"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-content-muted hover:bg-surface-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5">
          {/* identity */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mode === "edit"}
                className="h-9 w-full rounded-md border border-surface-border px-3 text-sm focus:border-penguin-violet focus:outline-none focus:ring-1 focus:ring-penguin-violet/40 disabled:bg-surface-soft"
              />
            </Field>
            <Field label="Nombre">
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-9 w-full rounded-md border border-surface-border px-3 text-sm focus:border-penguin-violet focus:outline-none focus:ring-1 focus:ring-penguin-violet/40"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={mode === "create" ? "Contraseña (mínimo 8)" : "Contraseña (sin cambiar)"}>
              <input
                type="password"
                required={mode === "create"}
                minLength={mode === "create" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "edit" ? "(no se modifica)" : ""}
                className="h-9 w-full rounded-md border border-surface-border px-3 text-sm focus:border-penguin-violet focus:outline-none focus:ring-1 focus:ring-penguin-violet/40"
              />
            </Field>
            <Field label="Rol">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "user")}
                className="h-9 w-full rounded-md border border-surface-border px-3 text-sm focus:border-penguin-violet focus:outline-none focus:ring-1 focus:ring-penguin-violet/40"
              >
                <option value="user">user</option>
                <option value="admin">admin (acceso total)</option>
              </select>
            </Field>
          </div>

          {/* areas */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
              Áreas
            </h3>
            <p className="mb-2 text-xs text-content-muted">
              <strong>dev</strong> = puede mantener el código del área. <strong>viewer</strong> =
              puede ver y usar la UI/endpoints sin desarrollar.
            </p>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-surface-border p-3">
              {availableAreas.map((a) => (
                <label key={a} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-xs text-content">{a}</span>
                  <select
                    value={areaModes[a] ?? "none"}
                    onChange={(e) =>
                      setAreaModes((m) => ({
                        ...m,
                        [a]: e.target.value as "dev" | "viewer" | "none",
                      }))
                    }
                    className="h-7 rounded border border-surface-border px-2 text-xs"
                  >
                    <option value="none">—</option>
                    <option value="dev">dev</option>
                    <option value="viewer">viewer</option>
                  </select>
                </label>
              ))}
            </div>
          </section>

          {/* module grants */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
              Acceso a módulos específicos
            </h3>
            <p className="mb-2 text-xs text-content-muted">
              Otorga acceso a un módulo concreto sin asignar el área completa.
            </p>
            {availableModules.length === 0 ? (
              <p className="rounded border border-dashed border-surface-border p-3 text-xs text-content-muted">
                No hay módulos creados todavía. Cuando exista algún módulo aparecerá acá.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-surface-border p-3">
                {availableModules.map((slug) => {
                  const active = grants.includes(slug);
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => toggleGrant(slug)}
                      className={`rounded-md px-2 py-1 font-mono text-xs transition-colors ${
                        active
                          ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                          : "bg-surface-soft text-content-soft hover:bg-surface-muted"
                      }`}
                    >
                      {slug}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-surface-border pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-1.5 text-sm text-content-soft hover:bg-surface-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-penguin-violet px-3 py-1.5 text-sm font-medium text-white hover:bg-penguin-violet/90 disabled:opacity-50"
            >
              {submitting ? "Guardando..." : mode === "create" ? "Crear" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-content">{label}</span>
      {children}
    </div>
  );
}
