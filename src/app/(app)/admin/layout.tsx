import { auth } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const TABS = [
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/endpoints", label: "Endpoints" },
  { href: "/admin/modules", label: "Módulos" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <h1 className="text-base font-semibold">Acceso restringido</h1>
          </div>
          <p className="text-sm">Esta sección es solo para administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-baseline justify-between border-b border-surface-border pb-3">
        <h1 className="text-lg font-semibold text-content">Administración</h1>
        <nav className="flex gap-1 text-sm">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-md px-3 py-1.5 text-content-soft transition-colors hover:bg-surface-soft hover:text-content"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
