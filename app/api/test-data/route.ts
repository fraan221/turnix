import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teamMembership: {
          include: {
            barbershop: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        ownedBarbershop: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      role: user.role,
      teamMembership: user.teamMembership,
      barbershop: user.ownedBarbershop || user.teamMembership?.barbershop,
      hasTeam: !!user.teamMembership,
    });
  } catch (error) {
    console.error("Error en /api/test-data:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
