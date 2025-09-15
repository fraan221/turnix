"use server";

import { getCurrentUser } from "@/lib/data";
import prisma from "@/lib/prisma";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/get-base-url";

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
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado. Por favor, inicia sesión de nuevo." };
  }

  if (!user.email) {
    return { error: "Usuario no encontrado o sin email configurado." };
  }

  try {
    const preapproval = new PreApproval(client);

    console.log(`Buscando suscripción pendiente para el usuario: ${user.id}`);
    const searchResult = await preapproval.search({
      options: {
        external_reference: user.id,
        status: "pending",
      },
    });

    if (searchResult.results && searchResult.results.length > 0) {
      const existingSubscription = searchResult.results[0];
      const initPoint = existingSubscription.init_point;

      if (initPoint) {
        console.log(
          "Suscripción pendiente encontrada. Redirigiendo a link existente."
        );
        return { init_point: initPoint };
      }
    }

    console.log("No se encontró suscripción pendiente. Creando una nueva.");

    const response = await preapproval.create({
      body: {
        reason: "Suscripción Plan PRO Turnix",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 9900,
          currency_id: "ARS",
        },
        back_url: `${getBaseUrl()}/dashboard?subscription=success`,
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

export async function cancelSubscription(
  mercadopagoSubscriptionId: string
): Promise<{ error?: string; success?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado." };
  }

  const subscriptionInDb = await prisma.subscription.findUnique({
    where: { mercadopagoSubscriptionId },
  });

  if (subscriptionInDb?.userId !== user.id) {
    return { error: "No tienes permiso para cancelar esta suscripción." };
  }

  try {
    const preapproval = new PreApproval(client);
    const result = await preapproval.update({
      id: mercadopagoSubscriptionId,
      body: {
        status: "cancelled",
      },
    });

    if (result.status === "cancelled") {
      await prisma.subscription.update({
        where: { mercadopagoSubscriptionId },
        data: { status: "cancelled" },
      });
      revalidatePath("/dashboard/billing");
      return { success: "Tu suscripción ha sido cancelada con éxito." };
    } else {
      return { error: "Mercado Pago no pudo procesar la cancelación." };
    }
  } catch (error) {
    console.error("Error al cancelar la suscripción en Mercado Pago:", error);
    return { error: "Ocurrió un error al comunicarnos con Mercado Pago." };
  }
}
