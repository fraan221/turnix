"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  barbershopName: z.string().optional(),
  email: z.string().email({ message: "Por favor, ingresa un email válido." }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
    .regex(/[a-zA-Z]/, {
      message: "La contraseña debe contener al menos una letra.",
    })
    .regex(/\d/, {
      message: "La contraseña debe contener al menos un número.",
    }),
});

export async function registerBarber(prevState: any, formData: FormData) {
  const validatedFields = RegisterSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: "Por favor, corrige los errores en el formulario.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, barbershopName, email, password } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return { error: "Ya existe un usuario con este email." };
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

    return { success: "¡Cuenta creada con éxito! Serás redirigido al login." };
  } catch (error) {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }
}
