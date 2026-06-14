"use server";

import { getCurrentUser, getUserForSettings } from "@/lib/data";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { invalidateAnalyticsCache } from "@/lib/cache-utils";
import { BookingStatus, Role, PaymentMethod } from "@prisma/client";
import { z } from "zod";
import {
  getStartOfDay,
  getEndOfDay,
  getArgentinaDayOfWeek,
  getArgentinaMinutesOfDay,
  parseTimeToMinutes,
} from "@/lib/date-helpers";
import { UpdateBookingServiceSchema, CreateTimeBlockSchema, UpdateTimeBlockSchema, UpdateBookingClientSchema, SearchClientsSchema } from "@/lib/schemas";
import { Client, User, Barbershop } from "@prisma/client";

export type FormState = {
  success: string | null;
  error: string | Record<string, string[]> | null;
  data?: {
    user?: User;
    barbershop?: Barbershop;
    [key: string]: any;
  } | null;
};


type TimeBlockFormState = {
  success?: string | null;
  error?: string | Record<string, string[]> | null;
};

const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const WorkShiftSchema = z.object({
  enabled: z.boolean(),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
});

const DayScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isWorking: z.boolean(),
  shifts: z.object({
    MORNING: WorkShiftSchema,
    AFTERNOON: WorkShiftSchema,
    NIGHT: WorkShiftSchema,
  }),
});

const ScheduleSchema = z.array(DayScheduleSchema).refine(
  (schedule) => {
    for (const day of schedule) {
      if (day.isWorking) {
        for (const shift of Object.values(day.shifts)) {
          if (shift.enabled && shift.startTime >= shift.endTime) {
            return false;
          }
        }
      }
    }
    return true;
  },
  {
    message: "La hora de inicio debe ser anterior a la hora de fin",
  },
);

async function ownerCanManageBarber(ownerId: string, barberId: string) {
  if (ownerId === barberId) {
    return true;
  }

  const isTeamMember = await prisma.team.findFirst({
    where: {
      userId: barberId,
      barbershop: { ownerId },
    },
    select: { id: true },
  });

  return Boolean(isTeamMember);
}

async function resolveManagedBarberId(
  user: { id: string; role: Role | null },
  requestedBarberId?: string | null,
): Promise<{ barberId: string } | { error: string }> {
  const targetBarberId = requestedBarberId?.trim();

  if (user.role === Role.OWNER) {
    if (!targetBarberId || targetBarberId === user.id) {
      return { barberId: user.id };
    }

    const canManage = await ownerCanManageBarber(user.id, targetBarberId);
    if (!canManage) {
      return {
        error: "No tienes permisos para gestionar horarios de este barbero.",
      };
    }

    return { barberId: targetBarberId };
  }

  if (targetBarberId && targetBarberId !== user.id) {
    return { error: "No tienes permisos para gestionar horarios de otros." };
  }

  return { barberId: user.id };
}

export async function saveSchedule(
  schedule: z.infer<typeof ScheduleSchema>,
  targetBarberId?: string,
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado." };
  }

  const managedBarber = await resolveManagedBarberId(user, targetBarberId);
  if ("error" in managedBarber) {
    return { error: managedBarber.error };
  }

  const validatedSchedule = ScheduleSchema.safeParse(schedule);

  if (!validatedSchedule.success) {
    return { error: validatedSchedule.error.issues[0].message };
  }

  const barberId = managedBarber.barberId;

  try {
    const userWorkingHours = await prisma.workingHours.findMany({
      where: { barberId },
      select: { id: true },
    });
    const workingHoursIds = userWorkingHours.map((wh) => wh.id);

    await prisma.$transaction(async (tx) => {
      if (workingHoursIds.length > 0) {
        await tx.workScheduleBlock.deleteMany({
          where: {
            workingHoursId: {
              in: workingHoursIds,
            },
          },
        });
      }

      const blocksToCreate = [];

      for (const day of validatedSchedule.data) {
        const workingHoursRecord = await tx.workingHours.upsert({
          where: { barberId_dayOfWeek: { barberId, dayOfWeek: day.dayOfWeek } },
          update: { isWorking: day.isWorking },
          create: {
            barberId,
            dayOfWeek: day.dayOfWeek,
            isWorking: day.isWorking,
          },
        });

        if (day.isWorking) {
          for (const type of Object.keys(
            day.shifts,
          ) as (keyof typeof day.shifts)[]) {
            const shift = day.shifts[type];
            if (shift.enabled) {
              blocksToCreate.push({
                workingHoursId: workingHoursRecord.id,
                type: type,
                startTime: shift.startTime,
                endTime: shift.endTime,
              });
            }
          }
        }
      }

      if (blocksToCreate.length > 0) {
        await tx.workScheduleBlock.createMany({
          data: blocksToCreate,
        });
      }
    });

    const barberUpdated = await prisma.user.findUnique({
      where: { id: barberId },
      include: {
        ownedBarbershop: { select: { slug: true } },
        teamMembership: { include: { barbershop: { select: { slug: true } } } },
      },
    });

    const slug =
      barberUpdated?.ownedBarbershop?.slug ||
      barberUpdated?.teamMembership?.barbershop?.slug;

    if (slug) {
      revalidateTag(`barber-profile:${slug}`, "max");
    }

    revalidatePath("/dashboard/schedule", "layout");
    return { success: "¡Horario guardado con éxito!" };
  } catch (error) {
    console.error("Error al guardar el horario:", error);
    return { error: "No se pudo guardar el horario." };
  }
}

