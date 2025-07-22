import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./lib/prisma";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import { headers } from "next/headers";
import { CredentialsSignin } from "next-auth";

const loginAttempts = new Map<string, { count: number; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_PERIOD = 5 * 60 * 1000;

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const ip = headers().get("x-forwarded-for") ?? "127.0.0.1";
        const now = Date.now();
        const attempt = loginAttempts.get(ip);
        if (attempt && now < attempt.lockUntil) {
          const timeLeft = Math.ceil((attempt.lockUntil - now) / 1000 / 60);
          throw new CredentialsSignin(
            `Demasiados intentos. Intenta de nuevo en ${timeLeft} minutos.`
          );
        }
        if (!credentials?.email || !credentials.password) {
          throw new CredentialsSignin("Faltan el email o la contraseña.");
        }
        const email = credentials.email as string;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
          const newCount = (attempt?.count || 0) + 1;
          loginAttempts.set(ip, { count: newCount, lockUntil: 0 });
          throw new CredentialsSignin(
            "El email o la contraseña son incorrectos."
          );
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordsMatch) {
          const newCount = (attempt?.count || 0) + 1;
          let lockUntil = 0;
          let errorMessage = "El email o la contraseña son incorrectos.";

          if (newCount >= MAX_ATTEMPTS) {
            lockUntil = now + LOCKOUT_PERIOD;
            errorMessage = `Demasiados intentos. Tu IP ha sido bloqueada por 5 minutos.`;
          }
          loginAttempts.set(ip, { count: newCount, lockUntil });
          throw new CredentialsSignin(errorMessage);
        }
        loginAttempts.delete(ip);
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const userId = token.sub;

      if (!userId) {
        return token;
      }

      if (user || !token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          include: { ownedBarbershop: { select: { slug: true } } },
        });

        token.id = userId;
        token.role = dbUser?.role;
        token.slug = dbUser?.ownedBarbershop?.slug;
        token.image = dbUser?.image || token.picture;
        token.name = dbUser?.name || token.name;
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.image = token.image as string | null;
        session.user.role = token.role;
        session.user.slug = token.slug;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnCompleteProfile =
        nextUrl.pathname.startsWith("/complete-profile");
      if (isOnDashboard) {
        if (isLoggedIn) {
          if (!userRole) {
            return Response.redirect(new URL("/complete-profile", nextUrl));
          }
          return true;
        }
        return false;
      } else if (isLoggedIn && !userRole && !isOnCompleteProfile) {
        return Response.redirect(new URL("/complete-profile", nextUrl));
      } else if (isLoggedIn && userRole && isOnCompleteProfile) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
