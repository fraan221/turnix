import crypto from "crypto";
import prisma from "@/lib/prisma";

// Environment variables
const APP_ID = process.env.MERCADOPAGO_APP_ID!;
const CLIENT_SECRET = process.env.MERCADOPAGO_CLIENT_SECRET!;
const REDIRECT_URI = process.env.MERCADOPAGO_REDIRECT_URI!;
const ENCRYPTION_KEY =
  process.env.MERCADOPAGO_ENCRYPTION_KEY || process.env.AUTH_SECRET!;

// OAuth token response type
interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  user_id: number;
  public_key: string;
}

// ============================================================================
// ENCRYPTION UTILITIES (AES-256-GCM)
// ============================================================================

/**
 * Encrypts a token using AES-256-GCM
 */
export function encryptToken(token: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a token encrypted with AES-256-GCM
 */
export function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(":");

  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// ============================================================================
// OAUTH FLOW
// ============================================================================

/**
 * Generates the Mercado Pago OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: APP_ID,
    response_type: "code",
    platform_id: "mp",
    redirect_uri: REDIRECT_URI,
    state,
  });

  return `https://auth.mercadopago.com/authorization?${params.toString()}`;
}

/**
 * Exchanges the authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
): Promise<OAuthTokens> {
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: APP_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OAuth token exchange failed:", error);
    throw new Error(`Failed to exchange code for tokens: ${response.status}`);
  }

  return response.json();
}

/**
 * Refreshes the access token using a refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<OAuthTokens> {
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: APP_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OAuth token refresh failed:", error);
    throw new Error(`Failed to refresh access token: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// TOKEN MANAGEMENT (with auto-refresh - Observation #1)
// ============================================================================

/**
 * Gets a valid access token for a barbershop, auto-refreshing if expired.
 * This implements the auto-refresh pattern from Security Observation #1.
 */
export async function getValidAccessToken(
  barbershopId: string,
): Promise<string> {
  const credentials = await prisma.mercadoPagoCredentials.findUnique({
    where: { barbershopId },
  });

  if (!credentials) {
    throw new Error("Barbershop not connected to Mercado Pago");
  }

  // Check if token is expired (with 5-minute buffer for safety)
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  const isExpired = credentials.expiresAt < new Date(Date.now() + bufferMs);

  if (isExpired) {
    console.log(
      `[OAuth] Token expired for barbershop ${barbershopId}, refreshing...`,
    );

    try {
      const decryptedRefreshToken = decryptToken(credentials.refreshToken);
      const newTokens = await refreshAccessToken(decryptedRefreshToken);

      // Update tokens in database
      await prisma.mercadoPagoCredentials.update({
        where: { barbershopId },
        data: {
          accessToken: encryptToken(newTokens.access_token),
          refreshToken: encryptToken(newTokens.refresh_token),
          expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
        },
      });

      console.log(
        `[OAuth] Token refreshed successfully for barbershop ${barbershopId}`,
      );
      return newTokens.access_token;
    } catch (error) {
      console.error(
        `[OAuth] Failed to refresh token for barbershop ${barbershopId}:`,
        error,
      );
      throw new Error(
        "Failed to refresh Mercado Pago token. Please reconnect your account.",
      );
    }
  }

  return decryptToken(credentials.accessToken);
}

/**
 * Checks if a barbershop has valid MP credentials connected
 */
export async function hasMpCredentials(barbershopId: string): Promise<boolean> {
  const credentials = await prisma.mercadoPagoCredentials.findUnique({
    where: { barbershopId },
    select: { id: true },
  });

  return !!credentials;
}
