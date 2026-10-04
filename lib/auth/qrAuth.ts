import crypto from "crypto";

export const AURA_QR_COOKIE_NAME = "aura_qr_session";

function getExpectedPassword(): string {
  return process.env.AURA_QR_PASSWORD || "aura";
}

function getSecretKey(): string {
  return process.env.QR_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "aura-studio-session-secret-2026";
}

/**
 * Creates a signed session token.
 */
export function createQrSessionToken(): string {
  const secret = getSecretKey();
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac("sha256", secret).update(`aura:${timestamp}`).digest("hex");
  return `${timestamp}.${signature}`;
}

/**
 * Validates a session token.
 */
export function verifyQrSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  if (!signature || signature.length !== 64 || !/^[0-9a-f]{64}$/i.test(signature)) {
    return false;
  }

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;

  // Max session age: 30 days
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - ts > maxAgeMs) return false;

  const secret = getSecretKey();
  const expectedSignature = crypto.createHmac("sha256", secret).update(`aura:${timestamp}`).digest("hex");

  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Validates password input.
 */
export function verifyQrPassword(password: string | undefined | null): boolean {
  if (!password || typeof password !== "string") return false;
  const expected = getExpectedPassword();
  try {
    return crypto.timingSafeEqual(Buffer.from(password.trim()), Buffer.from(expected.trim()));
  } catch {
    return false;
  }
}

/**
 * Checks whether an incoming HTTP request is authorized to view or manage QR resources.
 * Supports cookies, x-aura-key header, or Bearer auth.
 */
export function isQrAuthorized(req: Request): boolean {
  const expected = getExpectedPassword();

  // 1. Header: x-aura-key
  const headerKey = req.headers.get("x-aura-key");
  if (headerKey && headerKey.trim() === expected) return true;

  // 2. Authorization Bearer
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const [scheme, val] = authHeader.split(" ");
    if (scheme?.toLowerCase() === "bearer" && (val?.trim() === expected || verifyQrSessionToken(val?.trim()))) {
      return true;
    }
  }

  // 3. Cookie header
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {} as Record<string, string>);

    const session = cookies[AURA_QR_COOKIE_NAME];
    if (session && verifyQrSessionToken(session)) return true;
  }

  return false;
}