export async function deleteClient(clientId: string) {
  const user = await getUserForSettings();
  if (!user) {
    return { error: "No autorizado." };
  }

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;

  if (!barbershopId) {
    return { error: "Usuario no asociado a una barbería." };
  }

  try {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        barbershopId: barbershopId,
      },
    });

    if (!client) {
      return { error: "No tienes permiso para eliminar este cliente." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({
        where: {
          clientId: clientId,
          userId: user!.id,
        },
      });

      await tx.recurringBooking.deleteMany({
        where: { clientId: clientId },
      });

      await tx.booking.deleteMany({
        where: { clientId: clientId },
      });

      await tx.client.delete({
        where: { id: clientId },
      });
    });

    revalidatePath("/dashboard/clients", "layout");
    revalidatePath("/dashboard", "layout");
    invalidateAnalyticsCache();
    return { success: "Cliente y sus turnos han sido eliminados con éxito." };
  } catch (error) {
    console.error("Error al eliminar al cliente:", error);
    return {
      error: "No se pudo eliminar al cliente. La operación fue revertida.",
    };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  paymentMethod?: PaymentMethod,
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  if (newStatus === BookingStatus.COMPLETED && !paymentMethod) {
    return { error: "Seleccioná un método de pago." };
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        barbershop: {
          select: { ownerId: true },
        },
      },
    });

    if (!booking) {
      return { error: "El turno no fue encontrado." };
    }

    const isAssignedBarber = booking.barberId === user.id;
    const isOwner = booking.barbershop.ownerId === user.id;

    if (!isAssignedBarber && !isOwner) {
      return { error: "No tienes permiso para modificar este turno." };
    }

    // COMPLETED → CANCELLED solo lo puede hacer el OWNER
    if (
      booking.status === BookingStatus.COMPLETED &&
      newStatus === BookingStatus.CANCELLED &&
      !isOwner
    ) {
      return {
        error: "Solo el dueño puede cancelar turnos completados.",
      };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        ...(newStatus === BookingStatus.COMPLETED && paymentMethod
          ? { paymentMethod }
          : {}),
        // Limpiar paymentMethod al cancelar un turno completado
        ...(booking.status === BookingStatus.COMPLETED &&
        newStatus === BookingStatus.CANCELLED
          ? { paymentMethod: null }
          : {}),
      },
    });

    const statusTextMap = {
      [BookingStatus.SCHEDULED]: "agendado",
      [BookingStatus.COMPLETED]: "completado",
      [BookingStatus.CANCELLED]: "cancelado",
    };
    const friendlyStatus = statusTextMap[newStatus];

    revalidatePath("/dashboard", "layout");
    invalidateAnalyticsCache();

    return {
      success: `El turno ha sido marcado como ${friendlyStatus}.`,
    };
  } catch (error) {
    return { error: "No se pudo actualizar el estado del turno." };
  }
}

export async function bulkUpdateBookingStatus(
  bookingIds: string[],
  newStatus: BookingStatus,
): Promise<{ success: string; count: number } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  if (!bookingIds.length) {
    return { error: "No se seleccionaron turnos." };
  }

  try {
    // Fetch all bookings to verify permissions
    const bookings = await prisma.booking.findMany({
      where: { id: { in: bookingIds } },
      include: {
        barbershop: {
          select: { ownerId: true },
        },
      },
    });

    if (bookings.length !== bookingIds.length) {
      return { error: "Algunos turnos no fueron encontrados." };
    }

    // Verify user has permission for ALL bookings
    const unauthorized = bookings.some((booking) => {
      const isAssignedBarber = booking.barberId === user.id;
      const isOwner = booking.barbershop.ownerId === user.id;
      return !isAssignedBarber && !isOwner;
    });

    if (unauthorized) {
      return {
        error: "No tenés permiso para modificar algunos de estos turnos.",
      };
    }

    // Batch update all bookings
    const result = await prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard", "layout");
    invalidateAnalyticsCache();

    const statusTextMap = {
      [BookingStatus.SCHEDULED]: "agendados",
      [BookingStatus.COMPLETED]: "completados",
      [BookingStatus.CANCELLED]: "cancelados",
    };
    const friendlyStatus = statusTextMap[newStatus];

    return {
      success: `Se marcaron ${result.count} turnos como ${friendlyStatus}.`,
      count: result.count,
    };
  } catch (error) {
    console.error("Error al actualizar turnos en lote:", error);
    return { error: "No se pudieron actualizar los turnos." };
  }
}

