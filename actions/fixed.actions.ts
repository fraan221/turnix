"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserForSettings } from "@/lib/data";
import { revalidatePath } from "next/cache";
import {
  RecurringBookingSchema,
  SuspendRecurringBookingSchema,
} from "@/lib/schemas";
import { generateUpcomingBookingDates } from "@/lib/recurring-bookings";
import { Role } from "@prisma/client";
import { addWeeks } from "date-fns";

export async function createRecurringBooking(
  data: z.infer<typeof RecurringBookingSchema>
) {
  const user = await getUserForSettings();
  const barbershopId = user?.ownedBarbershop?.id || user?.teamMembership?.barbershop?.id;
  if (!user || !barbershopId) return { error: "No autorizado." };

  const parsed = RecurringBookingSchema.safeParse(data);
  if (!parsed.success) return { error: "Datos inválidos." };
  const values = parsed.data;

  // Si el usuario es dueño, puede asignar a otro barbero
  let targetBarberId = user.id;
  if (user.role === Role.OWNER && values.barberId) {
    // Validar que el barbero pertenece a la barbería
    const targetBarber = await prisma.user.findFirst({
      where: {
        id: values.barberId,
        OR: [
          { ownedBarbershop: { id: barbershopId } },
          { teamMembership: { barbershopId } }
        ]
      }
    });

    if (!targetBarber) return { error: "El barbero seleccionado no es válido." };
    targetBarberId = values.barberId;
  }

  try {
    const service = await prisma.service.findFirst({
      where: { id: values.serviceId, barbershopId },
    });
    if (!service) return { error: "Servicio no encontrado." };

    const client = await prisma.client.findFirst({
      where: { id: values.clientId, barbershopId },
    });
    if (!client) return { error: "Cliente no encontrado." };

    let weekOfMonth = null;
    if (values.frequency === "MONTHLY") {
      weekOfMonth = 1; // Asumimos por defecto "El primer día de semana del mes"
    }

    await prisma.$transaction(async (tx) => {
      const recurringBooking = await tx.recurringBooking.create({
        data: {
          barbershopId,
          barberId: targetBarberId,
          clientId: values.clientId,
          serviceId: values.serviceId,
          dayOfWeek: values.dayOfWeek,
          startTime: values.startTime,
          frequency: values.frequency,
          weekOfMonth,
        },
      });

      const upcomingDates = generateUpcomingBookingDates(
        {
          createdAt: recurringBooking.createdAt,
          dayOfWeek: recurringBooking.dayOfWeek,
          startTime: recurringBooking.startTime,
          frequency: recurringBooking.frequency,
          weekOfMonth: recurringBooking.weekOfMonth,
        },
        4 // 4 semanas adelante
      );

      if (upcomingDates.length > 0) {
        await tx.booking.createMany({
          data: upcomingDates.map((date) => ({
            startTime: date,
            status: "SCHEDULED",
            barbershopId,
            barberId: targetBarberId,
            clientId: values.clientId,
            serviceId: values.serviceId,
            priceAtBooking: service.price,
            durationAtBooking: service.durationInMinutes,
            activeDurationAtBooking: service.activeDurationInMinutes,
            recurringBookingId: recurringBooking.id,
          })),
        });
      }
    });

    revalidatePath("/dashboard/fixed");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard");

    return { success: "Turno fijo creado exitosamente." };
  } catch (error) {
    console.error("Error creating recurring booking:", error);
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return {
          error: "Ya existe un turno fijo con esta frecuencia y horario para el barbero.",
        };
      }
      if (error.code === "P2003") {
        return {
          error: "Error de integridad: el barbero, cliente o servicio asociado ya no es válido.",
        };
      }
    }
    return { error: "No se pudo crear el turno fijo." };
  }
}

