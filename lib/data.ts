import { cache } from "react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";
import { unstable_cache as nextCache } from "next/cache";

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
      subscription: {
        include: {
          discountCode: true,
        },
      },
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
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
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
              address: true,
              description: true,
            },
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
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
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

const barberProfileQuery = Prisma.validator<Prisma.BarbershopDefaultArgs>()({
  include: {
    services: {
      orderBy: {
        name: "asc",
      },
    },
    owner: {
      include: {
        workingHours: {
          include: {
            blocks: true,
          },
          orderBy: {
            dayOfWeek: "asc",
          },
        },
      },
    },
    teamMembers: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    },
  },
});

export type BarbershopWithDetails = Prisma.BarbershopGetPayload<
  typeof barberProfileQuery
>;

export const getCachedBarberProfile = (slug: string) =>
  nextCache(
    async () => {
      console.log(`[Cache MISS] Obteniendo perfil completo para: ${slug}`);
      const barbershop = await prisma.barbershop.findUnique({
        where: { slug },
        include: barberProfileQuery.include,
      });
      return barbershop;
    },
    [`barber-profile-${slug}`],
    {
      tags: [`barber-profile:${slug}`],
      revalidate: 3600,
    }
  )();

/**
 * Obtiene la disponibilidad dinámica (turnos y bloqueos) de un barbero para un rango de fechas.
 * NO SE CACHEA, para asegurar que la disponibilidad siempre esté actualizada en tiempo real.
 */
export const getBarberAvailability = async (
  barberId: string,
  startDate: Date,
  endDate: Date
) => {
  console.log(
    `[Real-Time] Obteniendo disponibilidad para barbero: ${barberId}`
  );
  const bookings = await prisma.booking.findMany({
    where: {
      barberId: barberId,
      status: {
        in: ["SCHEDULED", "COMPLETED"],
      },
      startTime: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      startTime: true,
      service: {
        select: {
          durationInMinutes: true,
        },
      },
    },
  });

  const timeBlocks = await prisma.timeBlock.findMany({
    where: {
      barberId: barberId,
      startTime: {
        lt: endDate,
      },
      endTime: {
        gte: startDate,
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  return { bookings, timeBlocks };
};
