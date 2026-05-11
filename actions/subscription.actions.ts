"use server";

import { getCurrentUser } from "@/lib/data";
import prisma from "@/lib/prisma";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { syncSubscriptionStatus } from "@/lib/mercadopago/sync";
import {
  BILLING_PERIODS,
  PLAN_PRICES,
  getCurrentAnnualPrice,
  isAnnualPromoActive,
} from "@/lib/mercadopago/subscription-types";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

type FormState = {
  error?: string;
  init_point?: string;
};

export async function createSubscription(
  prevState: FormState,

  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();

  if (!user || !user.email) {
    return { error: "No autorizado o email no configurado." };
  }

  const discountCodeString = formData.get("discountCode") as string | null;
  const billingPeriod =
    (formData.get("billingPeriod") as string) || BILLING_PERIODS.MONTHLY;
  const isAnnual = billingPeriod === BILLING_PERIODS.ANNUAL;

  if (isAnnual && discountCodeString) {
    return { error: "Los códigos de descuento no aplican al plan anual." };
  }

  const STANDARD_PRICE = PLAN_PRICES.MONTHLY;

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

    const transaction_amount = isAnnual
      ? getCurrentAnnualPrice()
      : validDiscount
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
      `Buscando suscripción pendiente en la DB para el usuario: ${user.id}`,
    );

    const existingPendingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,

        status: "pending",
      },
    });

    if (existingPendingSubscription) {
      console.log(
        "Suscripción pendiente encontrada en DB. Verificando con Mercado Pago.",
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
          "Suscripción en DB era inválida en MP. Registro local eliminado.",
        );
      } catch (error) {
        console.error(
          "Error al verificar suscripción en MP. Eliminando registro local.",

          error,
        );

        await prisma.subscription.delete({
          where: { id: existingPendingSubscription.id },
        });
      }
    }

    console.log(
      "No se encontró suscripción pendiente válida. Creando una nueva.",
    );
    console.log(
      "Token a usar en createSubscription:",
      process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 20) + "...",
    );

    const response = await preapproval.create({
      body: {
        reason: "Suscripción Plan PRO Turnix",

        auto_recurring: {
          frequency: isAnnual ? 12 : 1,

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

      if (isAnnual && isAnnualPromoActive()) {
        discountedUntilDate = new Date();
        discountedUntilDate.setDate(discountedUntilDate.getDate() + 7);
      } else if (!isAnnual && validDiscount) {
        discountedUntilDate = new Date();

        discountedUntilDate.setMonth(
          discountedUntilDate.getMonth() + validDiscount.durationMonths,
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            mercadopagoSubscriptionId: response.id!,
            status: "pending",
            currentPeriodEnd: tomorrow,
            appliedDiscountCodeId: validDiscount?.id,
            discountedUntil: discountedUntilDate,
            billingPeriod,
          },
          update: {
            mercadopagoSubscriptionId: response.id!,
            status: "pending",
            currentPeriodEnd: tomorrow,
            appliedDiscountCodeId: validDiscount?.id,
            discountedUntil: discountedUntilDate,
            billingPeriod,
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
  mercadopagoSubscriptionId: string,
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
      revalidatePath("/dashboard/billing", "layout");
      revalidatePath("/dashboard/settings", "layout");
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
  mercadopagoSubscriptionId: string,
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
      await prisma.user.update({
        where: { id: user.id },
        data: { trialEndsAt: null },
      });
      revalidatePath("/dashboard/billing", "layout");
      revalidatePath("/dashboard/settings", "layout");
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
      subscription.mercadopagoSubscriptionId,
    );

    if (!updatedSub) {
      return {
        success: false,
        message: "Error al conectar con Mercado Pago. Intenta en unos minutos.",
      };
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/billing", "layout");
    revalidatePath("/dashboard/settings", "layout");

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

export async function requestAnnualUpgrade(): Promise<{
  error?: string;
  success?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado." };
  }

  try {
    const activeSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!activeSubscription || activeSubscription.status !== "authorized") {
      return { error: "No tienes una suscripción activa." };
    }

    if (activeSubscription.billingPeriod === BILLING_PERIODS.ANNUAL) {
      return { error: "Ya estás en el plan anual." };
    }

    if (activeSubscription.pendingAnnualUpgrade) {
      return { error: "Ya tienes un cambio al plan anual programado." };
    }

    await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: { pendingAnnualUpgrade: true },
    });

    revalidatePath("/dashboard/billing", "layout");
    revalidatePath("/dashboard/settings", "layout");

    return {
      success:
        "Cambio al Plan Anual programado para el final de tu ciclo actual.",
    };
  } catch (error) {
    console.error("Error al programar cambio de plan:", error);
    return { error: "Ocurrió un error al procesar tu solicitud." };
  }
}

export async function cancelAnnualUpgrade(): Promise<{
  error?: string;
  success?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado." };
  }

  try {
    const activeSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!activeSubscription || !activeSubscription.pendingAnnualUpgrade) {
      return { error: "No hay ningún cambio programado para cancelar." };
    }

    await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: { pendingAnnualUpgrade: false },
    });

    revalidatePath("/dashboard/billing", "layout");
    revalidatePath("/dashboard/settings", "layout");

    return { success: "Cambio al Plan Anual cancelado." };
  } catch (error) {
    console.error("Error al cancelar cambio de plan:", error);
    return { error: "Ocurrió un error al procesar tu solicitud." };
  }
}
