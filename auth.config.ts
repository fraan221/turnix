import type { NextAuthConfig } from "next-auth";
import { Role } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: nextUrl }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.nextUrl.pathname.startsWith("/dashboard");
      return true;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.barbershop = token.barbershop as any;
        session.user.image = token.picture as string | null;
        session.user.trialEndsAt = token.trialEndsAt as any;
        session.user.subscription = token.subscription as any;
        session.user.teamMembership = token.teamMembership as any;
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as Role;
      }
      return token;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
