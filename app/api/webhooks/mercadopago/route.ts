import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import crypto from "crypto";
import { syncSubscriptionStatus } from "@/lib/mercadopago/sync";
import prisma from "@/lib/prisma";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  console.log("--- WEBHOOK MP RECIBIDO ---");

  try {
    const body = await req.json();
    const signature = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");

    const topic = body.type || body.topic;
    const resourceId = body.data?.id;

    console.log(`Evento: ${topic} | ID: ${resourceId}`);

    if (WEBHOOK_SECRET && signature && requestId) {
      const parts = signature.split(",");
      const timestamp = parts.find((p) => p.startsWith("ts="))?.split("=")[1];
      const hash = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

      if (timestamp && hash) {
        const manifest = `id:${resourceId};request-id:${requestId};ts:${timestamp};`;
        const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
        hmac.update(manifest);
        if (hmac.digest("hex") !== hash) {
          console.error("Firma inválida.");
          return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 }
          );
        }
      }
    } else {
      console.warn("Webhook sin firma segura validada.");
    }

    if (topic === "subscription_preapproval") {
      console.log(`Evento de Suscripción. Sincronizando ID: ${resourceId}...`);
      await syncSubscriptionStatus(resourceId);
    } else if (topic === "payment") {
      console.log(`Pago detectado ${resourceId}. Buscando propietario...`);

      const paymentClient = new Payment(client);
      const paymentData = await paymentClient.get({ id: resourceId });

      let userIdToSync: string | null = null;

      if (paymentData.external_reference) {
        userIdToSync = paymentData.external_reference;
        console.log(
          `Usuario identificado por external_reference: ${userIdToSync}`
        );
      } else if (paymentData.payer?.email) {
        console.log(`Buscando usuario por email: ${paymentData.payer.email}`);
        const user = await prisma.user.findUnique({
          where: { email: paymentData.payer.email },
          select: { id: true },
        });
        if (user) {
          userIdToSync = user.id;
          console.log(`Usuario encontrado por email: ${userIdToSync}`);
        }
      }

      if (userIdToSync) {
        const userSubscription = await prisma.subscription.findUnique({
          where: { userId: userIdToSync },
        });

        if (userSubscription?.mercadopagoSubscriptionId) {
          console.log(
            `Forzando sync de suscripción vinculada: ${userSubscription.mercadopagoSubscriptionId}`
          );
          await syncSubscriptionStatus(
            userSubscription.mercadopagoSubscriptionId
          );
        } else {
          console.warn(
            `Usuario ${userIdToSync} encontrado, pero no tiene suscripción activa en DB para sincronizar.`
          );
        }
      } else {
        console.warn(
          `No se pudo vincular el pago ${resourceId} a ningún usuario conocido.`
        );
      }
    }

    console.log("--- WEBHOOK PROCESADO ---");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error en Webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