export async function completeOnboarding() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  try {
    await prisma.user.update({
      where: { id: user!.id },
      data: { onboardingCompleted: true },
    });

    revalidatePath("/dashboard", "layout");
    return { success: "¡Onboarding completado!" };
  } catch (error) {
    return { error: "No se pudo completar el onboarding." };
  }
}

export async function createBooking(
  prevState: any,
  formData: FormData,
): Promise<FormState> {
  const user = await getUserForSettings();
  if (!user) {
    return { success: null, error: "No autorizado" };
  }

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;

  if (!barbershopId) {
    return { success: null, error: "Usuario no asociado a una barbería." };
  }

  const DashboardBookingSchema = z.object({
    serviceId: z.string().cuid(),
    clientName: z.string().min(1, "El nombre del cliente es requerido."),
    clientPhone: z
      .string()
      .optional()
      .default("")
      .transform((val) => {
        const cleaned = val.replace(/[\s-()]/g, "");
        return cleaned === "" ? null : cleaned;
      })
      .pipe(
        z.union([
          z.null(),
          z
            .string()
            .min(8, "El teléfono debe tener al menos 8 dígitos.")
            .max(15, "El teléfono no puede tener más de 15 dígitos.")
            .regex(/^[0-9]+$/, "El teléfono solo puede contener números."),
        ]),
      ),
    startTime: z
      .string()
      .datetime({ message: "La fecha y hora de inicio no son válidas." }),
    targetBarberId: z.string().optional(),
  });

  const validatedFields = DashboardBookingSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!validatedFields.success) {
    return {
      success: null,
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    serviceId,
    clientName,
    clientPhone,
    startTime: startTimeStr,
    targetBarberId,
  } = validatedFields.data;
  const startTime = new Date(startTimeStr);

  let barberId = user.id;

  if (targetBarberId && targetBarberId !== user.id) {
    if (user.role !== Role.OWNER) {
      return {
        success: null,
        error: "No tienes permiso para agendar turnos para otros barberos.",
      };
    }

    const isTeamMember = await prisma.team.findFirst({
      where: {
        userId: targetBarberId,
        barbershop: { ownerId: user.id },
      },
    });

    if (!isTeamMember) {
      return {
        success: null,
        error: "El barbero seleccionado no pertenece a tu equipo.",
      };
    }

    barberId = targetBarberId;
  }

  try {
    const dayOfWeek = getArgentinaDayOfWeek(startTime);

    // Buscar workingHours del barbero target
    let workingHours = await prisma.workingHours.findUnique({
      where: {
        barberId_dayOfWeek: { barberId: barberId, dayOfWeek },
      },
      include: {
        blocks: true,
      },
    });

    // Fallback: si el barbero no tiene horarios propios y es empleado,
    // usar los horarios del OWNER de la barbería
    if (!workingHours) {
      const barberUser = await prisma.user.findUnique({
        where: { id: barberId },
        select: {
          role: true,
          teamMembership: {
            select: { barbershop: { select: { ownerId: true } } },
          },
        },
      });

      if (barberUser?.role === Role.BARBER && barberUser.teamMembership) {
        const ownerId = barberUser.teamMembership.barbershop.ownerId;
        workingHours = await prisma.workingHours.findUnique({
          where: {
            barberId_dayOfWeek: { barberId: ownerId, dayOfWeek },
          },
          include: {
            blocks: true,
          },
        });
      }
    }

    const serviceForBooking = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!serviceForBooking) {
      return { success: null, error: "El servicio seleccionado no existe." };
    }

    if (!workingHours || !workingHours.isWorking) {
      const dayName = new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(startTime);
      const barberName =
        barberId !== user.id ? "El barbero seleccionado" : "No";
      return {
        success: null,
        error: `${barberName} no trabaja los ${dayName} o no ha configurado sus horarios.`,
      };
    }

    const bookingTimeStr = startTime.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Argentina/Buenos_Aires",
    });
    const bookingTimeInMinutes = parseTimeToMinutes(bookingTimeStr);

    const serviceDuration = serviceForBooking.durationInMinutes ?? 60;
    const serviceActiveDuration =
      serviceForBooking.activeDurationInMinutes ?? serviceDuration;
    const bookingEndTimeInMinutes = bookingTimeInMinutes + serviceDuration;

    let isWithinWorkingHours = false;
    let validBlock = null;

    for (const block of workingHours.blocks) {
      const blockStartMinutes = parseTimeToMinutes(block.startTime);
      const blockEndMinutes = parseTimeToMinutes(block.endTime);

      if (
        bookingTimeInMinutes >= blockStartMinutes &&
        bookingEndTimeInMinutes <= blockEndMinutes
      ) {
        isWithinWorkingHours = true;
        validBlock = block;
        break;
      }
    }

    if (!isWithinWorkingHours) {
      return {
        success: null,
        error: `El turno seleccionado está fuera de tus horarios laborales configurados para este día.`,
      };
    }

    let finalClientName: string;

    await prisma.$transaction(async (tx) => {
      const existingBookings = await tx.booking.findMany({
        where: {
          barberId: barberId,
          status: { not: "CANCELLED" },
          startTime: {
            gte: getStartOfDay(startTime),
            lt: getEndOfDay(startTime),
          },
        },
        include: {
          service: {
            select: {
              durationInMinutes: true,
              activeDurationInMinutes: true,
            },
          },
        },
      });

      const newBookingActiveEnd = new Date(
        startTime.getTime() + serviceActiveDuration * 60000,
      );

      const overlappingBooking = existingBookings.find((existing) => {
        const existingStartTime = existing.startTime;
        const existingDuration =
          existing.activeDurationAtBooking ??
          existing.service?.activeDurationInMinutes ??
          existing.durationAtBooking ??
          existing.service?.durationInMinutes ??
          60;
        const existingEndTime = new Date(
          existingStartTime.getTime() + existingDuration * 60000,
        );

        return (
          startTime < existingEndTime && existingStartTime < newBookingActiveEnd
        );
      });

      if (overlappingBooking) {
        throw new Error("SLOT_TAKEN");
      }

      let client: Client;
      if (clientPhone) {
        const existingClient = await tx.client.findFirst({
          where: { phone: clientPhone },
        });

        if (existingClient) {
          client = existingClient;
          finalClientName = existingClient.name;
        } else {
          client = await tx.client.create({
            data: {
              name: clientName,
              phone: clientPhone,
              barbershopId: barbershopId!,
            },
          });
          finalClientName = client.name;
        }
      } else {
        client = await tx.client.create({
          data: {
            name: clientName,
            phone: null,
            barbershopId: barbershopId!,
          },
        });
        finalClientName = client.name;
      }

      // Deduplication: check for any recent booking from same client at same time (within 60s)
      const recentDuplicate = await tx.booking.findFirst({
        where: {
          barberId,
          clientId: client.id,
          startTime,
          status: { not: "CANCELLED" },
          createdAt: { gte: new Date(Date.now() - 60 * 1000) },
        },
      });

      if (recentDuplicate) {
        // Already created recently — skip to avoid duplicate
        return;
      }

      await tx.booking.create({
        data: {
          startTime,
          priceAtBooking: serviceForBooking.price,
          durationAtBooking: serviceForBooking.durationInMinutes,
          activeDurationAtBooking: serviceForBooking.activeDurationInMinutes,
          barberId: barberId,
          clientId: client.id,
          serviceId: serviceId,
          barbershopId: barbershopId!,
        },
      });
    });

    revalidatePath("/dashboard", "layout");
    invalidateAnalyticsCache();
    return {
      success: `Turno creado con éxito para ${finalClientName!}.`,
      error: null,
      data: {
        bookedClientName: finalClientName!,
      },
    };
  } catch (error: any) {
    if (error.message === "SLOT_TAKEN") {
      console.warn(
        "[Booking] Se detectó solapamiento de turnos al crear desde dashboard. Lanzando error SLOT_TAKEN...",
      );
      return {
        success: null,
        error:
          "El horario seleccionado se solapa con otro turno. Por favor, elige otro horario.",
      };
    }

    console.error("[Booking] Error al crear turno desde dashboard:", error);
    return {
      success: null,
      error: "No se pudo crear el turno. La operación fue revertida.",
    };
  }
}

