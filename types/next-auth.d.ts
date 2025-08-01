import type { DefaultSession, User } from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";
import { Role } from "@prisma/client";
declare module "next-auth" {
  interface User {
    role?: Role | null;
  }

  interface Session {
    user: {
      id: string;
      role?: Role | null;
      barbershop?: {
        slug: string;
      } | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    id: string;
    role?: Role | null;
    barbershop?: {
      slug: string;
    } | null;
  }
}
