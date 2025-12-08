"use server";

import { getCurrentUser } from "@/lib/data";
import prisma from "@/lib/prisma";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { syncSubscriptionStatus } from "@/lib/mercadopago/sync";

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

  if (!user || !user.email) {
    return { error: "No autorizado o email no configurado." };
  }

  const discountCodeString = formData.get("discountCode") as string | null;

  const STANDARD_PRICE = 9900;

  try {
    let validDiscount: {
      id: string;

      overridePrice: number;

      durationMonths: number;
    } | null = null;

    if (discountCodeString) {
      const validationResult = await validateDiscountCode(discountCodeString);

      if (
        !validationResult.success ||
        !validationResult.price ||
        !validationResult.duration
      ) {
        return {
          error: validationResult.error || "Código de descuento inválido.",
        };
      }

      const discountFromDb = await prisma.discountCode.findUnique({
        where: { code: discountCodeString.toUpperCase() },
      });

      if (discountFromDb) {
        validDiscount = {
          id: discountFromDb.id,

          overridePrice: discountFromDb.overridePrice,

          durationMonths: discountFromDb.durationMonths,
        };
      }
    }

    const transaction_amount = validDiscount
      ? validDiscount.overridePrice
      : STANDARD_PRICE;

    console.log(`Verificando suscripción activa para el usuario: ${user.id}`);

    const activeSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "authorized" },
    });

    if (activeSubscription) {
      return { error: "Ya tienes una suscripción activa." };
    }

    const preapproval = new PreApproval(client);

    console.log(
      `Buscando suscripción pendiente en la DB para el usuario: ${user.id}`
    );

    const existingPendingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,

        status: "pending",
      },
    });

    if (existingPendingSubscription) {
      console.log(
        "Suscripción pendiente encontrada en DB. Verificando con Mercado Pago."
      );

      try {
        const mpSubscription = await preapproval.get({
          id: existingPendingSubscription.mercadopagoSubscriptionId,
        });

        if (mpSubscription?.init_point && mpSubscription.status === "pending") {
          console.log("Link de pago existente y válido. Redirigiendo.");

          return { init_point: mpSubscription.init_point };
        }

        await prisma.subscription.delete({
          where: { id: existingPendingSubscription.id },
        });

        console.log(
          "Suscripción en DB era inválida en MP. Registro local eliminado."
        );
      } catch (error) {
        console.error(
          "Error al verificar suscripción en MP. Eliminando registro local.",

          error
        );

        await prisma.subscription.delete({
          where: { id: existingPendingSubscription.id },
        });
      }
    }

    console.log(
      "No se encontró suscripción pendiente válida. Creando una nueva."
    );

    const response = await preapproval.create({
      body: {
        reason: "Suscripción Plan PRO Turnix",

        auto_recurring: {
          frequency: 1,

          frequency_type: "months",

          transaction_amount: transaction_amount,

          currency_id: "ARS",
        },

        back_url: `${getBaseUrl()}/dashboard?subscription=success`,

        payer_email: user.email,

        status: "pending",

        external_reference: user.id,
      },
    });

    if (response.id && response.init_point) {
      const tomorrow = new Date();

      tomorrow.setDate(tomorrow.getDate() + 1);

      let discountedUntilDate: Date | undefined = undefined;

      if (validDiscount) {
        discountedUntilDate = new Date();

        discountedUntilDate.setMonth(
          discountedUntilDate.getMonth() + validDiscount.durationMonths
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.subscription.create({
          data: {
            userId: user.id,

            mercadopagoSubscriptionId: response.id!,

            status: "pending",

            currentPeriodEnd: tomorrow,

            appliedDiscountCodeId: validDiscount?.id,

            discountedUntil: discountedUntilDate,
          },
        });

        if (validDiscount) {
          await tx.discountCode.update({
            where: { id: validDiscount.id },

            data: { timesUsed: { increment: 1 } },
          });
        }
      });

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
        status: "paused",
      },
    });

    if (result.status === "cancelled" || result.status === "paused") {
      await prisma.subscription.update({
        where: { mercadopagoSubscriptionId },
        data: { status: result.status },
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

export async function reactivateSubscription(
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
    return { error: "No tienes permiso para reactivar esta suscripción." };
  }

  try {
    const preapproval = new PreApproval(client);
    const result = await preapproval.update({
      id: mercadopagoSubscriptionId,
      body: {
        status: "authorized",
      },
    });

    if (result.status === "authorized") {
      await prisma.subscription.update({
        where: { mercadopagoSubscriptionId },
        data: { status: "authorized" },
      });
      revalidatePath("/dashboard/billing");
      return { success: "Tu suscripción ha sido reactivada con éxito." };
    } else {
      return { error: "Mercado Pago no pudo procesar la reactivación." };
    }
  } catch (error) {
    console.error("Error al reactivar la suscripción en Mercado Pago:", error);
    return { error: "Ocurrió un error al comunicarnos con Mercado Pago." };
  }
}

export async function validateDiscountCode(code: string): Promise<{
  success: boolean;
  error?: string;
  price?: number;
  duration?: number;
}> {
  if (!code) {
    return { success: false, error: "El código no puede estar vacío." };
  }

  const now = new Date();
  const discountCode = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!discountCode) {
    return { success: false, error: "El código de descuento no es válido." };
  }

  if (now < discountCode.validFrom || now > discountCode.validUntil) {
    return {
      success: false,
      error:
        "El código de descuento no es válido en este momento o ha expirado.",
    };
  }

  if (
    discountCode.maxUses !== null &&
    discountCode.timesUsed >= discountCode.maxUses
  ) {
    return {
      success: false,
      error: "Este código de descuento ha alcanzado su límite de usos.",
    };
  }

  return {
    success: true,
    price: discountCode.overridePrice,
    duration: discountCode.durationMonths,
  };
}

export async function refreshSubscriptionStatus() {
  try {
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return { success: false, message: "No autorizado" };
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription || !subscription.mercadopagoSubscriptionId) {
      return {
        success: false,
        message: "No se encontró una suscripción activa para sincronizar.",
      };
    }

    const updatedSub = await syncSubscriptionStatus(
      subscription.mercadopagoSubscriptionId
    );

    if (!updatedSub) {
      return {
        success: false,
        message: "Error al conectar con Mercado Pago. Intenta en unos minutos.",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/billing");

    return {
      success: true,
      status: updatedSub.status,
      message: "Estado de suscripción actualizado correctamente.",
    };
  } catch (error) {
    console.error("Error en refreshSubscriptionStatus:", error);
    return { success: false, message: "Error interno del servidor." };
  }
}
