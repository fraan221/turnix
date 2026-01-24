import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { revalidatePath } from "next/cache";
import { syncSubscriptionStatus } from "@/lib/mercadopago/sync";
import { validateWebhookSignature } from "@/lib/mercadopago/webhook-security";
import { broadcastToUser } from "@/lib/supabase-server";
import prisma from "@/lib/prisma";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

// Support multiple webhook secrets for different MP apps
// - MERCADOPAGO_WEBHOOK_SECRET: for subscriptions (turnix-suscripciones)
// - MERCADOPAGO_WEBHOOK_SECRET_PAGOS: for deposits (turnix-pagos)
const WEBHOOK_SECRETS = [
  process.env.MERCADOPAGO_WEBHOOK_SECRET,
  process.env.MERCADOPAGO_WEBHOOK_SECRET_PAGOS,
].filter(Boolean) as string[];

export async function POST(req: NextRequest) {
  console.log("--- WEBHOOK MP RECIBIDO ---");

  try {
    const body = await req.json();
    const signature = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");

    const topic = body.type || body.topic;
    const resourceId = body.data?.id;

    console.log(`Evento: ${topic} | ID: ${resourceId}`);

    // =========================================================================
    // SIGNATURE VALIDATION (Security Observation #2)
    // Validates against multiple secrets to support both MP apps
    // =========================================================================
    if (WEBHOOK_SECRETS.length > 0 && signature && requestId) {
      let isValid = false;

      for (const secret of WEBHOOK_SECRETS) {
        if (
          validateWebhookSignature(
            signature,
            requestId,
            String(resourceId),
            secret,
          )
        ) {
          isValid = true;
          break;
        }
      }

      if (!isValid) {
        console.error("Firma inválida - posible ataque");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
      console.log("Firma validada correctamente");
    } else {
      console.warn("Webhook sin firma segura validada");
    }

    // =========================================================================
    // SUBSCRIPTION PREAPPROVAL (unchanged)
    // =========================================================================
    if (topic === "subscription_preapproval") {
      console.log(`Evento de Suscripción. Sincronizando ID: ${resourceId}...`);
      await syncSubscriptionStatus(resourceId);
    }

    // =========================================================================
    // PAYMENT HANDLING
    // =========================================================================
    else if (topic === "payment") {
      console.log(`Pago detectado ${resourceId}. Analizando...`);

      const paymentClient = new Payment(client);
      const paymentData = await paymentClient.get({ id: resourceId });

      // Check if this is a deposit payment via metadata
      const metadata = paymentData.metadata as
        | Record<string, unknown>
        | undefined;
      const isDepositPayment =
        metadata?.type === "deposit" && metadata?.booking_id;

      if (isDepositPayment) {
        // =====================================================================
        // DEPOSIT PAYMENT FLOW (NEW)
        // =====================================================================
        const bookingId = metadata.booking_id as string;
        console.log(`[Deposit] Pago de seña para booking: ${bookingId}`);

        // Idempotency check - prevent duplicate processing
        const existingPayment = await prisma.booking.findFirst({
          where: { mercadopagoPaymentId: String(resourceId) },
        });

        if (existingPayment) {
          console.log(`[Deposit] Pago ${resourceId} ya procesado. Saltando.`);
          return NextResponse.json({ success: true }, { status: 200 });
        }

        // Update booking based on payment status
        if (paymentData.status === "approved") {
          const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: "PAID",
              mercadopagoPaymentId: String(resourceId),
            },
            include: {
              barber: true,
              barbershop: true,
              client: true,
            },
          });

          console.log(`[Deposit] Booking ${bookingId} marcado como PAID`);

          // Broadcast real-time update to barber
          await broadcastToUser(updatedBooking.barberId, "booking-paid", {
            bookingId: updatedBooking.id,
            clientName: updatedBooking.client.name,
          });

          // Also notify barbershop owner if different from barber
          if (updatedBooking.barbershop.ownerId !== updatedBooking.barberId) {
            await broadcastToUser(
              updatedBooking.barbershop.ownerId,
              "booking-paid",
              {
                bookingId: updatedBooking.id,
                clientName: updatedBooking.client.name,
                barberName: updatedBooking.barber.name,
              },
            );
          }

          // Revalidate calendar cache
          revalidatePath("/dashboard");

          console.log(
            `[Deposit] Notificaciones enviadas para booking ${bookingId}`,
          );
        } else if (
          paymentData.status === "rejected" ||
          paymentData.status === "cancelled"
        ) {
          console.log(`[Deposit] Pago ${resourceId} rechazado/cancelado`);
        } else {
          console.log(
            `[Deposit] Pago ${resourceId} en estado: ${paymentData.status}`,
          );
        }
      } else {
        // =====================================================================
        // SUBSCRIPTION PAYMENT FLOW (existing logic - UNCHANGED)
        // =====================================================================
        let userIdToSync: string | null = null;

        if (paymentData.external_reference) {
          userIdToSync = paymentData.external_reference;
          console.log(
            `Usuario identificado por external_reference: ${userIdToSync}`,
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
              `Forzando sync de suscripción vinculada: ${userSubscription.mercadopagoSubscriptionId}`,
            );
            await syncSubscriptionStatus(
              userSubscription.mercadopagoSubscriptionId,
            );
          } else {
            console.warn(
              `Usuario ${userIdToSync} encontrado, pero no tiene suscripción activa en DB.`,
            );
          }
        } else {
          console.warn(
            `No se pudo vincular pago ${resourceId} a ningún usuario.`,
          );
        }
      }
    }

    console.log("--- WEBHOOK PROCESADO ---");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error en Webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
