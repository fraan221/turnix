import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import { Role, WorkShiftType } from "@prisma/client";

type TestLoginScenario =
  | "incomplete-profile"
  | "owner"
  | "owner-with-team"
  | "barber-with-team";

type TeamSetupData = {
  owner: {
    id: string;
    name: string;
    email: string | null;
    role: Role;
    trialEndsAt: Date | null;
  };
  barbershop: {
    id: string;
    name: string;
    slug: string;
  };
  ownerService: {
    id: string;
    name: string;
  };
  ownerTimeBlock: {
    id: string;
  };
  teamMember?: {
    id: string;
    name: string;
    email: string | null;
    role: Role;
    trialEndsAt: Date | null;
    teamMembership: {
      id: string;
      barbershopId: string;
      userId: string;
    };
    service: {
      id: string;
      name: string;
    };
    timeBlock: {
      id: string;
    };
  };
};

async function ensureWorkSchedule(barberId: string) {
  for (const dayOfWeek of [1, 2, 3, 4, 5]) {
    const workingHours = await prisma.workingHours.upsert({
      where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
      update: { isWorking: true },
      create: {
        barberId,
        dayOfWeek,
        isWorking: true,
      },
    });

    await prisma.workScheduleBlock.upsert({
      where: {
        workingHoursId_type: {
          workingHoursId: workingHours.id,
          type: WorkShiftType.MORNING,
        },
      },
      update: {
        startTime: "09:00",
        endTime: "18:00",
      },
      create: {
        workingHoursId: workingHours.id,
        type: WorkShiftType.MORNING,
        startTime: "09:00",
        endTime: "18:00",
      },
    });
  }
}

