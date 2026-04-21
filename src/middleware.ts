import { authConfig } from "@/lib/auth.config";
import NextAuth from "next-auth";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Match everything except NextAuth API, static assets, images.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)",
  ],
};
