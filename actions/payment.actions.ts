"use server";

import { revalidatePath } from "next/cache";
import { MercadoPagoConfig, Preference } from "mercadopago";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { getValidAccessToken } from "@/lib/mercadopago/oauth";
import { formatShortDateTime } from "@/lib/date-helpers";

interface DepositSettings {
  depositEnabled: boolean;
  depositAmountType: "fixed" | "percentage" | null;
  depositAmount: number | null;
}

interface CreatePreferenceResult {
  success: boolean;
  preferenceId?: string;
  initPoint?: string;
  error?: string;
}

export async function createDepositPreference(
  bookingId: string,
): Promise<CreatePreferenceResult> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        barbershop: {
          include: {
            mpCredentials: true,
          },
        },
        client: true,
        service: true,
        barber: true,
      },
    });

    if (!booking) {
      return { success: false, error: "Reserva no encontrada" };
    }

    if (!booking.barbershop.mpCredentials) {
      return {
        success: false,
        error: "El barbero no tiene Mercado Pago conectado",
      };
    }

    if (!booking.depositAmount) {
      return { success: false, error: "Esta reserva no requiere seña" };
    }

    const accessToken = await getValidAccessToken(booking.barbershopId);

    const client = new MercadoPagoConfig({ accessToken });
    const preferenceClient = new Preference(client);

    const formattedDate = formatShortDateTime(booking.startTime);
    const serviceName = booking.service?.name || "Servicio";

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: bookingId,
            title: `Seña - Turno en ${booking.barbershop.name}`,
            description: `Reserva para ${serviceName} el ${formattedDate}`,
            quantity: 1,
            unit_price: Number(booking.depositAmount),
            currency_id: "ARS",
          },
        ],

        external_reference: bookingId,

        payer: {
          name: booking.client.name,
          phone: {
            number: booking.client.phone.replace(/\D/g, ""),
          },
        },

        metadata: {
          booking_id: bookingId,
          type: "deposit",
          barbershop_id: booking.barbershopId,
        },

        statement_descriptor: "TURNIX",

        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/booking-confirmed?payment=success&booking=${bookingId}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/booking-confirmed?payment=failure&booking=${bookingId}`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/booking-confirmed?payment=pending&booking=${bookingId}`,
        },

        auto_return: "approved",

        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    });

    console.log(
      `[Payment] Created preference ${preference.id} for booking ${bookingId}`,
    );

    return {
      success: true,
      preferenceId: preference.id!,
      initPoint: preference.init_point!,
    };
  } catch (error) {
    console.error("[Payment] Error creating preference:", error);
    return {
      success: false,
      error: "Error al crear la preferencia de pago",
    };
  }
}

export async function updateDepositSettings(
  settings: DepositSettings,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    const barbershop = await prisma.barbershop.findUnique({
      where: { ownerId: session.user.id },
      include: { mpCredentials: true },
    });

    if (!barbershop) {
      return { success: false, error: "No tienes una barbería" };
    }

    if (settings.depositEnabled && !barbershop.mpCredentials) {
      return {
        success: false,
        error: "Debes conectar tu cuenta de Mercado Pago primero",
      };
    }

    await prisma.barbershop.update({
      where: { id: barbershop.id },
      data: {
        depositEnabled: settings.depositEnabled,
        depositAmountType: settings.depositAmountType,
        depositAmount: settings.depositAmount ?? null,
      },
    });

    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    console.error("[Payment] Error updating deposit settings:", error);
    return { success: false, error: "Error al guardar la configuración" };
  }
}

export async function getDepositSettings(barbershopId: string): Promise<{
  depositEnabled: boolean;
  depositAmountType: string | null;
  depositAmount: number | null;
  mpConnected: boolean;
}> {
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: {
      depositEnabled: true,
      depositAmountType: true,
      depositAmount: true,
      mpCredentials: {
        select: { id: true },
      },
    },
  });

  if (!barbershop) {
    return {
      depositEnabled: false,
      depositAmountType: null,
      depositAmount: null,
      mpConnected: false,
    };
  }

  return {
    depositEnabled: barbershop.depositEnabled,
    depositAmountType: barbershop.depositAmountType,
    depositAmount: barbershop.depositAmount
      ? Number(barbershop.depositAmount)
      : null,
    mpConnected: !!barbershop.mpCredentials,
  };
}

export async function disconnectMercadoPago(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    const barbershop = await prisma.barbershop.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    if (!barbershop) {
      return { success: false, error: "No tienes una barbería" };
    }

    await prisma.$transaction([
      prisma.mercadoPagoCredentials.deleteMany({
        where: { barbershopId: barbershop.id },
      }),
      prisma.barbershop.update({
        where: { id: barbershop.id },
        data: {
          depositEnabled: false,
          depositAmountType: null,
          depositAmount: null,
        },
      }),
    ]);

    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    console.error("[Payment] Error disconnecting MP:", error);
    return { success: false, error: "Error al desconectar Mercado Pago" };
  }
}

export async function getMercadoPagoStatus(): Promise<{
  connected: boolean;
  mpUserId?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { connected: false };
    }

    const barbershop = await prisma.barbershop.findUnique({
      where: { ownerId: session.user.id },
      include: {
        mpCredentials: {
          select: { mpUserId: true },
        },
      },
    });

    if (!barbershop?.mpCredentials) {
      return { connected: false };
    }

    return {
      connected: true,
      mpUserId: barbershop.mpCredentials.mpUserId,
    };
  } catch (error) {
    console.error("[Payment] Error getting MP status:", error);
    return { connected: false };
  }
}