const ClientNotesSchema = z.object({
  clientId: z.string().min(1, "ID de cliente inválido."),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? ""),
});

export async function updateClientNotes(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = ClientNotesSchema.safeParse({
    clientId: formData.get("clientId"),
    notes: formData.get("notes"),
  });

  if (!validatedFields.success) {
    return {
      success: null,
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { clientId, notes } = validatedFields.data;

  const user = await getUserForSettings();
  if (!user) {
    return { success: null, error: "No autorizado" };
  }

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;

  if (!barbershopId) {
    return { success: null, error: "Usuario no asociado a una barbería." };
  }

  try {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        barbershopId: barbershopId,
      },
    });

    if (!client) {
      return {
        success: null,
        error: "Cliente no encontrado o no tienes permiso para editarlo.",
      };
    }

    await prisma.client.update({
      where: { id: clientId },
      data: {
        notes: notes,
      },
    });

    revalidatePath(`/dashboard/clients/${clientId}`, "layout");
    return { success: "¡Notas guardadas con éxito!", error: null };
  } catch (error) {
    console.error("Error al actualizar las notas del cliente:", error);
    return {
      success: null,
      error: "No se pudieron actualizar las notas del cliente.",
    };
  }
}

export async function setPaymentMethod(
  bookingId: string,
  paymentMethod: PaymentMethod,
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        barbershop: { select: { ownerId: true } },
      },
    });

    if (!booking) return { error: "Turno no encontrado." };
    if (booking.status !== BookingStatus.COMPLETED) {
      return {
        error: "Solo se puede asignar método de pago a turnos completados.",
      };
    }

    const isAssignedBarber = booking.barberId === user.id;
    const isOwner = booking.barbershop.ownerId === user.id;

    if (!isAssignedBarber && !isOwner) {
      return { error: "No tienes permiso para modificar este turno." };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentMethod },
    });

    revalidatePath("/dashboard");
    invalidateAnalyticsCache();

    return { success: "Método de pago registrado con éxito." };
  } catch (error) {
    console.error("Error al asignar método de pago:", error);
    return { error: "No se pudo registrar el método de pago." };
  }
}

