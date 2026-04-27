"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

function initialsOf(source: string | null | undefined): string {
  if (!source) return "?";
  return (
    source
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user) {
    return <div className="h-7 w-7 animate-pulse rounded-full bg-surface-muted" />;
  }

  const name = session.user.name ?? session.user.email ?? "Usuario";
  const email = session.user.email ?? "";
  const role = session.user.role ?? "user";
  const initials = initialsOf(session.user.name ?? session.user.email);

  return (
    <div className="flex items-center gap-2.5">
      <div className="hidden flex-col items-end text-right text-[11px] leading-tight md:flex">
        <span className="font-medium text-content">{name}</span>
        <span className="text-content-muted">
          {email}
          {role === "admin" && (
            <span className="ml-1 rounded bg-penguin-violet/10 px-1 text-[9px] font-semibold uppercase tracking-wider text-penguin-violet dark:bg-penguin-violet/20">
              admin
            </span>
          )}
        </span>
      </div>
      <div className="grid h-8 w-8 place-items-center rounded-full bg-penguin-violet text-[11px] font-semibold text-white shadow-sm">
        {initials}
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="grid h-8 w-8 place-items-center rounded-md border border-surface-border bg-surface text-content-muted transition-colors hover:bg-surface-soft hover:text-content"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
