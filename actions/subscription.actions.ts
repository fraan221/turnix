"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

type FormState = {
  error?: string;
  init_point?: string;
};

export async function createSubscription(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado. Por favor, inicia sesión de nuevo." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user || !user.email) {
    return { error: "Usuario no encontrado o sin email configurado." };
  }

  try {
    const preapproval = new PreApproval(client);
    const response = await preapproval.create({
      body: {
        reason: "Suscripción Plan PRO Turnix",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 9900,
          currency_id: "ARS",
        },
        back_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?subscription=success`,
        payer_email: user.email,
        status: "pending",
        external_reference: user.id,
      },
    });

    if (response.init_point) {
      return { init_point: response.init_point };
    } else {
      console.error("Respuesta inesperada de Mercado Pago:", response);
      return {
        error: "No se pudo obtener el link de pago desde Mercado Pago.",
      };
    }
  } catch (error) {
    console.error("Error al crear suscripción en Mercado Pago:", error);
    return { error: "Ocurrió un error al comunicarnos con Mercado Pago." };
  }
}
