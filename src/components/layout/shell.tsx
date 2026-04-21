"use client";

import { AutoRefreshProvider } from "@/lib/shell/auto-refresh";
import type { ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <AutoRefreshProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </AutoRefreshProvider>
  );
}
