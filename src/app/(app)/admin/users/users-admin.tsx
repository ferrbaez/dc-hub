"use client";

import { AREA_LABELS, AREA_SLUGS, type AreaSlug } from "@/lib/areas";
import { trpc } from "@/lib/trpc/client";
import { Loader2, PencilLine, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { UserModal, type UserModalValue } from "./user-modal";

type UserRow = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
  areas: { area: AreaSlug; mode: "dev" | "viewer" }[];
  moduleGrants: string[];
};

export function UsersAdmin() {
  const utils = trpc.useUtils();
  const usersQuery = trpc.core.admin["users.list"].useQuery();
  const modulesQuery = trpc.core.admin["modules.list-slugs"].useQuery();

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);

  const createMut = trpc.core.admin["users.create"].useMutation({
    onSuccess: () => {
      setCreating(false);
      utils.core.admin["users.list"].invalidate();
    },
  });
  const updateMut = trpc.core.admin["users.update"].useMutation({
    onSuccess: () => {
      setEditing(null);
      utils.core.admin["users.list"].invalidate();
    },
  });
  const deleteMut = trpc.core.admin["users.delete"].useMutation({
    onSuccess: () => utils.core.admin["users.list"].invalidate(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-content-soft">
          {usersQuery.data ? `${usersQuery.data.length} usuario(s)` : "Cargando..."}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-penguin-violet px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-penguin-violet/90"
        >
          <Plus className="h-4 w-4" />
          Crear usuario
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-surface-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-soft text-left text-xs uppercase tracking-wider text-content-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Rol</th>
              <th className="px-3 py-2 font-medium">Áreas</th>
              <th className="px-3 py-2 font-medium">Grants</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {usersQuery.data?.map((rawUser) => {
              const u: UserRow = {
                id: rawUser.id,
                email: rawUser.email,
                displayName: rawUser.displayName,
                role: rawUser.role === "admin" ? "admin" : "user",
                areas: rawUser.areas,
                moduleGrants: rawUser.moduleGrants,
              };
              return (
                <tr key={u.id} className="hover:bg-surface-soft">
                  <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                  <td className="px-3 py-2">{u.displayName}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-penguin-violet/10 text-penguin-violet"
                          : "bg-surface-muted text-content-soft"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {u.areas.length === 0 && (
                        <span className="text-xs text-content-muted">—</span>
                      )}
                      {u.areas.map((a) => (
                        <span
                          key={a.area}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            a.mode === "dev"
                              ? "bg-penguin-lime/15 text-emerald-700"
                              : "bg-surface-muted text-content-soft"
                          }`}
                          title={`${AREA_LABELS[a.area]} (${a.mode})`}
                        >
                          {a.area} · {a.mode}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {u.moduleGrants.length === 0 && (
                        <span className="text-xs text-content-muted">—</span>
                      )}
                      {u.moduleGrants.map((g) => (
                        <span
                          key={g}
                          className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] text-amber-800"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(u)}
                        className="rounded p-1.5 text-content-muted hover:bg-surface-muted hover:text-content"
                        title="Editar"
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Borrar usuario ${u.email}? Esta acción es permanente.`)) {
                            deleteMut.mutate({ id: u.id });
                          }
                        }}
                        className="rounded p-1.5 text-content-muted hover:bg-red-50 hover:text-red-600"
                        title="Borrar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {usersQuery.isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-content-muted">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <UserModal
          mode="create"
          availableAreas={[...AREA_SLUGS]}
          availableModules={modulesQuery.data ?? []}
          onCancel={() => setCreating(false)}
          onSubmit={(value) => {
            if (!value.password) return;
            createMut.mutate({
              email: value.email,
              displayName: value.displayName,
              password: value.password,
              role: value.role,
              areas: value.areas,
              moduleGrants: value.moduleGrants,
            });
          }}
          submitting={createMut.isPending}
          error={createMut.error?.message}
        />
      )}

      {editing && (
        <UserModal
          mode="edit"
          initial={editing}
          availableAreas={[...AREA_SLUGS]}
          availableModules={modulesQuery.data ?? []}
          onCancel={() => setEditing(null)}
          onSubmit={(value) => {
            updateMut.mutate({
              id: editing.id,
              data: {
                email: value.email,
                displayName: value.displayName,
                role: value.role,
                areas: value.areas,
                moduleGrants: value.moduleGrants,
              },
            });
          }}
          submitting={updateMut.isPending}
          error={updateMut.error?.message}
        />
      )}
    </div>
  );
}

export type { UserModalValue };
