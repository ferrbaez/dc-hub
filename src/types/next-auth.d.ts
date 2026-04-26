import type { AreaSlug } from "@/lib/areas";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      areas: AreaSlug[];
    } & DefaultSession["user"];
  }
  interface User {
    role?: string;
    areas?: AreaSlug[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    areas?: AreaSlug[];
  }
}
