'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function registerBarber(prevState: any, formData: FormData) {
  const name = formData.get('name')?.toString();
  const barbershopName = formData.get('barbershopName')?.toString() || null;
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!name || !email || !password) {
    return { error: 'Todos los campos obligatorios son requeridos.' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return { error: 'Ya existe un usuario con este email.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        barbershopName,
        email,
        password: hashedPassword,
      },
    });

    return { success: '¡Cuenta creada con éxito! Serás redirigido al login.' };
  } catch (error) {
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' };
  }
}
