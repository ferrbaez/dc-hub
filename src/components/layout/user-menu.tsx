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
    return <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />;
  }

  const name = session.user.name ?? session.user.email ?? "Usuario";
  const email = session.user.email ?? "";
  const initials = initialsOf(session.user.name ?? session.user.email);

  return (
    <div className="flex items-center gap-2.5">
      <div className="hidden flex-col items-end text-right text-[11px] leading-tight md:flex">
        <span className="font-medium text-penguin-obsidian">{name}</span>
        <span className="text-penguin-cool-gray">{email}</span>
      </div>
      <div className="grid h-7 w-7 place-items-center rounded-full bg-penguin-violet text-[11px] font-semibold text-white">
        {initials}
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-penguin-obsidian"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
