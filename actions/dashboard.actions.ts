"use server";

import { getCurrentUser, getUserForSettings } from "@/lib/data";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { BookingStatus, Role } from "@prisma/client";
import { z } from "zod";
import { put } from "@vercel/blob";
import { getStartOfDay, getEndOfDay } from "@/lib/date-helpers";
import { Client, User, Barbershop } from "@prisma/client";

export type FormState = {
  success: string | null;
  error: any | null;
  data?: {
    user?: User;
    barbershop?: Barbershop;
    [key: string]: any;
  } | null;
};

const TimeBlockSchema = z
  .object({
    startDateTime: z
      .string()
      .datetime({ message: "Formato de fecha de inicio inválido." }),
    endDateTime: z
      .string()
      .datetime({ message: "Formato de fecha de fin inválido." }),
    reason: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      return new Date(data.endDateTime) > new Date(data.startDateTime);
    },
    {
      message: "La fecha y hora de fin debe ser posterior a la de inicio.",
      path: ["endDateTime"],
    }
  )
  .refine(
    (data) => {
      return new Date(data.startDateTime) > new Date();
    },
    {
      message: "No puedes crear un bloqueo en una fecha u hora pasada.",
      path: ["startDateTime"],
    }
  );



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
  }
);

export async function saveSchedule(schedule: z.infer<typeof ScheduleSchema>) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.OWNER) {
    return { error: "Acción no autorizada." };
  }

  const validatedSchedule = ScheduleSchema.safeParse(schedule);

  if (!validatedSchedule.success) {
    return { error: validatedSchedule.error.issues[0].message };
  }

  const barberId = user.id;

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
            day.shifts
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

    revalidatePath("/dashboard/schedule");
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

      await tx.booking.deleteMany({
        where: { clientId: clientId },
      });

      await tx.client.delete({
        where: { id: clientId },
      });
    });

    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
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
  newStatus: BookingStatus
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (booking?.barberId !== user!.id) {
      return { error: "No tienes permiso para modificar este turno." };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    const statusTextMap = {
      [BookingStatus.SCHEDULED]: "agendado",
      [BookingStatus.COMPLETED]: "completado",
      [BookingStatus.CANCELLED]: "cancelado",
    };
    const friendlyStatus = statusTextMap[newStatus];

    return {
      success: `El turno ha sido marcado como ${friendlyStatus}.`,
    };
  } catch (error) {
    return { error: "No se pudo actualizar el estado del turno." };
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

    revalidatePath("/dashboard");
    return { success: "¡Onboarding completado!" };
  } catch (error) {
    return { error: "No se pudo completar el onboarding." };
  }
}

const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

