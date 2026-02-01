import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getAuthorizationUrl } from "@/lib/mercadopago/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", process.env.NEXT_PUBLIC_APP_URL!),
      );
    }

    const barbershop = await prisma.barbershop.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    if (!barbershop) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/settings?error=no_barbershop",
          process.env.NEXT_PUBLIC_APP_URL!,
        ),
      );
    }

    const csrfToken = crypto.randomBytes(16).toString("hex");

    const cookieStore = await cookies();
    cookieStore.set("mp_oauth_csrf", csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    // Encode state as base64 to avoid special characters that MP might reject
    const stateData = JSON.stringify({
      barbershopId: barbershop.id,
      csrf: csrfToken,
    });
    const state = Buffer.from(stateData).toString("base64url");

    const authUrl = getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[OAuth] Error initiating OAuth flow:", error);
    return NextResponse.redirect(
      new URL(
        "/dashboard/settings?error=oauth_init_failed",
        process.env.NEXT_PUBLIC_APP_URL!,
      ),
    );
  }
}
