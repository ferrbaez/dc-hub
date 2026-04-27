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
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-7 shadow-2xl shadow-black/30">
      <div className="mb-7 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-penguin-violet text-sm font-bold text-white shadow-lg shadow-penguin-violet/30">
          DC
        </div>
        <div>
          <h1 className="text-base font-semibold text-penguin-obsidian">DC Hub</h1>
          <p className="text-xs text-penguin-cool-gray">Operaciones del Data Center</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-penguin-obsidian">
            Email corporativo
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@penguin.digital"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-penguin-obsidian placeholder:text-slate-400 focus:border-penguin-violet focus:outline-none focus:ring-2 focus:ring-penguin-violet/20"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium text-penguin-obsidian"
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
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-penguin-obsidian placeholder:text-slate-400 focus:border-penguin-violet focus:outline-none focus:ring-2 focus:ring-penguin-violet/20"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-penguin-violet text-sm font-medium text-white shadow-sm shadow-penguin-violet/30 transition-all hover:bg-penguin-violet/90 hover:shadow-md disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar
        </button>
      </form>

      <p className="mt-6 text-center text-[11px] text-penguin-cool-gray">
        ¿No tenés cuenta? Hablá con Willian.
      </p>
    </div>
  );
}
