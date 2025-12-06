import { MercadoPagoConfig, PreApproval } from "mercadopago";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const preapprovalClient = new PreApproval(client);

export async function syncSubscriptionStatus(
  mercadopagoSubscriptionId: string
) {
  console.log(`Iniciando sincronización para ID: ${mercadopagoSubscriptionId}`);

  try {
    const mpSubscription = await preapprovalClient.get({
      id: mercadopagoSubscriptionId,
    });

    if (!mpSubscription) {
      console.error(
        `No se encontró la suscripción ${mercadopagoSubscriptionId} en MP.`
      );
      return null;
    }

    const userId = String(mpSubscription.external_reference);

    if (!userId || userId === "undefined") {
      console.error("La suscripción no tiene un external_reference válido.");
      return null;
    }

    console.log(
      `[Sync] User: ${userId} | Estado MP: ${mpSubscription.status} | Prox Pago: ${mpSubscription.next_payment_date}`
    );

    const nextPaymentDate = mpSubscription.next_payment_date
      ? new Date(mpSubscription.next_payment_date)
      : undefined;

    const subscription = await prisma.subscription.upsert({
      where: { userId: userId },
      create: {
        userId: userId,
        mercadopagoSubscriptionId: mpSubscription.id!,
        status: mpSubscription.status!,
        currentPeriodEnd: nextPaymentDate || new Date(),
      },
      update: {
        mercadopagoSubscriptionId: mpSubscription.id!,
        status: mpSubscription.status!,
        ...(nextPaymentDate && { currentPeriodEnd: nextPaymentDate }),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/subscribe");

    console.log(`Éxito. Estado local actualizado a: ${subscription.status}`);
    return subscription;
  } catch (error) {
    console.error(`Error al sincronizar con Mercado Pago:`, error);
    return null;
  }
}
