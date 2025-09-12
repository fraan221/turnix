import { cache } from "react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * Obtiene solo los datos básicos del usuario actual.
 * Ideal para la mayoría de las validaciones de sesión y consultas simples.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return prisma.user.findUnique({ where: { id: session.user.id } });
});

/**
 * Obtiene los datos del usuario necesarios para el layout principal del dashboard.
 * Incluye información sobre la suscripción y el período de prueba.
 */
export const getUserForLayout = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
    },
  });
});

/**
 * Obtiene los datos completos del usuario para la página de configuración.
 * Incluye las relaciones de barbería y equipo.
 */
export const getUserForSettings = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: {
        select: { id: true, name: true, slug: true },
      },
      teamMembership: {
        include: {
          barbershop: {
            select: { name: true, slug: true },
          },
        },
      },
    },
  });
});

/**
 * Obtiene los datos del usuario necesarios para la página principal del dashboard.
 * Incluye la membresía a un equipo para la lógica de visualización.
 */
export const getUserForDashboard = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teamMembership: true,
    },
  });
});

/**
 * Obtiene el usuario actual y la información esencial de su barbería.
 * Usado en páginas que dependen del rol y de la configuración de la barbería, como la lista de clientes.
 */
export const getCurrentUserWithBarbershop = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: {
        select: {
          id: true,
          teamsEnabled: true,
        },
      },
      teamMembership: {
        select: {
          barbershopId: true,
        },
      },
    },
  });
});

/**
 * Obtiene los datos de la barbería y su equipo para el rol de OWNER.
 * Devuelve null si el usuario no es OWNER o no se encuentra la barbería.
 */
export const getTeamPageData = cache(async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.OWNER) {
    return null;
  }

  const barbershop = await prisma.barbershop.findUnique({
    where: { ownerId: session.user.id },
    include: {
      teamMembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return barbershop;
});