async function createOwnerSetup(options?: {
  withTeam?: boolean;
}): Promise<TeamSetupData> {
  const withTeam = Boolean(options?.withTeam);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const barbershop = await prisma.barbershop.create({
    data: {
      name: `Barbería E2E ${unique}`,
      slug: `e2e-${unique}`,
      teamsEnabled: withTeam,
      owner: {
        create: {
          name: `Owner E2E ${unique}`,
          email: `owner-e2e-${unique}@turnix.app`,
          emailVerified: new Date(),
          role: Role.OWNER,
          onboardingCompleted: true,
          trialEndsAt,
        },
      },
    },
    include: {
      owner: true,
    },
  });

  const ownerService = await prisma.service.create({
    data: {
      name: `Servicio Owner ${unique}`,
      price: 10000,
      durationInMinutes: 45,
      barberId: barbershop.ownerId,
      barbershopId: barbershop.id,
    },
  });

  await ensureWorkSchedule(barbershop.ownerId);

  const ownerBlockStart = new Date();
  ownerBlockStart.setDate(ownerBlockStart.getDate() + 1);
  ownerBlockStart.setHours(10, 0, 0, 0);
  const ownerBlockEnd = new Date(ownerBlockStart);
  ownerBlockEnd.setHours(11, 0, 0, 0);

  const ownerTimeBlock = await prisma.timeBlock.create({
    data: {
      barberId: barbershop.ownerId,
      startTime: ownerBlockStart,
      endTime: ownerBlockEnd,
      reason: `Bloqueo owner e2e ${unique}`,
    },
  });

  if (!withTeam) {
    return {
      owner: {
        id: barbershop.owner.id,
        name: barbershop.owner.name,
        email: barbershop.owner.email,
        role: Role.OWNER,
        trialEndsAt,
      },
      barbershop: {
        id: barbershop.id,
        name: barbershop.name,
        slug: barbershop.slug,
      },
      ownerService: {
        id: ownerService.id,
        name: ownerService.name,
      },
      ownerTimeBlock: {
        id: ownerTimeBlock.id,
      },
    };
  }

  const teamMemberUser = await prisma.user.create({
    data: {
      name: `Barber E2E ${unique}`,
      email: `barber-e2e-${unique}@turnix.app`,
      emailVerified: new Date(),
      role: Role.BARBER,
      onboardingCompleted: true,
      trialEndsAt,
    },
  });

  const teamMembership = await prisma.team.create({
    data: {
      barbershopId: barbershop.id,
      userId: teamMemberUser.id,
    },
  });

  const teamMemberService = await prisma.service.create({
    data: {
      name: `Servicio Team ${unique}`,
      price: 9000,
      durationInMinutes: 30,
      barberId: teamMemberUser.id,
      barbershopId: barbershop.id,
    },
  });

  await ensureWorkSchedule(teamMemberUser.id);

  const teamBlockStart = new Date();
  teamBlockStart.setDate(teamBlockStart.getDate() + 2);
  teamBlockStart.setHours(11, 0, 0, 0);
  const teamBlockEnd = new Date(teamBlockStart);
  teamBlockEnd.setHours(12, 0, 0, 0);

  const teamTimeBlock = await prisma.timeBlock.create({
    data: {
      barberId: teamMemberUser.id,
      startTime: teamBlockStart,
      endTime: teamBlockEnd,
      reason: `Bloqueo team e2e ${unique}`,
    },
  });

  return {
    owner: {
      id: barbershop.owner.id,
      name: barbershop.owner.name,
      email: barbershop.owner.email,
      role: Role.OWNER,
      trialEndsAt,
    },
    barbershop: {
      id: barbershop.id,
      name: barbershop.name,
      slug: barbershop.slug,
    },
    ownerService: {
      id: ownerService.id,
      name: ownerService.name,
    },
    ownerTimeBlock: {
      id: ownerTimeBlock.id,
    },
    teamMember: {
      id: teamMemberUser.id,
      name: teamMemberUser.name,
      email: teamMemberUser.email,
      role: Role.BARBER,
      trialEndsAt,
      teamMembership: {
        id: teamMembership.id,
        barbershopId: teamMembership.barbershopId,
        userId: teamMembership.userId,
      },
      service: {
        id: teamMemberService.id,
        name: teamMemberService.name,
      },
      timeBlock: {
        id: teamTimeBlock.id,
      },
    },
  };
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error(
      "Error crítico: La variable de entorno AUTH_SECRET no está definida."
    );
    return new NextResponse(
      JSON.stringify({ error: "Configuración del servidor incompleta." }),
      { status: 500 }
    );
  }

  const cookieName = "authjs.session-token";

  try {
    let body: { scenario?: TestLoginScenario } = {};
    try {
      body = (await request.json()) as { scenario?: TestLoginScenario };
    } catch {
      body = {};
    }

    const scenario: TestLoginScenario =
      body.scenario ?? "incomplete-profile";

    const allowedScenarios: TestLoginScenario[] = [
      "incomplete-profile",
      "owner",
      "owner-with-team",
      "barber-with-team",
    ];

    if (!allowedScenarios.includes(scenario)) {
      return new NextResponse(
        JSON.stringify({ error: "Escenario de prueba no soportado." }),
        { status: 400 }
      );
    }

    let tokenPayload: {
      sub: string;
      id?: string;
      name?: string;
      email?: string | null;
      role?: Role | null;
      barbershop?: {
        id: string;
        name: string;
        slug: string;
        image: null;
        address: null;
        description: null;
      } | null;
      teamMembership?: {
        id: string;
        barbershopId: string;
        userId: string;
      } | null;
      trialEndsAt?: Date | null;
      subscription?: null;
    };

    let responseData: Record<string, unknown> = { scenario };

    if (scenario === "incomplete-profile") {
      const newUser = await prisma.user.create({
        data: {
          name: "Usuario de Prueba Programático",
          email: `test-user-${Date.now()}@turnix.app`,
          emailVerified: new Date(),
        },
      });

      tokenPayload = {
        sub: newUser.id,
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: null,
        barbershop: null,
        teamMembership: null,
        trialEndsAt: null,
        subscription: null,
      };

      responseData = {
        ...responseData,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: null,
        },
      };
    } else if (scenario === "owner") {
      const setup = await createOwnerSetup();

      tokenPayload = {
        sub: setup.owner.id,
        id: setup.owner.id,
        name: setup.owner.name,
        email: setup.owner.email,
        role: setup.owner.role,
        barbershop: {
          id: setup.barbershop.id,
          name: setup.barbershop.name,
          slug: setup.barbershop.slug,
          image: null,
          address: null,
          description: null,
        },
        teamMembership: null,
        trialEndsAt: setup.owner.trialEndsAt,
        subscription: null,
      };

      responseData = {
        ...responseData,
        user: {
          id: setup.owner.id,
          name: setup.owner.name,
          email: setup.owner.email,
          role: setup.owner.role,
        },
        barbershop: setup.barbershop,
        ownerService: setup.ownerService,
        ownerTimeBlock: setup.ownerTimeBlock,
      };
    } else {
      const setup = await createOwnerSetup({ withTeam: true });

      if (!setup.teamMember) {
        return new NextResponse(
          JSON.stringify({ error: "No se pudo crear el barbero del equipo." }),
          { status: 500 }
        );
      }

      if (scenario === "owner-with-team") {
        tokenPayload = {
          sub: setup.owner.id,
          id: setup.owner.id,
          name: setup.owner.name,
          email: setup.owner.email,
          role: setup.owner.role,
          barbershop: {
            id: setup.barbershop.id,
            name: setup.barbershop.name,
            slug: setup.barbershop.slug,
            image: null,
            address: null,
            description: null,
          },
          teamMembership: null,
          trialEndsAt: setup.owner.trialEndsAt,
          subscription: null,
        };
      } else {
        tokenPayload = {
          sub: setup.teamMember.id,
          id: setup.teamMember.id,
          name: setup.teamMember.name,
          email: setup.teamMember.email,
          role: setup.teamMember.role,
          barbershop: {
            id: setup.barbershop.id,
            name: setup.barbershop.name,
            slug: setup.barbershop.slug,
            image: null,
            address: null,
            description: null,
          },
          teamMembership: setup.teamMember.teamMembership,
          trialEndsAt: setup.teamMember.trialEndsAt,
          subscription: null,
        };
      }

      responseData = {
        ...responseData,
        user:
          scenario === "owner-with-team"
            ? {
                id: setup.owner.id,
                name: setup.owner.name,
                email: setup.owner.email,
                role: setup.owner.role,
              }
            : {
                id: setup.teamMember.id,
                name: setup.teamMember.name,
                email: setup.teamMember.email,
                role: setup.teamMember.role,
              },
        barbershop: setup.barbershop,
        ownerService: setup.ownerService,
        ownerTimeBlock: setup.ownerTimeBlock,
        teamMember: {
          id: setup.teamMember.id,
          name: setup.teamMember.name,
          email: setup.teamMember.email,
          role: setup.teamMember.role,
          service: setup.teamMember.service,
          timeBlock: setup.teamMember.timeBlock,
        },
      };
    }

    const token = await encode({
      token: tokenPayload,
      secret,
      salt: cookieName,
    });

    return NextResponse.json({
      session: {
        name: cookieName,
        value: token,
      },
      ...responseData,
    });
  } catch (error) {
    console.error("Error en la ruta de login de prueba:", error);
    return new NextResponse(
      JSON.stringify({ error: "No se pudo crear la sesión de prueba." }),
      { status: 500 }
    );
  }
}
