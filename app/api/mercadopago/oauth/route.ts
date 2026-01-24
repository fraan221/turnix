import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getAuthorizationUrl } from "@/lib/mercadopago/oauth";

/**
 * GET /api/mercadopago/oauth
 *
 * Initiates the Mercado Pago OAuth flow for barber account linking.
 * Implements Security Observation #3: CSRF protection with httpOnly cookie.
 */
export async function GET() {
  try {
    // 1. Verify user is authenticated and is an OWNER
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", process.env.NEXT_PUBLIC_APP_URL!),
      );
    }

    // 2. Get barbershop owned by this user
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

    // 3. Generate CSRF token for security (Observation #3)
    const csrfToken = crypto.randomBytes(16).toString("hex");

    // 4. Store CSRF token in httpOnly cookie (10 min TTL)
    const cookieStore = await cookies();
    cookieStore.set("mp_oauth_csrf", csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // 5. Build state with barbershopId and CSRF token
    const state = JSON.stringify({
      barbershopId: barbershop.id,
      csrf: csrfToken,
    });

    // 6. Get authorization URL and redirect
    const authUrl = getAuthorizationUrl(encodeURIComponent(state));

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
