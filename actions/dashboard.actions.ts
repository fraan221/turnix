'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createService(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const name = formData.get('name')?.toString();
  const price = parseFloat(formData.get('price')?.toString() || '0');
  const duration = parseInt(formData.get('duration')?.toString() || '0');

  if (!name || price <= 0 || duration <= 0) {
    throw new Error('Datos del servicio inválidos.');
  }

  await prisma.service.create({
    data: {
      name,
      price,
      durationInMinutes: duration,
      barberId: session.user.id,
    },
  });

  revalidatePath('/dashboard/services');
}

export async function deleteService(serviceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (service?.barberId !== session.user.id) {
    throw new Error('No tienes permiso para borrar este servicio.');
  }

  await prisma.service.delete({
    where: { id: serviceId },
  });

  revalidatePath('/dashboard/services');
}

export async function updateWorkingHours(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const isWorking = formData.get(`${day}-isWorking`) === 'on';
    const startTime = formData.get(`${day}-startTime`)?.toString() || '09:00';
    const endTime = formData.get(`${day}-endTime`)?.toString() || '18:00';

    await prisma.workingHours.upsert({
      where: { barberId_dayOfWeek: { barberId: session.user.id, dayOfWeek: i } },
      update: { isWorking, startTime, endTime },
      create: {
        barberId: session.user.id,
        dayOfWeek: i,
        isWorking,
        startTime,
        endTime,
      },
    });
  }

  revalidatePath('/dashboard/schedule');
}

export async function createTimeBlock(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const startDate = formData.get('startDate')?.toString();
  const startTime = formData.get('startTime')?.toString();
  const endDate = formData.get('endDate')?.toString();
  const endTime = formData.get('endTime')?.toString();
  const reason = formData.get('reason')?.toString();

  if (!startDate || !startTime || !endDate || !endTime) {
    throw new Error('Fechas y horas de inicio y fin son requeridas.');
  }

  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);

  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
     throw new Error('Formato de fecha u hora inválido.');
  }

  await prisma.timeBlock.create({
    data: {
      startTime: startDateTime,
      endTime: endDateTime,
      reason: reason,
      barberId: session.user.id,
    },
  });

  revalidatePath('/dashboard/schedule');
}

export async function deleteTimeBlock(blockId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const block = await prisma.timeBlock.findUnique({
    where: { id: blockId },
  });

  if (block?.barberId !== session.user.id) {
    throw new Error('No tienes permiso para borrar este bloqueo.');
  }

  await prisma.timeBlock.delete({
    where: { id: blockId },
  });

  revalidatePath('/dashboard/schedule');
}

export async function updateClientNotes(clientId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const notes = formData.get('notes')?.toString();

  await prisma.client.update({
    where: { id: clientId },
    data: {
      notes: notes,
    },
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function createBooking(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const serviceId = formData.get('serviceId')?.toString();
  const clientName = formData.get('clientName')?.toString();
  const clientPhone = formData.get('clientPhone')?.toString();
  const startTimeStr = formData.get('startTime')?.toString();

  if (!serviceId || !clientName || !clientPhone || !startTimeStr) {
    throw new Error('Todos los campos son requeridos para crear el turno.');
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
      barberId: session.user.id,
      clientId: client.id,
      serviceId: serviceId,
    },
  });

  revalidatePath('/dashboard');
}

export async function updateUserProfile(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const name = formData.get('name')?.toString();
  const barbershopName = formData.get('barbershopName')?.toString();
  let slug = formData.get('slug')?.toString();

  if (!name || !slug) {
    return { error: "El nombre y la URL personalizada son requeridos." };
  }

  slug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const existingSlug = await prisma.user.findFirst({
    where: {
      slug: slug,
      id: { not: session.user.id },
    },
  });

  if (existingSlug) {
    return { error: "Esa URL personalizada ya está en uso. Por favor, elige otra." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      barbershopName,
      slug,
    },
  });

  revalidatePath('/dashboard/settings');
  return { success: "¡Perfil actualizado con éxito!" };
}