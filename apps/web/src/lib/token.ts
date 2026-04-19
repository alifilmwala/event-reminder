import crypto from 'crypto';

/**
 * Generate a cryptographically secure, URL-safe token for guest links.
 * 32 bytes = 256 bits of entropy — collision probability is negligible.
 */
export function generateGuestToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a unique ID for a bulk-import batch so rows can be grouped.
 */
export function generateImportBatchId(): string {
  return `batch_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Constant-time comparison to prevent timing attacks when validating tokens.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Sign a service-to-service request body with an HMAC-SHA256 signature.
 * Used between Next.js and the WhatsApp microservice.
 */
export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify inbound HMAC signature from the WhatsApp service.
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = signPayload(payload, secret);
  return safeCompare(signature, expected);
}
