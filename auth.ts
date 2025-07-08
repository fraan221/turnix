import NextAuth, { type NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (passwordsMatch) {
          return user;
        }

        return null;
      },
    }),
    // Dejamos Google aquí, comentado, listo para ser activado en el futuro.
    // Google({ ... })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
  authorized({ auth, request: { nextUrl } }) {
    const isLoggedIn = !!auth?.user;
    const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
    if (isOnDashboard) {
      if (isLoggedIn) return true;
      return false; 
    }
    return true;
  },
  async jwt({ token, user }) {
      if (user) { 
        token.barbershopName = (user as any).barbershopName;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.barbershopName && session.user) {
        (session.user as any).barbershopName = token.barbershopName;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);