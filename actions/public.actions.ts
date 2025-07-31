"use server";

import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { startOfDay, endOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

export async function getBarberAvailability(barberId: string, date: Date) {
  const dayOfWeek = date.getDay();

  const [workingHours, bookings, timeBlocks] = await Promise.all([
    prisma.workingHours.findUnique({
      where: {
        barberId_dayOfWeek: {
          barberId: barberId,
          dayOfWeek: dayOfWeek,
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        barberId: barberId,
        startTime: {
          gte: startOfDay(date),
          lt: endOfDay(date),
        },
      },
      include: {
        service: {
          select: {
            durationInMinutes: true,
          },
        },
      },
    }),
    prisma.timeBlock.findMany({
      where: {
        barberId: barberId,
        OR: [
          {
            startTime: { lte: endOfDay(date) },
            endTime: { gte: startOfDay(date) },
          },
        ],
      },
    }),
  ]);

  return {
    workingHours,
    bookings,
    timeBlocks,
  };
}

export async function createPublicBooking(prevState: any, formData: FormData) {
  const barberId = formData.get("barberId")?.toString();
  const serviceIdsStr = formData.get("serviceIds")?.toString();
  const clientName = formData.get("clientName")?.toString();
  const clientPhone = formData.get("clientPhone")?.toString();
  const startTimeStr = formData.get("startTime")?.toString();

  const serviceId = serviceIdsStr?.split(",")[0];

  if (!barberId || !serviceId || !clientName || !clientPhone || !startTimeStr) {
    return { error: "Faltan datos para crear la reserva." };
  }

  try {
    const startTime = new Date(startTimeStr);

    const barber = await prisma.user.findUnique({
      where: { id: barberId },
      select: {
        id: true,
        barbershopId: true,
        barbershop: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!barber?.barbershopId) {
      return { error: "No se pudo encontrar la barbería asociada al barbero." };
    }

    const [client, service] = await Promise.all([
      prisma.client.upsert({
        where: { phone: clientPhone },
        update: { name: clientName },
        create: {
          name: clientName,
          phone: clientPhone,
          barbershopId: barber.barbershopId,
        },
      }),
      prisma.service.findUnique({
        where: { id: serviceId },
        select: { name: true },
      }),
    ]);

    if (!service) {
      return { error: "El servicio seleccionado ya no existe." };
    }

    await prisma.booking.create({
      data: {
        startTime,
        barber: {
          connect: {
            id: barberId,
          },
        },
        client: {
          connect: {
            id: client.id,
          },
        },
        service: {
          connect: {
            id: serviceId,
          },
        },
        barbershop: {
          connect: {
            id: barber.barbershopId,
          },
        },
      },
    });

    const newNotification = await prisma.notification.create({
      data: {
        userId: barberId,
        message: `Nuevo turno: "${service.name}" con ${clientName}`,
      },
    });

    await pusherServer.trigger(
      `notifications_${barberId}`,
      "new-notification",
      newNotification
    );

    if (barber?.barbershop?.slug) {
      revalidatePath(`/${barber.barbershop.slug}`);
    }

    return { success: "¡Turno confirmado con éxito!" };
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return {
      error: `No se pudo crear la reserva: ${error.message || error.toString()}`,
    };
  }
}
