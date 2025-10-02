import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});
const preapproval = new PreApproval(client);

const STANDARD_PRICE = 9900;

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

    if (subscriptionsToExpire.length === 0) {
      console.log("CRON JOB: No hay suscripciones para actualizar hoy.");
      return NextResponse.json({
        ok: true,
        message: "No subscriptions to update.",
      });
    }

    console.log(
      `CRON JOB: Se encontraron ${subscriptionsToExpire.length} suscripciones para actualizar.`
    );

    let updatedCount = 0;
    const errors: { subId: string; error: unknown }[] = [];

    for (const sub of subscriptionsToExpire) {
      try {
        console.log(
          ` > Actualizando MP sub ID: ${sub.mercadopagoSubscriptionId}`
        );
        await preapproval.update({
          id: sub.mercadopagoSubscriptionId,
          body: {
            auto_recurring: {
              transaction_amount: STANDARD_PRICE,
              currency_id: "ARS",
            },
          },
        });

        console.log(`   - Precio en MP actualizado a ${STANDARD_PRICE}.`);

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
          error
        );
        errors.push({ subId: sub.id, error });
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
