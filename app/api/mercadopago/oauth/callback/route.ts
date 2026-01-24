import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { exchangeCodeForTokens, encryptToken } from "@/lib/mercadopago/oauth";

/**
 * GET /api/mercadopago/oauth/callback
 *
 * Handles the OAuth callback from Mercado Pago.
 * Validates CSRF token, exchanges code for tokens, and stores encrypted credentials.
 * Implements Security Observation #3: CSRF validation.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Handle OAuth errors from Mercado Pago
  if (error) {
    console.error("[OAuth Callback] MP returned error:", error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=mp_${error}`, baseUrl),
    );
  }

  if (!code || !stateParam) {
    console.error("[OAuth Callback] Missing code or state parameter");
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=missing_params", baseUrl),
    );
  }

  try {
    // 1. Parse state parameter
    const state = JSON.parse(decodeURIComponent(stateParam));

    // 2. Validate CSRF token from cookie (Observation #3)
    const cookieStore = await cookies();
    const cookieCsrf = cookieStore.get("mp_oauth_csrf")?.value;

    if (!cookieCsrf || state.csrf !== cookieCsrf) {
      console.error("[OAuth Callback] CSRF token mismatch - possible attack");
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=csrf_mismatch", baseUrl),
      );
    }

    // 3. Clear the CSRF cookie
    cookieStore.delete("mp_oauth_csrf");

    // 4. Verify barbershop exists
    const barbershopId = state.barbershopId;
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { id: true, name: true },
    });

    if (!barbershop) {
      console.error("[OAuth Callback] Barbershop not found:", barbershopId);
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=barbershop_not_found", baseUrl),
      );
    }

    // 5. Exchange authorization code for tokens
    console.log("[OAuth Callback] Exchanging code for tokens...");
    const tokens = await exchangeCodeForTokens(code);

    // 6. Store encrypted credentials in database
    await prisma.mercadoPagoCredentials.upsert({
      where: { barbershopId },
      create: {
        barbershopId,
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token),
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        mpUserId: String(tokens.user_id),
      },
      update: {
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token),
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        mpUserId: String(tokens.user_id),
      },
    });

    console.log(
      `[OAuth Callback] Successfully linked MP account for barbershop ${barbershop.name}`,
    );

    return NextResponse.redirect(
      new URL("/dashboard/settings?mp_connected=true", baseUrl),
    );
  } catch (err) {
    console.error("[OAuth Callback] Error processing callback:", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=token_exchange_failed", baseUrl),
    );
  }
}
