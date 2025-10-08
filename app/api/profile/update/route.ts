import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { Role } from "@prisma/client";
import { z } from "zod";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

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
  barbershopDescription: z.string().optional(),
  barbershopAddress: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Acción no autorizada." },
      { status: 401 }
    );
  }

  const user = session.user;
  const userId = user.id;
  const userRole = user.role;

  try {
    const formData = await request.formData();
    const avatarFile = formData.get("avatar") as File | null;
    let avatarUrl: string | undefined = undefined;

    if (avatarFile && avatarFile.size > 0) {
      const blob = await put(avatarFile.name, avatarFile, {
        access: "public",
        addRandomSuffix: true,
      });
      avatarUrl = blob.url;
    }

    const barbershopImageFile = formData.get("barbershopImage") as File | null;
    let barbershopImageUrl: string | undefined = undefined;

    if (barbershopImageFile && barbershopImageFile.size > 0) {
      const blob = await put(barbershopImageFile.name, barbershopImageFile, {
        access: "public",
        addRandomSuffix: true,
      });
      barbershopImageUrl = blob.url;
    }

    const fieldsToValidate: { [key: string]: FormDataEntryValue | null } = {
      name: formData.get("name"),
      phone: formData.get("phone"),
    };

    if (userRole === Role.OWNER) {
      fieldsToValidate.barbershopName = formData.get("barbershopName");
      fieldsToValidate.slug = formData.get("slug");
      fieldsToValidate.barbershopDescription = formData.get(
        "barbershopDescription"
      );
      fieldsToValidate.barbershopAddress = formData.get("barbershopAddress");
    }

    const validatedFields = UserProfileSchema.safeParse(fieldsToValidate);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, phone } = validatedFields.data;
    const dataToUpdate = {
      name,
      phone,
      ...(avatarUrl && { image: avatarUrl }),
    };

    if (userRole === Role.OWNER) {
      const { barbershopName, slug, barbershopAddress, barbershopDescription } =
        validatedFields.data;
      const existingBarbershop = await prisma.barbershop.findUnique({
        where: { ownerId: userId },
      });

      if (!existingBarbershop && !slug) {
        return NextResponse.json(
          { error: "La URL personalizada es requerida al crear tu perfil." },
          { status: 400 }
        );
      }

      if (slug) {
        const slugConflict = await prisma.barbershop.findFirst({
          where: { slug: slug, ownerId: { not: userId } },
        });
        if (slugConflict) {
          return NextResponse.json(
            { error: { slug: ["Esta URL ya está en uso. Elige otra."] } },
            { status: 409 }
          );
        }
      }

      const [updatedUser, finalBarbershop] = await prisma.$transaction(
        async (tx) => {
          const barbershop = await tx.barbershop.upsert({
            where: { ownerId: userId },
            update: {
              name: barbershopName!,
              description: barbershopDescription,
              address: barbershopAddress,
              ...(barbershopImageUrl && { image: barbershopImageUrl }),
            },
            create: {
              name: barbershopName!,
              slug: slug!,
              description: barbershopDescription,
              address: barbershopAddress,
              ...(barbershopImageUrl && { image: barbershopImageUrl }),
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

      revalidatePath("/dashboard/settings");

      if (finalBarbershop.slug) {
        revalidateTag(`barber-profile:${finalBarbershop.slug}`);
      }

      return NextResponse.json({
        success: "¡Perfil actualizado con éxito!",
        data: {
          user: updatedUser,
          barbershop: finalBarbershop,
        },
      });
    } else {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        include: {
          teamMembership: {
            include: {
              barbershop: {
                select: { slug: true },
              },
            },
          },
        },
      });

      revalidatePath("/dashboard/settings");

      const barbershopSlug = updatedUser.teamMembership?.barbershop.slug;
      if (barbershopSlug) {
        revalidateTag(`barber-profile:${barbershopSlug}`);
      }

      return NextResponse.json({
        success: "¡Perfil actualizado con éxito!",
        data: {
          user: updatedUser,
        },
      });
    }
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el perfil. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