export async function bulkSetPaymentMethod(
  bookingIds: string[],
  paymentMethod: PaymentMethod,
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  if (!bookingIds || bookingIds.length === 0) {
    return { error: "No se seleccionaron turnos." };
  }

  try {
    const firstBooking = await prisma.booking.findFirst({
      where: { id: { in: bookingIds } },
      include: { barbershop: { select: { ownerId: true } } },
    });

    if (!firstBooking) return { error: "Turnos no encontrados." };

    const isOwner = firstBooking.barbershop.ownerId === user.id;
    const isAssignedBarber = firstBooking.barberId === user.id;

    if (!isOwner && !isAssignedBarber) {
      return { error: "No tienes permiso para modificar estos turnos." };
    }

    await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
        status: BookingStatus.COMPLETED,
        OR: [{ barberId: user.id }, { barbershop: { ownerId: user.id } }],
      },
      data: { paymentMethod },
    });

    revalidatePath("/dashboard");
    invalidateAnalyticsCache();

    return { success: "Métodos de pago asignados con éxito." };
  } catch (error) {
    console.error("Error al asignar métodos de pago masivamente:", error);
    return { error: "No se pudo realizar la actualización masiva." };
  }
}

export async function deleteTimeBlock(blockId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  try {
    const block = await prisma.timeBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      return { error: "Bloqueo no encontrado." };
    }

    const managedBarber = await resolveManagedBarberId(user, block.barberId);
    if ("error" in managedBarber) {
      return { error: "No tienes permiso para borrar este bloqueo." };
    }

    await prisma.timeBlock.delete({
      where: { id: blockId },
    });

    revalidatePath("/dashboard/schedule", "layout");
    return { success: "Bloqueo eliminado con éxito." };
  } catch (error) {
    console.error("Error al eliminar el bloqueo:", error);
    return { error: "No se pudo eliminar el bloqueo." };
  }
}

export async function updateTimeBlock(
  blockId: string,
  prevState: TimeBlockFormState | null,
  formData: FormData,
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  const blockToUpdate = await prisma.timeBlock.findUnique({
    where: { id: blockId },
  });

  if (!blockToUpdate) {
    return { error: "Operación no permitida." };
  }

  const managedBarber = await resolveManagedBarberId(
    user,
    blockToUpdate.barberId,
  );
  if ("error" in managedBarber) {
    return { error: "Operación no permitida." };
  }

  const validatedFields = UpdateTimeBlockSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { startDateTime, endDateTime, reason } = validatedFields.data;

  try {
    const overlappingBlock = await prisma.timeBlock.findFirst({
      where: {
        barberId: blockToUpdate.barberId,
        id: { not: blockId },
        startTime: {
          lt: new Date(endDateTime),
        },
        endTime: {
          gt: new Date(startDateTime),
        },
      },
    });

    if (overlappingBlock) {
      return {
        error: "Ya existe un bloqueo que se superpone con este horario.",
      };
    }

    await prisma.timeBlock.update({
      where: { id: blockId },
      data: {
        startTime: new Date(startDateTime),
        endTime: new Date(endDateTime),
        reason,
      },
    });

    revalidatePath("/dashboard/schedule", "layout");
    return { success: "Bloqueo actualizado con éxito." };
  } catch (error) {
    console.error("Error al actualizar el bloqueo de tiempo:", error);
    return { error: "No se pudo actualizar el bloqueo." };
  }
}

export async function createTimeBlock(
  prevState: TimeBlockFormState | null,
  formData: FormData,
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  const validatedFields = CreateTimeBlockSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { startDateTime, endDateTime, reason, barberId } = validatedFields.data;

  const managedBarber = await resolveManagedBarberId(user, barberId);
  if ("error" in managedBarber) {
    return { error: managedBarber.error };
  }

  const barberIdToUse = managedBarber.barberId;

  try {
    const existingBlock = await prisma.timeBlock.findFirst({
      where: {
        barberId: barberIdToUse,
        startTime: {
          lt: new Date(endDateTime),
        },
        endTime: {
          gt: new Date(startDateTime),
        },
      },
    });

    if (existingBlock) {
      return {
        error: "Ya existe un bloqueo que se superpone con este horario.",
      };
    }

    await prisma.timeBlock.create({
      data: {
        startTime: new Date(startDateTime),
        endTime: new Date(endDateTime),
        reason: reason,
        barberId: barberIdToUse,
      },
    });
    revalidatePath("/dashboard/schedule", "layout");
    return { success: "Bloqueo de tiempo creado con éxito." };
  } catch (error) {
    console.error("Error al crear el bloqueo de tiempo:", error);
    return { error: "No se pudo crear el bloqueo." };
  }
}

