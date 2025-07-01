'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function registerBarber(formData: FormData) {
  const name = formData.get('name')?.toString();
  const barbershopName = formData.get('barbershopName')?.toString() || null; // <-- 1. LEEMOS EL NUEVO CAMPO
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!name || !email || !password) {
    throw new Error('Todos los campos son requeridos.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: email },
  });

  if (existingUser) {
    throw new Error('Ya existe un usuario con este email.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: name,
      barbershopName: barbershopName, // <-- 2. AÑADIMOS EL CAMPO AL CREAR
      email: email,
      password: hashedPassword,
    },
  });

  redirect('/api/auth/signin');
}