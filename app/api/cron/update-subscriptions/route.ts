import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { getBaseUrl } from "@/lib/get-base-url";
import {
  PLAN_PRICES,
  BILLING_PERIODS,
  getCurrentAnnualPrice,
} from "@/lib/mercadopago/subscription-types";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});
const preapproval = new PreApproval(client);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("CRON JOB: Iniciando actualización de suscripciones...");

  try {
    const now = new Date();
    const subscriptionsToExpire = await prisma.subscription.findMany({
      where: {
        status: "authorized",
        discountedUntil: {
          not: null,
          lte: now,
        },
      },
    });

    let updatedCount = 0;
    const errors: { subId: string; error: unknown }[] = [];

    if (subscriptionsToExpire.length === 0) {
      console.log("CRON JOB: No hay suscripciones para actualizar hoy (Fase 1).");
    } else {
      console.log(
        `CRON JOB: Se encontraron ${subscriptionsToExpire.length} suscripciones para actualizar.`,
      );

    for (const sub of subscriptionsToExpire) {
      try {
        console.log(
          ` > Actualizando MP sub ID: ${sub.mercadopagoSubscriptionId}`,
        );
        const standardPrice =
          sub.billingPeriod === BILLING_PERIODS.ANNUAL
            ? PLAN_PRICES.ANNUAL
            : PLAN_PRICES.MONTHLY;

        await preapproval.update({
          id: sub.mercadopagoSubscriptionId,
          body: {
            auto_recurring: {
              transaction_amount: standardPrice,
              currency_id: "ARS",
            },
          },
        });

        console.log(`   - Precio en MP actualizado a ${standardPrice}.`);

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            discountedUntil: null,
          },
        });

        console.log(`   - Registro local actualizado.`);
        updatedCount++;
      } catch (error) {
        console.error(
          `   - ERROR al actualizar la suscripción ${sub.id}:`,
          error,
        );
        errors.push({ subId: sub.id, error });
      }
    }
    }

    console.log("CRON JOB: FASE 2 Iniciando upgrades anuales...");

    const pendingUpgrades = await prisma.subscription.findMany({
      where: {
        pendingAnnualUpgrade: true,
        status: "authorized",
        billingPeriod: BILLING_PERIODS.MONTHLY,
        currentPeriodEnd: { lte: now },
      },
      include: { user: { select: { email: true } } },
    });

    if (pendingUpgrades.length > 0) {
      console.log(
        `CRON JOB: Procesando ${pendingUpgrades.length} upgrades anuales.`,
      );

      for (const sub of pendingUpgrades) {
        try {
          console.log(
            ` > Cancelando sub mensual MP: ${sub.mercadopagoSubscriptionId}`,
          );
          await preapproval.update({
            id: sub.mercadopagoSubscriptionId,
            body: { status: "cancelled" },
          });

          const transaction_amount = getCurrentAnnualPrice();

          console.log(` > Creando nueva sub anual en MP`);
          const response = await preapproval.create({
            body: {
              reason: "Suscripción Plan PRO Anual Turnix",
              auto_recurring: {
                frequency: 12,
                frequency_type: "months",
                transaction_amount,
                currency_id: "ARS",
              },
              back_url: `${getBaseUrl()}/dashboard?subscription=success`,
              payer_email: sub.user.email!,
              status: "pending",
              external_reference: sub.userId,
            },
          });

          if (response.id && response.init_point) {
            let discountedUntilDate: Date | null = null;
            if (transaction_amount !== PLAN_PRICES.ANNUAL) {
              discountedUntilDate = new Date();
              discountedUntilDate.setDate(discountedUntilDate.getDate() + 7);
            }

            await prisma.subscription.update({
              where: { id: sub.id },
              data: {
                mercadopagoSubscriptionId: response.id,
                status: "pending",
                billingPeriod: BILLING_PERIODS.ANNUAL,
                pendingAnnualUpgrade: false,
                discountedUntil: discountedUntilDate,
              },
            });
            console.log(`   - Upgrade exitoso para la sub ${sub.id}`);
            updatedCount++;
          }
        } catch (error) {
          console.error(
            `   - ERROR al procesar upgrade para la suscripción ${sub.id}:`,
            error,
          );
          errors.push({ subId: sub.id, error });
        }
      }
    }

    console.log("CRON JOB: Proceso finalizado.");
    return NextResponse.json({
      ok: true,
      updatedCount,
      errors,
    });
  } catch (error) {
    console.error("CRON JOB: Error catastrófico en el job.", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
