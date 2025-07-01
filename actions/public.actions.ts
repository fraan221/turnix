'use server';

import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from 'date-fns';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
          select:{
              durationInMinutes: true,
          },
        },
      },
    }),
    prisma.timeBlock.findMany({
      where: {
        barberId: barberId,
        OR: [
          { startTime: { lte: endOfDay(date) }, endTime: { gte: startOfDay(date) } },
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

export async function createPublicBooking(formData: FormData) {
  const barberId = formData.get('barberId')?.toString();
  const serviceId = formData.get('serviceId')?.toString();
  const clientName = formData.get('clientName')?.toString();
  const clientPhone = formData.get('clientPhone')?.toString();
  const startTimeStr = formData.get('startTime')?.toString();

  if (!barberId || !serviceId || !clientName || !clientPhone || !startTimeStr) {
    throw new Error('Faltan datos para crear la reserva.');
  }

  const startTime = new Date(startTimeStr);

  const client = await prisma.client.upsert({
    where: { phone: clientPhone },
    update: { name: clientName },
    create: { name: clientName, phone: clientPhone },
  });

  await prisma.booking.create({
    data: {
      startTime,
      barberId,
      clientId: client.id,
      serviceId,
    },
  });

  const barber = await prisma.user.findUnique({ where: { id: barberId }});
  if (barber?.slug) {
    revalidatePath(`/${barber.slug}`);
  }

  redirect('/booking-confirmed');
}