import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  console.log("--- INICIANDO PROCESAMIENTO DE WEBHOOK ---");

  try {
    const body = await req.json();
    console.log("Cuerpo del Webhook recibido:", JSON.stringify(body, null, 2));

    const signature = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");

    if (WEBHOOK_SECRET && signature && requestId) {
      const parts = signature.split(",");
      const timestamp = parts
        .find((part) => part.startsWith("ts="))
        ?.split("=")[1];
      const hash = parts.find((part) => part.startsWith("v1="))?.split("=")[1];

      if (timestamp && hash) {
        const manifest = `id:${body.data.id};request-id:${requestId};ts:${timestamp};`;
        const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
        hmac.update(manifest);
        const expectedSignature = hmac.digest("hex");

        if (expectedSignature !== hash) {
          console.error(
            "Error de validación de Webhook: la firma no coincide."
          );
          return NextResponse.json(
            { error: "Firma inválida." },
            { status: 400 }
          );
        }
        console.log("Firma del Webhook validada exitosamente.");
      }
    } else {
      console.warn(
        "Advertencia: No se encontró firma de webhook para validar."
      );
    }

    if (body.type === "subscription_preapproval") {
      console.log(
        `Tipo de evento 'preapproval' detectado. ID: ${body.data.id}`
      );
      const preapprovalClient = new PreApproval(client);
      const subscriptionData = await preapprovalClient.get({
        id: body.data.id,
      });
      console.log(
        "Datos de la suscripción obtenidos de MP:",
        JSON.stringify(subscriptionData, null, 2)
      );

      if (subscriptionData.status === "authorized") {
        const userId = subscriptionData.external_reference;

        if (userId) {
          console.log(`Vinculando suscripción al User ID: ${userId}`);
          await prisma.subscription.upsert({
            where: { userId: userId },
            create: {
              userId: userId,
              mercadopagoSubscriptionId: subscriptionData.id!,
              status: subscriptionData.status!,
              currentPeriodEnd: new Date(subscriptionData.next_payment_date!),
            },
            update: {
              mercadopagoSubscriptionId: subscriptionData.id!,
              status: subscriptionData.status!,
              currentPeriodEnd: new Date(subscriptionData.next_payment_date!),
            },
          });

          revalidatePath("/dashboard");
          revalidatePath("/subscribe");
          console.log(
            "ÉXITO: Revalidación de caché para /dashboard y /subscribe iniciada."
          );

          console.log(
            `ÉXITO: Base de datos actualizada para el usuario: ${userId}, Estado: ${subscriptionData.status}`
          );
        } else {
          console.error(
            "Error crítico: No se encontró 'external_reference' (userId) en la suscripción."
          );
        }
      }
    }
    console.log("--- FINALIZANDO PROCESAMIENTO DE WEBHOOK ---");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(
      "Error catastrófico al procesar el webhook de Mercado Pago:",
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