export async function createBooking(
  prevState: any,
  formData: FormData
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
      .min(1, "El teléfono del cliente es requerido.")
      .transform((val) => val.replace(/[\s-()]/g, ""))
      .pipe(z.string().min(8, "El teléfono debe tener al menos 8 dígitos."))
      .pipe(z.string().max(15, "El teléfono no puede tener más de 15 dígitos."))
      .pipe(
        z.string().regex(/^[0-9]+$/, "El teléfono solo puede contener números.")
      ),
    startTime: z
      .string()
      .datetime({ message: "La fecha y hora de inicio no son válidas." }),
  });

  const validatedFields = DashboardBookingSchema.safeParse(
    Object.fromEntries(formData.entries())
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
  } = validatedFields.data;
  const startTime = new Date(startTimeStr);

  try {
    const dayOfWeek = startTime.getDay();

    const [workingHours, serviceForBooking] = await Promise.all([
      prisma.workingHours.findUnique({
        where: {
          barberId_dayOfWeek: { barberId: user.id, dayOfWeek },
        },
      }),
      prisma.service.findUnique({
        where: { id: serviceId },
      }),
    ]);

    if (!serviceForBooking) {
      return { success: null, error: "El servicio seleccionado no existe." };
    }

    if (
      !workingHours ||
      !workingHours.isWorking ||
      !workingHours.startTime ||
      !workingHours.endTime
    ) {
      const dayName = new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(startTime);
      return {
        success: null,
        error: `No trabajas los ${dayName} o no has configurado tus horarios.`,
      };
    }

    const bookingTimeStr = startTime.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Argentina/Buenos_Aires",
    });

    const bookingTimeInMinutes = timeToMinutes(bookingTimeStr);
    const startTimeInMinutes = timeToMinutes(workingHours.startTime);
    const endTimeInMinutes = timeToMinutes(workingHours.endTime);

    if (
      bookingTimeInMinutes < startTimeInMinutes ||
      bookingTimeInMinutes >= endTimeInMinutes
    ) {
      return {
        success: null,
        error: `El turno está fuera del horario laboral (${workingHours.startTime} - ${workingHours.endTime}).`,
      };
    }

    const newBookingEndTime = new Date(
      startTime.getTime() + (serviceForBooking.durationInMinutes ?? 60) * 60000
    );

    const existingBookings = await prisma.booking.findMany({
      where: {
        barberId: user.id,
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
          },
        },
      },
    });

    const overlappingBooking = existingBookings.find((existing) => {
      const existingStartTime = existing.startTime;
      const existingEndTime = new Date(
        existingStartTime.getTime() +
          (existing.service.durationInMinutes ?? 60) * 60000
      );

      return (
        startTime < existingEndTime && existingStartTime < newBookingEndTime
      );
    });

    if (overlappingBooking) {
      return {
        success: null,
        error:
          "El horario seleccionado se solapa con otro turno. Por favor, elige otro horario.",
      };
    }

    let client: Client;
    let finalClientName: string;

    await prisma.$transaction(async (tx) => {
      const existingClient = await tx.client.findUnique({
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

      await tx.booking.create({
        data: {
          startTime,
          priceAtBooking: serviceForBooking.price,
          durationAtBooking: serviceForBooking.durationInMinutes,
          barberId: user.id,
          clientId: client.id,
          serviceId: serviceId,
          barbershopId: barbershopId!,
        },
      });
    });

    revalidatePath("/dashboard");
    return {
      success: `Turno creado con éxito para ${finalClientName!}.`,
      error: null,
      data: {
        bookedClientName: finalClientName!,
      },
    };
  } catch (error) {
    console.error("Error al crear el turno:", error);
    return {
      success: null,
      error: "No se pudo crear el turno. La operación fue revertida.",
    };
  }
}

export async function updateClientNotes(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const clientId = formData.get("clientId")?.toString();
  const notes = formData.get("notes")?.toString();

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

    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: "¡Notas guardadas con éxito!", error: null };
  } catch (error) {
    console.error("Error al actualizar las notas del cliente:", error);
    return {
      success: null,
      error: "No se pudieron actualizar las notas del cliente.",
    };
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

    if (block?.barberId !== user!.id) {
      return { error: "No tienes permiso para borrar este bloqueo." };
    }

    await prisma.timeBlock.delete({
      where: { id: blockId },
    });

    revalidatePath("/dashboard/schedule");
    return { success: "Bloqueo eliminado con éxito." };
  } catch (error) {
    console.error("Error al eliminar el bloqueo:", error);
    return { error: "No se pudo eliminar el bloqueo." };
  }
}

export async function updateTimeBlock(
  blockId: string,
  prevState: any,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  const blockToUpdate = await prisma.timeBlock.findUnique({
    where: { id: blockId },
  });

  if (!blockToUpdate || blockToUpdate.barberId !== user!.id) {
    return { error: "Operación no permitida." };
  }

  const validatedFields = TimeBlockSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { startDateTime, endDateTime, reason } = validatedFields.data;

  try {
    await prisma.timeBlock.update({
      where: { id: blockId },
      data: {
        startTime: new Date(startDateTime),
        endTime: new Date(endDateTime),
        reason,
      },
    });

    revalidatePath("/dashboard/schedule");
    return { success: "Bloqueo actualizado con éxito." };
  } catch (error) {
    console.error("Error al actualizar el bloqueo de tiempo:", error);
    return { error: "No se pudo actualizar el bloqueo." };
  }
}

export async function createTimeBlock(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  const validatedFields = TimeBlockSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { startDateTime, endDateTime, reason } = validatedFields.data;

  try {
    const existingBlock = await prisma.timeBlock.findFirst({
      where: {
        barberId: user!.id,
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
        barberId: user!.id,
      },
    });
    revalidatePath("/dashboard/schedule");
    return { success: "Bloqueo de tiempo creado con éxito." };
  } catch (error) {
    console.error("Error al crear el bloqueo de tiempo:", error);
    return { error: "No se pudo crear el bloqueo." };
  }
}
