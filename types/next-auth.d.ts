import type { DefaultSession, User } from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";
import { Role } from "@prisma/client";

interface SubscriptionInfo {
  status: string | null;
  currentPeriodEnd: Date | null;
}

declare module "next-auth" {
  interface User {
    role?: Role | null;
  }

  interface Session {
    user: {
      id: string;
      role?: Role | null;
      barbershop?: {
        name: string;
        slug: string;
      } | null;
      trialEndsAt: Date | null;
      subscription: SubscriptionInfo | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    id: string;
    role?: Role | null;
    barbershop?: {
      name: string;
      slug: string;
    } | null;
    trialEndsAt: Date | null;
    subscription: SubscriptionInfo | null;
  }
}
