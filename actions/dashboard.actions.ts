"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { BookingStatus, Barbershop } from "@prisma/client";
import { z } from "zod";
import { put } from "@vercel/blob";

async function getCurrentUserAndBarbershop() {
  const session = await auth();
  if (!session?.user?.id) {
    return { user: null, barbershopId: null, error: "No autorizado" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, barbershopId: true },
  });

  if (!user || !user.barbershopId) {
    return {
      user: null,
      barbershopId: null,
      error: "Usuario no encontrado o no asociado a una barbería.",
    };
  }

  return { user, barbershopId: user.barbershopId, error: null };
}

export type FormState = {
  success: string | null;
  error: any | null;
  newName?: string | null;
  newImageUrl?: string | null;
  newSlug?: string | null;
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

const UserProfileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  barbershopName: z.string().min(1, "El nombre de la barbería es requerido."),
  slug: z
    .string()
    .min(3, "La URL debe tener al menos 3 caracteres.")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Formato de URL no válido. Usa solo minúsculas, números y guiones."
    )
    .optional(),
});

const DayScheduleSchema = z
  .object({
    dayOfWeek: z.number().min(0).max(6),
    isWorking: z.boolean(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  })
  .refine(
    (data) => {
      if (!data.isWorking) return true;
      return data.endTime > data.startTime;
    },
    {
      message: "La hora de fin debe ser posterior a la hora de inicio.",
      path: ["endTime"],
    }
  );

const ScheduleSchema = z.array(DayScheduleSchema);

type DaySchedule = {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
};

export async function saveSchedule(schedule: DaySchedule[]) {
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

  const validatedSchedule = ScheduleSchema.safeParse(schedule);

  if (!validatedSchedule.success) {
    const firstError = validatedSchedule.error.issues[0];
    if (firstError.code === "custom" && firstError.path.length > 0) {
      const dayIndex = firstError.path[0] as number;
      const dayName = daysOfWeek[dayIndex];
      return {
        error: `${firstError.message} (en ${dayName})`,
      };
    }
    return { error: "Hubo un error al validar los horarios." };
  }

  const barberId = user!.id;

  try {
    await prisma.$transaction(
      validatedSchedule.data.map((day) =>
        prisma.workingHours.upsert({
          where: {
            barberId_dayOfWeek: {
              barberId: barberId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: {
            isWorking: day.isWorking,
            startTime: day.startTime,
            endTime: day.endTime,
          },
          create: {
            barberId: barberId,
            dayOfWeek: day.dayOfWeek,
            isWorking: day.isWorking,
            startTime: day.startTime,
            endTime: day.endTime,
          },
        })
      )
    );

    revalidatePath("/dashboard/schedule");
    return { success: "¡Horario guardado con éxito!" };
  } catch (error) {
    console.error("Error al guardar el horario:", error);
    return { error: "No se pudo guardar el horario." };
  }
}

const daysOfWeek = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export async function updateUserProfile(
  prevState: any,
  formData: FormData
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: null, error: "No autorizado" };
  }
  const userId = session.user.id;

  try {
    const avatarFile = formData.get("avatar") as File | null;
    let avatarUrl: string | undefined = undefined;

    if (avatarFile && avatarFile.size > 0) {
      const blob = await put(avatarFile.name, avatarFile, {
        access: "public",
        addRandomSuffix: true,
      });
      avatarUrl = blob.url;
    }

    const fieldsToValidate = {
      name: formData.get("name"),
      barbershopName: formData.get("barbershopName"),
      slug: formData.get("slug"),
    };

    const existingBarbershop = await prisma.barbershop.findUnique({
      where: { ownerId: userId },
    });

    if (existingBarbershop) {
      delete (fieldsToValidate as any).slug;
    }

    const validatedFields = UserProfileSchema.safeParse(fieldsToValidate);

    if (!validatedFields.success) {
      return {
        success: null,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, barbershopName } = validatedFields.data;
    const slug = validatedFields.data.slug;

    if (!existingBarbershop && !slug) {
      return {
        success: null,
        error:
          "La URL personalizada es un campo requerido al crear tu perfil por primera vez.",
      };
    }

    if (slug) {
      const slugConflict = await prisma.barbershop.findFirst({
        where: { slug: slug, ownerId: { not: userId } },
      });
      if (slugConflict) {
        return {
          success: null,
          error: { slug: ["Esta URL ya está en uso. Por favor, elige otra."] },
        };
      }
    }

    const [updatedUser, finalBarbershop] = await prisma.$transaction(
      async (tx) => {
        let barbershop: Barbershop;

        if (existingBarbershop) {
          barbershop = await tx.barbershop.update({
            where: { ownerId: userId },
            data: { name: barbershopName },
          });
        } else {
          barbershop = await tx.barbershop.create({
            data: {
              name: barbershopName,
              slug: slug!,
              owner: { connect: { id: userId } },
            },
          });
        }

        const user = await tx.user.update({
          where: { id: userId },
          data: {
            name,
            barbershopId: barbershop.id,
            ...(avatarUrl && { image: avatarUrl }),
          },
        });

        return [user, barbershop];
      }
    );

    return {
      success: "¡Perfil actualizado con éxito!",
      error: null,
      newName: updatedUser.name,
      newImageUrl: updatedUser.image,
      newSlug: finalBarbershop.slug,
    };
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    return {
      success: null,
      error: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
    };
  }
}

export async function deleteClient(clientId: string) {
  const { user, error: authError } = await getCurrentUserAndBarbershop();
  if (authError) return { error: authError };

  try {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        bookings: {
          some: {
            barberId: user!.id,
          },
        },
      },
    });

    if (!client) {
      return { error: "No tienes permiso para eliminar este cliente." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({
        where: {
          OR: [
            { clientId: clientId },
            { message: { contains: `con ${client.name}` } },
          ],
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
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

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

    revalidatePath("/dashboard");

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
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

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

export async function createBooking(
  prevState: any,
  formData: FormData
): Promise<FormState> {
  const {
    user,
    barbershopId,
    error: authError,
  } = await getCurrentUserAndBarbershop();
  if (authError) return { success: null, error: authError };

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

    const workingHours = await prisma.workingHours.findUnique({
      where: {
        barberId_dayOfWeek: {
          barberId: user!.id,
          dayOfWeek: dayOfWeek,
        },
      },
    });

    if (!workingHours || !workingHours.isWorking) {
      const dayName = new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
      }).format(startTime);
      return {
        success: null,
        error: `No es posible agendar un turno porque no trabajas los ${dayName}.`,
      };
    }

    const bookingTime =
      startTime.getHours().toString().padStart(2, "0") +
      ":" +
      startTime.getMinutes().toString().padStart(2, "0");

    if (
      bookingTime < workingHours.startTime ||
      bookingTime >= workingHours.endTime
    ) {
      return {
        success: null,
        error: `El turno está fuera del horario laboral (${workingHours.startTime} - ${workingHours.endTime}).`,
      };
    }

    await prisma.$transaction(async (tx) => {
      const client = await tx.client.upsert({
        where: { phone: clientPhone },
        update: { name: clientName },
        create: {
          name: clientName,
          phone: clientPhone,
          barbershopId: barbershopId!,
        },
      });

      await tx.booking.create({
        data: {
          startTime,
          barberId: user!.id,
          clientId: client.id,
          serviceId: serviceId,
          barbershopId: barbershopId!,
        },
      });
    });

    revalidatePath("/dashboard");
    return { success: "Turno creado con éxito.", error: null };
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

  const session = await auth();
  if (!session?.user?.id) {
    return { success: null, error: "No autorizado." };
  }
  if (!clientId) {
    return { success: null, error: "ID de cliente no encontrado." };
  }

  try {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        barbershop: {
          barbers: {
            some: {
              id: session.user.id,
            },
          },
        },
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
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

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
  const { user, error: authError } = await getCurrentUserAndBarbershop();
  if (authError) return { error: authError };

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
  const { user, error: authError } = await getCurrentUserAndBarbershop();
  if (authError) return { error: authError };

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
