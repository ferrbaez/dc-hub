import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-penguin-obsidian p-6">
      {/* Subtle lime glow top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-penguin-lime/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-12%] left-[-10%] h-[380px] w-[380px] rounded-full bg-penguin-violet/20 blur-3xl"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