type AvailabilityResult =
  | { available: true }
  | { available: false; reason: string };

export async function checkBookingAvailability(
  barberId: string,
  startTime: Date,
  durationMinutes: number,
  activeDurationMinutes?: number,
  excludeBookingId?: string,
): Promise<AvailabilityResult> {
  const user = await getCurrentUser();
  if (!user) return { available: false, reason: "No autorizado." };

  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  const overlapEndTime = new Date(
    startTime.getTime() + (activeDurationMinutes ?? durationMinutes) * 60000,
  );
  const dayOfWeek = getArgentinaDayOfWeek(startTime);

  const [workingHours, timeBlocks] = await Promise.all([
    prisma.workingHours.findUnique({
      where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
      include: { blocks: true },
    }),
    prisma.timeBlock.findMany({
      where: {
        barberId: barberId,
        startTime: { lt: getEndOfDay(startTime) },
        endTime: { gt: getStartOfDay(startTime) },
      },
    }),
  ]);

  const newStartMinutes = getArgentinaMinutesOfDay(startTime);
  const newEndMinutes = getArgentinaMinutesOfDay(endTime);

  const isWithinWorkingHours =
    workingHours?.isWorking &&
    workingHours.blocks.some((shift) => {
      const shiftStartMinutes = parseTimeToMinutes(shift.startTime);
      const shiftEndMinutes = parseTimeToMinutes(shift.endTime);

      return (
        newStartMinutes >= shiftStartMinutes && newEndMinutes <= shiftEndMinutes
      );
    });

  if (!isWithinWorkingHours) {
    return {
      available: false,
      reason: "El horario está fuera de la jornada laboral.",
    };
  }

  const overlapsWithTimeBlock = timeBlocks.some(
    (block) => startTime < block.endTime && overlapEndTime > block.startTime,
  );

  if (overlapsWithTimeBlock) {
    return {
      available: false,
      reason: "El horario se superpone con un bloqueo de tiempo.",
    };
  }

  const otherBookings = await prisma.booking.findMany({
    where: {
      barberId: barberId,
      status: { not: "CANCELLED" },
      startTime: {
        gte: getStartOfDay(startTime),
        lt: getEndOfDay(startTime),
      },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    include: {
      service: {
        select: {
          durationInMinutes: true,
          activeDurationInMinutes: true,
        },
      },
    },
  });

  const overlapsWithBooking = otherBookings.some((existingBooking) => {
    const existingStartTime = existingBooking.startTime;
    const existingDuration =
      existingBooking.activeDurationAtBooking ??
      existingBooking.service?.activeDurationInMinutes ??
      existingBooking.durationAtBooking ??
      existingBooking.service?.durationInMinutes ??
      60;
    const existingEndTime = new Date(
      existingStartTime.getTime() + existingDuration * 60000,
    );

    return startTime < existingEndTime && overlapEndTime > existingStartTime;
  });

  if (overlapsWithBooking) {
    return {
      available: false,
      reason: "El horario se superpone con otro turno.",
    };
  }

  return { available: true };
}

export async function updateBookingTime(
  bookingId: string,
  newStartTime: Date,
  newDuration?: number,
): Promise<{ success?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Acción no autorizada." };
  }

  try {
    const bookingToMove = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        barbershop: {
          select: { ownerId: true, teamMembers: { select: { userId: true } } },
        },
        service: {
          select: {
            durationInMinutes: true,
            activeDurationInMinutes: true,
          },
        },
      },
    });

    if (!bookingToMove) {
      return { error: "El turno no fue encontrado." };
    }

    const isOwner = bookingToMove.barbershop.ownerId === user.id;
    const isAssignedBarber = bookingToMove.barberId === user.id;

    if (!isOwner && !isAssignedBarber) {
      return { error: "No tienes permiso para modificar este turno." };
    }

    const serviceDuration =
      newDuration ??
      bookingToMove.durationAtBooking ??
      bookingToMove.service?.durationInMinutes ??
      60;
    const newEndTime = new Date(
      newStartTime.getTime() + serviceDuration * 60000,
    );
    const dayOfWeek = getArgentinaDayOfWeek(newStartTime);
    const barberId = bookingToMove.barberId;

    const [workingHours, timeBlocks] = await Promise.all([
      prisma.workingHours.findUnique({
        where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
        include: { blocks: true },
      }),
      prisma.timeBlock.findMany({
        where: {
          barberId: barberId,
          startTime: { lt: getEndOfDay(newStartTime) },
          endTime: { gt: getStartOfDay(newStartTime) },
        },
      }),
    ]);

    // VALIDACIÓN 1: Horario Laboral (no cambia durante la transacción)
    const newStartMinutes = getArgentinaMinutesOfDay(newStartTime);
    const newEndMinutes = getArgentinaMinutesOfDay(newEndTime);

    const isWithinWorkingHours =
      workingHours?.isWorking &&
      workingHours.blocks.some((shift) => {
        const shiftStartMinutes = parseTimeToMinutes(shift.startTime);
        const shiftEndMinutes = parseTimeToMinutes(shift.endTime);

        return (
          newStartMinutes >= shiftStartMinutes &&
          newEndMinutes <= shiftEndMinutes
        );
      });

    if (!isWithinWorkingHours) {
      return { error: "El nuevo horario está fuera de la jornada laboral." };
    }

    // VALIDACIÓN 2: Bloqueos de Tiempo (raramente cambian)
    const overlapsWithTimeBlock = timeBlocks.some(
      (block) => newStartTime < block.endTime && newEndTime > block.startTime,
    );

    if (overlapsWithTimeBlock) {
      return {
        error: "El nuevo horario se superpone con un bloqueo de tiempo.",
      };
    }

    // TRANSACCIÓN: Verificar solapamiento y actualizar atómicamente
    await prisma.$transaction(async (tx) => {
      // Verificar otros bookings DENTRO de la transacción
      const otherBookings = await tx.booking.findMany({
        where: {
          id: { not: bookingId },
          barberId: barberId,
          status: { not: "CANCELLED" },
          startTime: {
            gte: getStartOfDay(newStartTime),
            lt: getEndOfDay(newStartTime),
          },
        },
        include: {
          service: {
            select: {
              durationInMinutes: true,
              activeDurationInMinutes: true,
            },
          },
        },
      });

      const bookingActiveDuration =
        bookingToMove.activeDurationAtBooking ??
        bookingToMove.service?.activeDurationInMinutes ??
        serviceDuration;
      const nextActiveDuration =
        newDuration !== undefined
          ? Math.min(bookingActiveDuration, newDuration)
          : bookingActiveDuration;
      const newActiveEndTime = new Date(
        newStartTime.getTime() + nextActiveDuration * 60000,
      );

      const overlapsWithBooking = otherBookings.some((existingBooking) => {
        const existingStartTime = existingBooking.startTime;
        const existingDuration =
          existingBooking.activeDurationAtBooking ??
          existingBooking.service?.activeDurationInMinutes ??
          existingBooking.durationAtBooking ??
          existingBooking.service?.durationInMinutes ??
          60;
        const existingEndTime = new Date(
          existingStartTime.getTime() + existingDuration * 60000,
        );

        return (
          newStartTime < existingEndTime && newActiveEndTime > existingStartTime
        );
      });

      if (overlapsWithBooking) {
        throw new Error("SLOT_TAKEN");
      }

      // Si no hay solapamiento, actualizar
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          startTime: newStartTime,
          ...(newDuration !== undefined && { durationAtBooking: newDuration }),
          ...(newDuration !== undefined && {
            activeDurationAtBooking: Math.min(
              bookingToMove.activeDurationAtBooking ??
                bookingToMove.service?.activeDurationInMinutes ??
                newDuration,
              newDuration,
            ),
          }),
        },
      });
    });

    revalidatePath("/dashboard", "layout");
    invalidateAnalyticsCache();

    return { success: "Turno reprogramado con éxito." };
  } catch (error: any) {
    if (error.message === "SLOT_TAKEN") {
      console.warn(
        "[Booking] Se detectó solapamiento de turnos al mover turno. Lanzando error SLOT_TAKEN...",
      );
      return { error: "El nuevo horario se superpone con otro turno." };
    }

    console.error("[Booking] Error al mover turno:", error);
    return { error: "No se pudo mover el turno. Inténtalo de nuevo." };
  }
}

