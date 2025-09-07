"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { BookingStatus, Barbershop, Role } from "@prisma/client";
import { z } from "zod";
import { put } from "@vercel/blob";

async function getCurrentUserAndBarbershop() {
  const session = await auth();
  if (!session?.user?.id) {
    return { user: null, barbershopId: null, error: "No autorizado" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: true,
      teamMembership: true,
    },
  });

  if (!user) {
    return { user: null, barbershopId: null, error: "Usuario no encontrado." };
  }

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;

  if (!barbershopId) {
    return {
      user,
      barbershopId: null,
      error: "Usuario no asociado a una barbería.",
    };
  }

  return { user, barbershopId, error: null };
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

const phoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s-()]/g, ""))
  .pipe(z.string().min(8, "El teléfono debe tener al menos 8 dígitos."))
  .pipe(z.string().max(15, "El teléfono no puede tener más de 15 dígitos."))
  .pipe(
    z.string().regex(/^[0-9]+$/, "El teléfono solo puede contener números.")
  );

const UserProfileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  phone: phoneSchema.optional().or(z.literal("")),
  barbershopName: z
    .string()
    .min(1, "El nombre de la barbería es requerido.")
    .optional(),
  slug: z
    .string()
    .min(3, "La URL debe tener al menos 3 caracteres.")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Formato de URL no válido. Usa solo minúsculas, números y guiones."
    )
    .optional(),
});

const WorkScheduleBlockSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

const DayScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isWorking: z.boolean(),
  blocks: z.array(WorkScheduleBlockSchema),
});

const ScheduleSchema = z.array(DayScheduleSchema).refine(
  (schedule) => {
    for (const day of schedule) {
      if (day.isWorking) {
        for (const block of day.blocks) {
          if (block.startTime >= block.endTime) {
            return false;
          }
        }
      }
    }
    return true;
  },
  {
    message: "La hora de inicio debe ser anterior a la hora de fin",
    // Esta función de path es compleja de tipar correctamente en el refine,
    // por lo que simplificaremos el mensaje de error para evitar complejidad.
  }
);

export async function saveSchedule(schedule: z.infer<typeof ScheduleSchema>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== Role.OWNER) {
    return { error: "Acción no autorizada." };
  }

  const validatedSchedule = ScheduleSchema.safeParse(schedule);

  if (!validatedSchedule.success) {
    // Encontrar el día que falló para un mensaje de error más útil
    const erroringDayIndex = schedule.findIndex(
      (day) =>
        day.isWorking &&
        day.blocks.some((block) => block.startTime >= block.endTime)
    );
    const dayName =
      erroringDayIndex !== -1 ? daysOfWeek[erroringDayIndex] : "un día";

    return {
      error: `${validatedSchedule.error.issues[0].message} (en ${dayName}).`,
    };
  }

  const barberId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      for (const day of validatedSchedule.data) {
        const workingHoursRecord = await tx.workingHours.upsert({
          where: {
            barberId_dayOfWeek: {
              barberId: barberId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: {
            isWorking: day.isWorking,
            // Limpiamos los campos antiguos
            startTime: null,
            endTime: null,
          },
          create: {
            barberId: barberId,
            dayOfWeek: day.dayOfWeek,
            isWorking: day.isWorking,
          },
        });

        await tx.workScheduleBlock.deleteMany({
          where: { workingHoursId: workingHoursRecord.id },
        });

        if (day.isWorking && day.blocks.length > 0) {
          await tx.workScheduleBlock.createMany({
            data: day.blocks.map((block) => ({
              startTime: block.startTime,
              endTime: block.endTime,
              workingHoursId: workingHoursRecord.id,
            })),
          });
        }
      }
    });

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
  const userRole = session.user.role;

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

    const fieldsToValidate: { [key: string]: FormDataEntryValue | null } = {
      name: formData.get("name"),
      phone: formData.get("phone"),
    };

    if (userRole === Role.OWNER) {
      fieldsToValidate.barbershopName = formData.get("barbershopName");
      fieldsToValidate.slug = formData.get("slug");
    }

    const validatedFields = UserProfileSchema.safeParse(fieldsToValidate);

    if (!validatedFields.success) {
      return {
        success: null,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, phone } = validatedFields.data;
    const dataToUpdate = {
      name,
      phone,
      ...(avatarUrl && { image: avatarUrl }),
    };

    if (userRole === Role.OWNER) {
      const { barbershopName, slug } = validatedFields.data;
      const existingBarbershop = await prisma.barbershop.findUnique({
        where: { ownerId: userId },
      });

      if (!existingBarbershop && !slug) {
        return {
          success: null,
          error: "La URL personalizada es requerida al crear tu perfil.",
        };
      }

      if (slug) {
        const slugConflict = await prisma.barbershop.findFirst({
          where: { slug: slug, ownerId: { not: userId } },
        });
        if (slugConflict) {
          return {
            success: null,
            error: { slug: ["Esta URL ya está en uso. Elige otra."] },
          };
        }
      }

      const [updatedUser, finalBarbershop] = await prisma.$transaction(
        async (tx) => {
          const barbershop = await tx.barbershop.upsert({
            where: { ownerId: userId },
            update: { name: barbershopName! },
            create: {
              name: barbershopName!,
              slug: slug!,
              owner: { connect: { id: userId } },
            },
          });

          const user = await tx.user.update({
            where: { id: userId },
            data: dataToUpdate,
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
    } else {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });

      return {
        success: "¡Perfil actualizado con éxito!",
        error: null,
        newName: updatedUser.name,
        newImageUrl: updatedUser.image,
        newSlug: null,
      };
    }
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    return {
      success: null,
      error: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
    };
  }
}

export async function deleteClient(clientId: string) {
  const {
    user,
    barbershopId,
    error: authError,
  } = await getCurrentUserAndBarbershop();

  if (authError || !barbershopId) {
    return { error: authError || "No se encontró la barbería." };
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

  const { barbershopId, error: authError } =
    await getCurrentUserAndBarbershop();

  if (authError || !barbershopId) {
    return { success: null, error: authError || "No se encontró la barbería." };
  }

  if (!clientId) {
    return { success: null, error: "ID de cliente no encontrado." };
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
