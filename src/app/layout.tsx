import { TrpcProvider } from "@/lib/trpc/client";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Willian's Hub",
  description: "Operations hub for BTC mining and data-center infrastructure",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>
          <TrpcProvider>{children}</TrpcProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