type UpdateServiceResult =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | { type: "warning"; message: string; allowOverride: true };

export async function updateBookingService(
  bookingId: string,
  serviceId: string,
  force: boolean = false,
): Promise<UpdateServiceResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { type: "error", message: "No autorizado" };
  }

  const validated = UpdateBookingServiceSchema.safeParse({
    bookingId,
    serviceId,
    force,
  });
  if (!validated.success) {
    return { type: "error", message: validated.error.issues[0].message };
  }

  try {
    const [booking, newService] = await Promise.all([
      prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          barberId: true,
          status: true,
          startTime: true,
          barbershop: { select: { ownerId: true } },
          service: {
            select: { durationInMinutes: true, activeDurationInMinutes: true },
          },
        },
      }),
      prisma.service.findUnique({
        where: { id: serviceId },
        select: {
          id: true,
          name: true,
          durationInMinutes: true,
          activeDurationInMinutes: true,
          price: true,
        },
      }),
    ]);

    if (!booking) {
      return { type: "error", message: "El turno no fue encontrado." };
    }

    if (!["SCHEDULED", "COMPLETED"].includes(booking.status)) {
      return {
        type: "error",
        message: "No se puede editar el servicio de este turno.",
      };
    }

    const isOwner = booking.barbershop.ownerId === user.id;
    const isAssignedBarber = booking.barberId === user.id;

    if (!isOwner && !isAssignedBarber) {
      return {
        type: "error",
        message: "No tienes permiso para modificar este turno.",
      };
    }

    if (!newService) {
      return { type: "error", message: "El servicio seleccionado no existe." };
    }

    const newDuration = newService.durationInMinutes ?? 60;
    const newActiveDuration =
      newService.activeDurationInMinutes ?? newDuration;
    const newActiveEndTime = new Date(
      booking.startTime.getTime() + newActiveDuration * 60000,
    );

    const overlapResult = await prisma.$transaction(async (tx) => {
      const otherBookings = await tx.booking.findMany({
        where: {
          id: { not: bookingId },
          barberId: booking.barberId,
          status: { not: "CANCELLED" },
          startTime: {
            gte: getStartOfDay(booking.startTime),
            lt: getEndOfDay(booking.startTime),
          },
        },
        include: {
          service: {
            select: {
              durationInMinutes: true,
              activeDurationInMinutes: true,
            },
          },
        },
      });

      const overlaps = otherBookings.some((existing) => {
        const existingStart = existing.startTime;
        const existingDuration =
          existing.activeDurationAtBooking ??
          existing.service?.activeDurationInMinutes ??
          existing.durationAtBooking ??
          existing.service?.durationInMinutes ??
          60;
        const existingEnd = new Date(
          existingStart.getTime() + existingDuration * 60000,
        );
        return (
          new Date(booking.startTime) < existingEnd &&
          newActiveEndTime > existingStart
        );
      });

      return { overlaps, otherBookings };
    });

    if (overlapResult.overlaps && !force) {
      return {
        type: "warning",
        message:
          "El nuevo servicio se solapa con otro turno existente. ¿Deseás guardar igual?",
        allowOverride: true,
      };
    }

    if (overlapResult.overlaps && force && !isOwner) {
      return {
        type: "error",
        message:
          "No tenés permiso para forzar un solapamiento de turnos.",
      };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        serviceId,
        durationAtBooking: newDuration,
        activeDurationAtBooking: newActiveDuration,
        priceAtBooking: Number(newService.price),
      },
    });

    revalidatePath("/dashboard", "layout");
    invalidateAnalyticsCache();

    return {
      type: "success",
      message: "Servicio actualizado con éxito.",
    };
  } catch (error) {
    console.error("Error al actualizar servicio del turno:", error);
    return {
      type: "error",
      message: "No se pudo actualizar el servicio del turno.",
    };
  }
}

