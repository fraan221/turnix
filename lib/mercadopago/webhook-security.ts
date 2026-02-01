import crypto from "crypto";

/**
 * Validates the Mercado Pago webhook signature using HMAC-SHA256.
 * Implements Security Observation #2: Signature validation.
 *
 * Uses crypto.timingSafeEqual() to prevent timing attacks.
 *
 * @param xSignature - The x-signature header from the webhook request
 * @param xRequestId - The x-request-id header from the webhook request
 * @param dataId - The resource ID from the webhook payload (body.data.id)
 * @param secretKey - The MERCADOPAGO_WEBHOOK_SECRET from environment
 * @returns true if signature is valid, false otherwise
 */
export function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secretKey: string,
): boolean {
  if (!xSignature || !xRequestId || !secretKey) {
    console.warn(
      "[Webhook Security] Missing required parameters for signature validation",
    );
    return false;
  }

  // Parse x-signature header (format: "ts=123456,v1=abc123...")
  const parts = xSignature.split(",");
  let ts: string | undefined;
  let hash: string | undefined;

  for (const part of parts) {
    const [key, value] = part.split("=");
    const trimmedKey = key?.trim();
    const trimmedValue = value?.trim();

    if (trimmedKey === "ts") ts = trimmedValue;
    if (trimmedKey === "v1") hash = trimmedValue;
  }

  if (!ts || !hash) {
    console.warn("[Webhook Security] Missing ts or v1 in x-signature header");
    return false;
  }

  // Build manifest string according to MP documentation
  // Format: id:{dataId};request-id:{xRequestId};ts:{ts};
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Generate HMAC-SHA256
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(manifest)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(expectedHash),
    );

    if (!isValid) {
      console.warn("[Webhook Security] Signature mismatch - possible attack");
    }

    return isValid;
  } catch {
    // timingSafeEqual throws if buffers have different lengths
    console.warn("[Webhook Security] Hash length mismatch");
    return false;
  }
}
