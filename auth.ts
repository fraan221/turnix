import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./lib/prisma";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import { headers } from "next/headers";

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
      name: "Credentials",
      async authorize(credentials) {
        const ip = headers().get("x-forwarded-for") ?? "127.0.0.1";
        const now = Date.now();

        const attempt = loginAttempts.get(ip);
        if (attempt && now < attempt.lockUntil) {
          const timeLeft = Math.ceil((attempt.lockUntil - now) / 1000 / 60);
          throw new CredentialsSignin(
            `Demasiados intentos fallidos desde esta IP. Intenta de nuevo en ${timeLeft} minutos.`
          );
        }

        if (!credentials?.email || !credentials.password) {
          throw new CredentialsSignin("Faltan el email o la contraseña.");
        }

        const email = credentials.email as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          const newCount = (attempt?.count || 0) + 1;
          loginAttempts.set(ip, { count: newCount, lockUntil: 0 });
          throw new CredentialsSignin(
            "No existe una cuenta con ese correo electrónico."
          );
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordsMatch) {
          const newCount = (attempt?.count || 0) + 1;
          let lockUntil = 0;
          let errorMessage = "La contraseña es incorrecta.";

          if (newCount >= MAX_ATTEMPTS) {
            lockUntil = now + LOCKOUT_PERIOD;
            errorMessage = `Demasiados intentos fallidos. Tu IP ha sido bloqueada por 5 minutos.`;
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
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id;
        token.image = user.image;
        token.slug = (user as any).slug;
      }

      if (trigger === "update" && session) {
        if (session.image) {
          token.image = session.image;
        }
        if (session.slug) {
          token.slug = session.slug;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = token.image as string | null;
        (session.user as any).slug = token.slug;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
