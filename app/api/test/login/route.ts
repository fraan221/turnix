import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import crypto from "crypto";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error(
      "Error crítico: La variable de entorno AUTH_SECRET no está definida."
    );
    return new NextResponse(
      JSON.stringify({ error: "Configuración del servidor incompleta." }),
      { status: 500 }
    );
  }

  const cookieName = "authjs.session-token";

  try {
    const newUser = await prisma.user.create({
      data: {
        name: "Usuario de Prueba Programático",
        email: `test-user-${Date.now()}@turnix.app`,
        emailVerified: new Date(),
      },
    });

    const token = await encode({
      token: {
        sub: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      secret,
      salt: cookieName,
    });

    return NextResponse.json({
      name: cookieName,
      value: token,
    });
  } catch (error) {
    console.error("Error en la ruta de login de prueba:", error);
    return new NextResponse(
      JSON.stringify({ error: "No se pudo crear la sesión de prueba." }),
      { status: 500 }
    );
  }
}
