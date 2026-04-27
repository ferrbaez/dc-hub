import { auth } from "@/lib/auth";
import { getLocalDb } from "@/lib/db/local";
import { ThemeInlineScript } from "@/lib/theme/inline-script";
import { type ThemePreference, ThemeProvider } from "@/lib/theme/provider";
import { TrpcProvider } from "@/lib/trpc/client";
import { users } from "@/schema/local";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "DC Hub",
  description: "Operations hub for BTC mining and data-center infrastructure",
};

async function getInitialThemePreference(): Promise<ThemePreference> {
  try {
    const session = await auth();
    if (!session?.user.id) return "system";
    const db = getLocalDb();
    const [row] = await db
      .select({ pref: users.themePreference })
      .from(users)
      .where(eq(users.id, BigInt(session.user.id)))
      .limit(1);
    const pref = row?.pref;
    if (pref === "light" || pref === "dark" || pref === "system") return pref;
    return "system";
  } catch {
    return "system";
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialPreference = await getInitialThemePreference();
  return (
    <html lang="es" data-theme={initialPreference}>
      <head>
        <ThemeInlineScript />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-penguin-obsidian dark:text-slate-100">
        <ThemeProvider initialPreference={initialPreference}>
          <SessionProvider>
            <TrpcProvider>{children}</TrpcProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