export async function suspendRecurringBooking(
  data: z.infer<typeof SuspendRecurringBookingSchema>
) {
  const user = await getUserForSettings();
  const barbershopId = user?.ownedBarbershop?.id || user?.teamMembership?.barbershop?.id;
  if (!user || !barbershopId) return { error: "No autorizado." };

  const parsed = SuspendRecurringBookingSchema.safeParse(data);
  if (!parsed.success) return { error: "Datos inválidos." };
  const values = parsed.data;

  try {
    const recurringBooking = await prisma.recurringBooking.findFirst({
      where: { id: values.recurringBookingId, barbershopId },
    });

    if (!recurringBooking) return { error: "Turno fijo no encontrado." };

    // Pausa indefinida (año 2099)
    const suspendUntilDate = new Date("2099-12-31T23:59:59Z");

    await prisma.$transaction(async (tx) => {
      await tx.recurringBooking.update({
        where: { id: recurringBooking.id },
        data: { suspendedUntil: suspendUntilDate },
      });

      // Cancelamos todos los bookings futuros programados que caen en este período de suspensión
      await tx.booking.updateMany({
        where: {
          recurringBookingId: recurringBooking.id,
          startTime: {
            gte: new Date(),
            lte: suspendUntilDate,
          },
          status: "SCHEDULED",
        },
        data: {
          status: "CANCELLED",
        },
      });
    });

    revalidatePath("/dashboard/fixed");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard");

    return {
      success:
        "Turno fijo suspendido exitosamente. Los turnos en este período han sido cancelados y el horario fue liberado.",
    };
  } catch (error) {
    console.error("Error suspending recurring booking:", error);
    return { error: "No se pudo suspender el turno fijo." };
  }
}

export async function resumeRecurringBooking(id: string) {
  const user = await getUserForSettings();
  const barbershopId = user?.ownedBarbershop?.id || user?.teamMembership?.barbershop?.id;
  if (!user || !barbershopId) return { error: "No autorizado." };

  try {
    const recurringBooking = await prisma.recurringBooking.findFirst({
      where: { id, barbershopId },
      include: { service: true },
    });

    if (!recurringBooking) return { error: "Turno fijo no encontrado." };

    await prisma.$transaction(async (tx) => {
      // 1. Quitar la suspensión
      await tx.recurringBooking.update({
        where: { id: recurringBooking.id },
        data: { suspendedUntil: null },
      });

      // 2. Generar bookings faltantes
      const existingBookings = await tx.booking.findMany({
        where: {
          recurringBookingId: recurringBooking.id,
          startTime: { gte: new Date() },
          status: { not: "CANCELLED" }, 
        },
        select: { startTime: true },
      });

      const existingTimes = new Set(
        existingBookings.map((b) => b.startTime.getTime())
      );

      const upcomingDates = generateUpcomingBookingDates(
        {
          createdAt: recurringBooking.createdAt,
          dayOfWeek: recurringBooking.dayOfWeek,
          startTime: recurringBooking.startTime,
          frequency: recurringBooking.frequency,
          weekOfMonth: recurringBooking.weekOfMonth,
          suspendedUntil: null,
        },
        4
      );

      // Evitamos crear turnos que ya existan (para no duplicar)
      const datesToCreate = upcomingDates.filter(
        (date) => !existingTimes.has(date.getTime())
      );

      if (datesToCreate.length > 0) {
        await tx.booking.createMany({
          data: datesToCreate.map((date) => ({
            startTime: date,
            status: "SCHEDULED",
            barbershopId,
            barberId: recurringBooking.barberId,
            clientId: recurringBooking.clientId,
            serviceId: recurringBooking.serviceId,
            priceAtBooking: recurringBooking.service.price,
            durationAtBooking: recurringBooking.service.durationInMinutes,
            activeDurationAtBooking: recurringBooking.service.activeDurationInMinutes,
            recurringBookingId: recurringBooking.id,
          })),
        });
      }
    });

    revalidatePath("/dashboard/fixed");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard");

    return { success: "Turno fijo reactivado exitosamente." };
  } catch (error) {
    console.error("Error resuming recurring booking:", error);
    return { error: "No se pudo reactivar el turno fijo." };
  }
}

export async function deleteRecurringBooking(id: string) {
  const user = await getUserForSettings();
  const barbershopId = user?.ownedBarbershop?.id || user?.teamMembership?.barbershop?.id;
  if (!user || !barbershopId) return { error: "No autorizado." };

  try {
    await prisma.$transaction(async (tx) => {
      // Soft delete (isActive = false) en lugar de borrar físicamente
      await tx.recurringBooking.update({
        where: { id, barbershopId },
        data: { isActive: false },
      });

      // Cancelar todos los turnos futuros vinculados
      await tx.booking.updateMany({
        where: {
          recurringBookingId: id,
          startTime: { gte: new Date() },
          status: "SCHEDULED",
        },
        data: {
          status: "CANCELLED",
        },
      });
    });

    revalidatePath("/dashboard/fixed");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard");

    return { success: "Turno fijo cancelado definitivamente." };
  } catch (error) {
    console.error("Error deleting recurring booking:", error);
    return { error: "No se pudo cancelar el turno fijo." };
  }
}
