"use client";

import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!res || res.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-penguin-obsidian-soft/50 bg-white p-6 shadow-2xl shadow-black/40">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-penguin-violet text-xs font-bold text-white">
          WH
        </div>
        <div>
          <h1 className="text-base font-semibold text-penguin-obsidian">DC Hub</h1>
          <p className="text-xs text-penguin-cool-gray">Iniciar sesión para continuar</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-penguin-obsidian">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-penguin-obsidian placeholder:text-slate-400 focus:border-penguin-violet focus:outline-none focus:ring-1 focus:ring-penguin-violet/40"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-xs font-medium text-penguin-obsidian"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-penguin-obsidian placeholder:text-slate-400 focus:border-penguin-violet focus:outline-none focus:ring-1 focus:ring-penguin-violet/40"
          />
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-penguin-obsidian text-sm font-medium text-white transition-colors hover:bg-penguin-obsidian-soft disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar
        </button>
      </form>

      <p className="mt-5 text-center text-[11px] text-penguin-cool-gray">
        Los usuarios se crean por CLI:{" "}
        <code className="rounded bg-penguin-cool-bg px-1 py-0.5 text-[10px]">pnpm user:create</code>
      </p>
    </div>
  );
}
