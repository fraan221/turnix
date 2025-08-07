"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";
import { Resend } from "resend";
import { ResetPasswordEmail } from "@/emails/ResetPasswordEmail";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY);

const phoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s-()]/g, ""))
  .pipe(
    z.string().min(8, "El número de teléfono debe tener al menos 8 dígitos.")
  )
  .pipe(
    z
      .string()
      .max(15, "El número de teléfono no puede tener más de 15 dígitos.")
  )
  .pipe(
    z
      .string()
      .regex(/^[0-9]+$/, "El número de teléfono solo puede contener dígitos.")
  );

const RegisterSchema = z
  .object({
    role: z.enum(["OWNER", "BARBER"]),
    name: z
      .string()
      .min(3, { message: "El nombre debe tener al menos 3 caracteres." })
      .max(50, { message: "El nombre no puede exceder los 50 caracteres." }),
    barbershopName: z
      .string()
      .min(3, {
        message: "El nombre de la barbería debe tener al menos 3 caracteres.",
      })
      .max(50, {
        message: "El nombre de la barbería no puede exceder los 50 caracteres.",
      })
      .optional(),
    phone: phoneSchema.optional(),
    email: z
      .string()
      .email({ message: "Por favor, ingresa una dirección de email válida." }),
    password: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
      .regex(/[A-Z]/, {
        message: "La contraseña debe contener al menos una mayúscula.",
      })
      .regex(/[a-z]/, {
        message: "La contraseña debe contener al menos una minúscula.",
      })
      .regex(/[0-9]/, {
        message: "La contraseña debe contener al menos un número.",
      })
      .regex(/[^A-Za-z0-9]/, {
        message:
          "La contraseña debe contener al menos un símbolo (ej: !@#$%*).",
      }),
  })
  .superRefine((data, ctx) => {
    if (
      data.role === "OWNER" &&
      (!data.barbershopName || data.barbershopName.trim() === "")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["barbershopName"],
        message: "El nombre de la barbería es requerido.",
      });
    }
  });

const CompleteProfileSchema = z
  .object({
    role: z.enum(["OWNER", "BARBER"]),
    barbershopName: z.string().optional(),
    phone: phoneSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "OWNER" && !data.barbershopName) {
      ctx.addIssue({
        code: "custom",
        path: ["barbershopName"],
        message: "El nombre de la barbería es obligatorio.",
      });
    }
  });

const generateSlug = async (
  name: string,
  prismaClient: any = prisma
): Promise<string> => {
  const baseSlug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  let slug = baseSlug;
  let count = 1;
  while (await prismaClient.barbershop.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
};

type CompleteProfileState = {
  success?: string;
  error?: string;
  fieldErrors?: {
    role?: string[];
    barbershopName?: string[];
    phone?: string[];
  };
  updatedData?: {
    role: "OWNER" | "BARBER";
    slug: string | null;
  };
} | null;

export async function registerBarber(prevState: any, formData: FormData) {
  const validatedFields = RegisterSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: "Datos inválidos. Por favor, revisa el formulario.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, role, barbershopName, phone } =
    validatedFields.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Ya existe un usuario con este email." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    if (role === "OWNER" && barbershopName) {
      await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
            phone,
            role: Role.OWNER,
          },
        });

        const newBarbershop = await tx.barbershop.create({
          data: {
            name: barbershopName,
            slug: await generateSlug(barbershopName, tx),
            ownerId: newUser.id,
          },
        });

        await tx.user.update({
          where: { id: newUser.id },
          data: {
            barbershopId: newBarbershop.id,
          },
        });
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          phone,
          role: Role.BARBER,
        },
      });
    }

    return { success: "¡Cuenta creada con éxito! Serás redirigido al login." };
  } catch (error) {
    console.error(error);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }
}

export async function completeGoogleRegistration(
  prevState: null,
  formData: FormData
): Promise<CompleteProfileState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  const validatedFields = CompleteProfileSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: "Datos inválidos. Por favor, revisa el formulario.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { role, barbershopName, phone } = validatedFields.data;
  const userId = session.user.id;

  try {
    let finalSlug: string | null = null;

    if (role === "OWNER" && barbershopName) {
      const barbershop = await prisma.$transaction(async (tx) => {
        const b = await tx.barbershop.upsert({
          where: { ownerId: userId },
          update: { name: barbershopName },
          create: {
            name: barbershopName,
            slug: await generateSlug(barbershopName, tx),
            ownerId: userId,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { role: Role.OWNER, phone, barbershopId: b.id },
        });

        return b;
      });
      finalSlug = barbershop.slug;
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { role: Role.BARBER, phone },
      });
    }

    return {
      success: "¡Perfil completado con éxito!",
      updatedData: { role, slug: finalSlug },
    };
  } catch (error) {
    console.error(error);
    return { error: "No se pudo completar el registro. Intenta de nuevo." };
  }
}

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString();
  if (!email) {
    return { error: "El email es requerido." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.email) {
    return {
      success:
        "Si tu email está registrado, recibirás un enlace para restablecer tu contraseña.",
    };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const passwordResetExpires = new Date(Date.now() + 3600000);

  await prisma.user.update({
    where: { email },
    data: {
      passwordResetToken,
      passwordResetExpires,
    },
  });

  const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

  try {
    const data = await resend.emails.send({
      from: "Turnix <contacto@turnix.app>",
      to: user.email,
      subject: "Restablece tu contraseña de Turnix",
      react: ResetPasswordEmail({ userName: user.name, resetLink }),
    });

    if (data.error) {
      console.error("Error desde Resend:", data.error);
      return {
        error: "No se pudo enviar el correo. Por favor, intenta más tarde.",
      };
    }

    return {
      success:
        "Si tu email está registrado, recibirás un enlace para restablecer tu contraseña.",
    };
  } catch (error) {
    console.error("Error al enviar el email:", error);
    return {
      error: "No se pudo enviar el correo. Por favor, intenta más tarde.",
    };
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const token = formData.get("token")?.toString();

  if (!password || !confirmPassword || !token) {
    return { error: "Todos los campos son requeridos." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const passwordValidation = RegisterSchema.shape.password.safeParse(password);
  if (!passwordValidation.success) {
    return { error: passwordValidation.error.issues[0].message };
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gte: new Date() },
    },
  });

  if (!user) {
    return {
      error:
        "El token es inválido o ha expirado. Por favor, solicita un nuevo enlace.",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return {
    success: "¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.",
  };
}
