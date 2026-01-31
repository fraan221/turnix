import { MercadoPagoConfig, PreApproval } from "mercadopago";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isAuthorizedStatus } from "@/lib/mercadopago/subscription-types";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const preapprovalClient = new PreApproval(client);

export async function syncSubscriptionStatus(
  mercadopagoSubscriptionId: string,
) {
  console.log(`Iniciando sincronización para ID: ${mercadopagoSubscriptionId}`);

  try {
    const mpSubscription = await preapprovalClient.get({
      id: mercadopagoSubscriptionId,
    });

    if (!mpSubscription) {
      console.error(
        `No se encontró la suscripción ${mercadopagoSubscriptionId} en MP.`,
      );
      return null;
    }

    const userId = String(mpSubscription.external_reference);

    if (!userId || userId === "undefined") {
      console.error("La suscripción no tiene un external_reference válido.");
      return null;
    }

    console.log(
      `[Sync] User: ${userId} | Estado MP: ${mpSubscription.status} | Prox Pago: ${mpSubscription.next_payment_date}`,
    );

    const nextPaymentDate = mpSubscription.next_payment_date
      ? new Date(mpSubscription.next_payment_date)
      : undefined;

    const existing = await prisma.subscription.findUnique({
      where: { userId: userId },
      select: { status: true, currentPeriodEnd: true, pendingSince: true },
    });

    const isSameStatus = existing?.status === mpSubscription.status;
    const isSamePeriodEnd =
      existing?.currentPeriodEnd?.getTime() === nextPaymentDate?.getTime();

    if (existing && isSameStatus && isSamePeriodEnd) {
      console.log(
        `[Sync] Estado idéntico (${mpSubscription.status}), saltando actualización.`,
      );
      return existing;
    }

    const isEnteringPending =
      mpSubscription.status === "pending" && existing?.status !== "pending";
    const isLeavingPending =
      mpSubscription.status !== "pending" && existing?.status === "pending";

    const pendingSinceValue = isEnteringPending
      ? new Date()
      : isLeavingPending
        ? null
        : undefined;

    const subscription = await prisma.subscription.upsert({
      where: { userId: userId },
      create: {
        userId: userId,
        mercadopagoSubscriptionId: mpSubscription.id!,
        status: mpSubscription.status!,
        currentPeriodEnd: nextPaymentDate || new Date(),
        pendingSince: mpSubscription.status === "pending" ? new Date() : null,
      },
      update: {
        mercadopagoSubscriptionId: mpSubscription.id!,
        status: mpSubscription.status!,
        ...(nextPaymentDate && { currentPeriodEnd: nextPaymentDate }),
        ...(pendingSinceValue !== undefined && {
          pendingSince: pendingSinceValue,
        }),
        updatedAt: new Date(),
      },
    });

    if (isAuthorizedStatus(mpSubscription.status)) {
      await prisma.user.update({
        where: { id: userId },
        data: { trialEndsAt: null },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/subscribe");

    console.log(`Éxito. Estado local actualizado a: ${subscription.status}`);
    return subscription;
  } catch (error) {
    console.error(`Error al sincronizar con Mercado Pago:`, error);
    return null;
  }
}