export async function searchBarbershopClients(query: string) {
  const user = await getUserForSettings();
  if (!user) {
    return { error: "No autorizado." };
  }

  const parsed = SearchClientsSchema.safeParse({ query });
  if (!parsed.success) {
    return { error: "Búsqueda inválida." };
  }

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;

  if (!barbershopId) {
    return { error: "Usuario no asociado a una barbería." };
  }

  try {
    const clients = await prisma.client.findMany({
      where: {
        barbershopId,
        OR: [
          { name: { contains: parsed.data.query, mode: "insensitive" } },
          { phone: { contains: parsed.data.query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
      take: 10,
    });

    return { clients };
  } catch (error) {
    console.error("Error al buscar clientes:", error);
    return { error: "No se pudieron buscar los clientes." };
  }
}

export async function updateBookingClient(
  bookingId: string,
  newClientId: string,
) {
  const user = await getUserForSettings();
  if (!user) {
    return { error: "No autorizado." };
  }

  const parsed = UpdateBookingClientSchema.safeParse({
    bookingId,
    newClientId,
  });
  if (!parsed.success) {
    return { error: "Datos inválidos." };
  }

  if (!user.ownedBarbershop) {
    return { error: "Solo el dueño puede reasignar clientes." };
  }

  const barbershopId = user.ownedBarbershop.id;

  try {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, barbershopId },
    });

    if (!booking) {
      return { error: "Turno no encontrado." };
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      return { error: "Solo se pueden reasignar turnos completados." };
    }

    const newClient = await prisma.client.findFirst({
      where: { id: newClientId, barbershopId },
    });

    if (!newClient) {
      return { error: "El cliente seleccionado no existe." };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { clientId: newClientId },
    });

    revalidatePath("/dashboard", "layout");
    invalidateAnalyticsCache();

    return { success: "Cliente del turno actualizado." };
  } catch (error) {
    console.error("Error al reasignar cliente del turno:", error);
    return { error: "No se pudo reasignar el cliente del turno." };
  }
}
