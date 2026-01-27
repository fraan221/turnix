import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { revalidatePath } from "next/cache";
import { syncSubscriptionStatus } from "@/lib/mercadopago/sync";
import { validateWebhookSignature } from "@/lib/mercadopago/webhook-security";
import { broadcastToUser } from "@/lib/supabase-server";
import prisma from "@/lib/prisma";
import { decryptToken } from "@/lib/mercadopago/oauth";
import { sendPushNotification } from "@/lib/push";
import {
  formatTime,
  formatBookingDateForNotification,
} from "@/lib/date-helpers";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

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

    if (topic === "subscription_preapproval") {
      console.log(`Evento de Suscripción. Sincronizando ID: ${resourceId}...`);
      await syncSubscriptionStatus(resourceId);
    } else if (topic === "payment") {
      console.log(`Pago detectado ${resourceId}. Analizando...`);

      const bodyExternalRef =
        body.data?.external_reference || body.external_reference;

      let booking = bodyExternalRef
        ? await prisma.booking.findUnique({
            where: { id: bodyExternalRef },
            include: { barbershop: { include: { mpCredentials: true } } },
          })
        : null;

      if (!booking) {
        const recentPendingBookings = await prisma.booking.findMany({
          where: {
            paymentStatus: "PENDING",
            createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
          },
          include: { barbershop: { include: { mpCredentials: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        console.log(
          `[Deposit] Pending bookings found: ${recentPendingBookings.length}`,
        );

        for (const pendingBooking of recentPendingBookings) {
          console.log(`[Deposit] Checking booking ${pendingBooking.id}`);
          if (!pendingBooking.barbershop.mpCredentials) {
            console.log(
              `[Deposit] No credentials for booking ${pendingBooking.id}`,
            );
            continue;
          }

          const creds = pendingBooking.barbershop.mpCredentials;
          if (!creds?.accessToken) {
            console.log(
              `[Deposit] No access token for booking ${pendingBooking.id}`,
            );
            continue;
          }

          try {
            console.log(
              `[Deposit] Trying with token for barbershop ${pendingBooking.barbershop.name}`,
            );
            const decryptedToken = decryptToken(creds.accessToken);
            const barbershopClient = new MercadoPagoConfig({
              accessToken: decryptedToken,
            });
            const paymentClient = new Payment(barbershopClient);
            const paymentData = await paymentClient.get({ id: resourceId });

            console.log(
              `[Deposit] Payment fetched. External Ref: ${paymentData.external_reference} | Pending ID: ${pendingBooking.id}`,
            );

            if (paymentData.external_reference === pendingBooking.id) {
              console.log(`[Deposit] MATCH FOUND!`);
              booking = pendingBooking;
              break;
            }
          } catch (err: any) {
            console.log(`[Deposit] Token failed: ${err.message}`);
            continue;
          }
        }
      }

      if (booking?.barbershop?.mpCredentials) {
        const creds = booking.barbershop.mpCredentials;

        if (creds?.accessToken) {
          console.log(`[Deposit] Pago de seña para booking: ${booking.id}`);

          const existingPayment = await prisma.booking.findFirst({
            where: { mercadopagoPaymentId: String(resourceId) },
          });

          if (existingPayment) {
            console.log(`[Deposit] Pago ${resourceId} ya procesado. Saltando.`);
            return NextResponse.json({ success: true }, { status: 200 });
          }

          const decryptedToken = decryptToken(creds.accessToken);
          const barbershopClient = new MercadoPagoConfig({
            accessToken: decryptedToken,
          });
          const paymentClient = new Payment(barbershopClient);
          const paymentData = await paymentClient.get({ id: resourceId });

          if (paymentData.status === "approved") {
            const updatedBooking = await prisma.booking.update({
              where: { id: booking.id },
              data: {
                paymentStatus: "PAID",
                mercadopagoPaymentId: String(resourceId),
              },
              include: {
                barber: true,
                barbershop: true,
                client: true,
                service: true,
              },
            });

            console.log(`[Deposit] Booking ${booking.id} marcado como PAID`);

            revalidatePath("/dashboard");

            console.log(`[Deposit] Booking ${booking.id} marcado como PAID`);

            const startTime = new Date(updatedBooking.startTime);
            const formattedTime = formatTime(startTime);
            const relativeDateString =
              formatBookingDateForNotification(startTime);

            const notificationMessage = `¡Turno señado! ${updatedBooking.client.name} reservó "${updatedBooking.service?.name || "Servicio"}" para ${relativeDateString} a las ${formattedTime}hs.`;

            const barberNotification = await prisma.notification.create({
              data: {
                userId: updatedBooking.barberId,
                message: notificationMessage,
                clientId: updatedBooking.clientId,
              },
            });

            await sendPushNotification(updatedBooking.barberId, {
              title: "¡Nuevo Turno Señado! 💸",
              body: notificationMessage,
              url: "/dashboard/notifications",
            });

            await broadcastToUser(updatedBooking.barberId, "booking-paid", {
              bookingId: updatedBooking.id,
              clientName: updatedBooking.client.name,
              message: notificationMessage,
              notificationId: barberNotification.id,
            });

            if (
              updatedBooking.barbershop.teamsEnabled &&
              updatedBooking.barbershop.ownerId !== updatedBooking.barberId
            ) {
              const ownerMessage = `Turno señado: ${updatedBooking.client.name} reservó con ${updatedBooking.barber.name} para ${relativeDateString} a las ${formattedTime}hs.`;

              const ownerNotification = await prisma.notification.create({
                data: {
                  userId: updatedBooking.barbershop.ownerId,
                  message: ownerMessage,
                  clientId: updatedBooking.clientId,
                },
              });

              await sendPushNotification(updatedBooking.barbershop.ownerId, {
                title: "Nuevo Turno Señado (Equipo)",
                body: ownerMessage,
                url: "/dashboard/notifications",
              });

              await broadcastToUser(
                updatedBooking.barbershop.ownerId,
                "booking-paid",
                {
                  bookingId: updatedBooking.id,
                  clientName: updatedBooking.client.name,
                  barberName: updatedBooking.barber.name,
                  message: ownerMessage,
                  notificationId: ownerNotification.id,
                },
              );
            }

            revalidatePath("/dashboard");

            console.log(
              `[Deposit] Notificaciones enviadas para booking ${booking.id}`,
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
        }
      } else {
        try {
          const paymentClient = new Payment(client);
          const paymentData = await paymentClient.get({ id: resourceId });

          let userIdToSync: string | null = null;

          if (paymentData.external_reference) {
            userIdToSync = paymentData.external_reference;
            console.log(
              `Usuario identificado por external_reference: ${userIdToSync}`,
            );
          } else if (paymentData.payer?.email) {
            console.log(
              `Buscando usuario por email: ${paymentData.payer.email}`,
            );
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
        } catch (subscriptionError) {
          console.log(
            `[Payment] No es un pago de suscripción o no se pudo procesar:`,
            subscriptionError,
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
