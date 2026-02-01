import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "./auth.config";
import prisma from "./lib/prisma";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

const loginAttempts = new Map<string, { count: number; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_PERIOD = 5 * 60 * 1000;

const config: NextAuthConfig = {
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
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
            `Demasiados intentos fallidos desde esta IP. Intenta de nuevo en ${timeLeft} minutos.`,
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
            "No existe una cuenta con ese correo electrónico.",
          );
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
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
    async jwt({ token, user, trigger }) {
      const userId = user?.id || token.id;

      if (!userId) {
        return token;
      }

      if (user || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            ownedBarbershop: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                teamsEnabled: true,
                address: true,
                description: true,
              },
            },
            teamMembership: {
              include: {
                barbershop: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    image: true,
                    teamsEnabled: true,
                    address: true,
                    description: true,
                    owner: {
                      select: {
                        id: true,
                        trialEndsAt: true,
                        subscription: {
                          select: {
                            status: true,
                            currentPeriodEnd: true,
                            pendingSince: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            subscription: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.picture = dbUser.image;

          token.trialEndsAt = dbUser.trialEndsAt;
          token.subscription = dbUser.subscription
            ? {
                status: dbUser.subscription.status,
                currentPeriodEnd: dbUser.subscription.currentPeriodEnd,
                pendingSince: dbUser.subscription.pendingSince,
              }
            : null;

          token.teamMembership = dbUser.teamMembership
            ? {
                id: dbUser.teamMembership.id,
                barbershopId: dbUser.teamMembership.barbershopId,
                userId: dbUser.teamMembership.userId,
              }
            : null;

          if (dbUser.ownedBarbershop) {
            token.barbershop = dbUser.ownedBarbershop;
          } else if (dbUser.teamMembership?.barbershop) {
            const { owner, ...barbershopData } =
              dbUser.teamMembership.barbershop;
            token.barbershop = barbershopData;
          } else {
            token.barbershop = null;
          }

          if (
            token.role === Role.BARBER &&
            dbUser.teamMembership?.barbershop?.owner
          ) {
            const owner = dbUser.teamMembership.barbershop.owner;

            token.subscription = owner.subscription
              ? {
                  status: owner.subscription.status,
                  currentPeriodEnd: owner.subscription.currentPeriodEnd,
                  pendingSince: owner.subscription.pendingSince,
                }
              : null;
            token.trialEndsAt = owner.trialEndsAt;
          }
        }
      } else {
        if (token.role === Role.BARBER) {
          const team = await prisma.team.findUnique({
            where: { userId: userId },
            select: {
              barbershop: {
                select: {
                  owner: {
                    select: {
                      trialEndsAt: true,
                      subscription: {
                        select: {
                          status: true,
                          currentPeriodEnd: true,
                          pendingSince: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          if (team?.barbershop?.owner) {
            const owner = team.barbershop.owner;
            token.subscription = owner.subscription
              ? {
                  status: owner.subscription.status,
                  currentPeriodEnd: owner.subscription.currentPeriodEnd,
                  pendingSince: owner.subscription.pendingSince,
                }
              : null;
            token.trialEndsAt = owner.trialEndsAt;
          } else {
            token.subscription = null;
            token.trialEndsAt = null;
          }
        } else {
          const subscription = await prisma.subscription.findUnique({
            where: { userId: userId },
            select: {
              status: true,
              currentPeriodEnd: true,
              pendingSince: true,
            },
          });

          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { trialEndsAt: true },
          });

          token.subscription = subscription
            ? {
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                pendingSince: subscription.pendingSince,
              }
            : null;

          token.trialEndsAt = user?.trialEndsAt || null;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.barbershop = token.barbershop;
        session.user.image = token.picture as string | null;
        session.user.trialEndsAt = token.trialEndsAt;
        session.user.subscription = token.subscription;
        session.user.teamMembership = token.teamMembership;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
