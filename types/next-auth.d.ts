import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string | null;
    slug?: string | null;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string | null;
      slug?: string | null;
    } & DefaultSession["user"];
  }
}
