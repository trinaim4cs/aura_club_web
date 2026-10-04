import crypto from "crypto";
import { geolocation, ipAddress } from "@vercel/functions";
import type { DeviceType, ScanMetadata } from "./types";
import { clientIp } from "@/lib/utils/rateLimit";

const MAX_URL_LENGTH = 2048;
const MAX_REFERRER_LENGTH = 255;
const QR_CODE_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Validates a dynamic QR code identifier format.
 * Must be 1-64 alphanumeric characters, dashes, or underscores.
 */
export function isValidQRCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  return QR_CODE_REGEX.test(code.trim());
}

/**
 * Validates the safety of a destination redirect URL.
 * Only HTTP and HTTPS protocols are permitted.
 * Blocks dangerous schemes (javascript:, data:, file:, etc.) and excessive lengths.
 */
export function isValidDestinationUrl(urlStr: string): { valid: boolean; error?: string } {
  if (!urlStr || typeof urlStr !== "string") {
    return { valid: false, error: "Destination URL is required." };
  }

  const trimmed = urlStr.trim();
  if (trimmed.length > MAX_URL_LENGTH) {
    return { valid: false, error: `Destination URL exceeds maximum length of ${MAX_URL_LENGTH} characters.` };
  }

  // Reject obvious control characters or newlines
  if (/[\r\n\t]/.test(trimmed)) {
    return { valid: false, error: "Destination URL contains invalid characters." };
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== "http:" && protocol !== "https:") {
      return { valid: false, error: `Prohibited URL protocol '${protocol}'. Only HTTP and HTTPS are permitted.` };
    }

    if (!parsed.hostname || parsed.hostname.includes(" ")) {
      return { valid: false, error: "Invalid hostname." };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Malformed destination URL." };
  }
}

/**
 * Known web crawler and bot patterns.
 */
const BOT_PATTERNS = [
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /twitterbot/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /embedly/i,
  /quora link preview/i,
  /showyoubot/i,
  /outbrain/i,
  /pinterest/i,
  /applebot/i,
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /headlesschrome/i,
  /go-http-client/i,
  /postman/i,
  /insomnia/i,
  /node-fetch/i,
  /axios/i,
  /http-client/i,
];

export function isBotUserAgent(ua: string): boolean {
  if (!ua) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(ua));
}

/**
 * Zero-dependency fast User-Agent parser.
 * Extracts device type, operating system, and browser brand.
 */
export function parseUserAgent(ua: string): {
  deviceType: DeviceType;
  operatingSystem: string;
  browser: string;
  isBot: boolean;
} {
  if (!ua || ua.trim() === "") {
    return {
      deviceType: "unknown",
      operatingSystem: "unknown",
      browser: "unknown",
      isBot: false,
    };
  }

  const isBot = isBotUserAgent(ua);

  // 1. Device Type
  let deviceType: DeviceType = "unknown";
  if (isBot) {
    deviceType = "bot";
  } else if (/ipad|tablet|(android(?!.*mobile))|silk|playbook|kindle/i.test(ua)) {
    deviceType = "tablet";
  } else if (/iphone|ipod|mobile|android.*mobile|blackberry|bb10|opera mini|iemobile|wpdesktop/i.test(ua)) {
    deviceType = "mobile";
  } else if (/macintosh|windows nt|linux|cros|x11/i.test(ua)) {
    deviceType = "desktop";
  }

  // 2. Operating System
  let operatingSystem = "unknown";
  if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/OS (\d+[._]\d+)/i);
    operatingSystem = match ? `iOS ${match[1].replace("_", ".")}` : "iOS";
  } else if (/android/i.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/i);
    operatingSystem = match ? `Android ${match[1]}` : "Android";
  } else if (/macintosh|mac os x/i.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/i);
    operatingSystem = match ? `macOS ${match[1].replace("_", ".")}` : "macOS";
  } else if (/windows nt/i.test(ua)) {
    if (/windows nt 10\.0/i.test(ua)) operatingSystem = "Windows 10/11";
    else if (/windows nt 6\.3/i.test(ua)) operatingSystem = "Windows 8.1";
    else if (/windows nt 6\.1/i.test(ua)) operatingSystem = "Windows 7";
    else operatingSystem = "Windows";
  } else if (/cros/i.test(ua)) {
    operatingSystem = "ChromeOS";
  } else if (/linux/i.test(ua)) {
    operatingSystem = "Linux";
  }

  // 3. Browser
  let browser = "unknown";
  if (/samsungbrowser/i.test(ua)) {
    browser = "Samsung Internet";
  } else if (/edg([ea]|ios)?\//i.test(ua)) {
    browser = "Microsoft Edge";
  } else if (/opr\/|opera/i.test(ua)) {
    browser = "Opera";
  } else if (/brave/i.test(ua)) {
    browser = "Brave";
  } else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua) && !/opr/i.test(ua)) {
    browser = "Chrome";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) {
    browser = "Safari";
  } else if (/msie|trident/i.test(ua)) {
    browser = "Internet Explorer";
  } else if (isBot) {
    browser = "Bot/Crawler";
  }

  return { deviceType, operatingSystem, browser, isBot };
}

/**
 * Extracts and sanitizes referrer. Strips internal auth parameters.
 */
export function sanitizeReferrer(ref: string | null): string | null {
  if (!ref || typeof ref !== "string") return null;
  const trimmed = ref.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    // Keep origin and pathname, strip query params to prevent leaking tokens
    const sanitized = `${url.origin}${url.pathname}`;
    return sanitized.slice(0, MAX_REFERRER_LENGTH);
  } catch {
    return trimmed.slice(0, MAX_REFERRER_LENGTH);
  }
}

/**
 * Deterministic salted SHA-256 hash generator.
 * Raw IP address is used ONLY in-memory to compute this hash, then discarded.
 */
export function generateVisitorHash(ip: string, userAgent: string): { userAgentHash: string; visitorHash: string } {
  const salt = process.env.QR_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "aura-default-privacy-salt";

  const userAgentHash = crypto
    .createHash("sha256")
    .update(userAgent || "unknown-ua")
    .digest("hex");

  const visitorHash = crypto
    .createHash("sha256")
    .update(`${salt}:${ip || "unknown-ip"}:${userAgent || "unknown-ua"}`)
    .digest("hex");

  return { userAgentHash, visitorHash };
}

/**
 * Extracts comprehensive scan metadata from request.
 * Leverages Vercel Functions API with header fallbacks.
 */
export function extractScanMetadata(req: Request): ScanMetadata {
  const headers = req.headers;

  // 1. Geolocation via @vercel/functions or headers
  let geoCountry: string | null = null;
  let geoRegion: string | null = null;
  let geoCity: string | null = null;
  let geoLat: number | null = null;
  let geoLong: number | null = null;
  let geoPostal: string | null = null;

  try {
    const vGeo = geolocation(req);
    if (vGeo) {
      geoCountry = vGeo.country ?? null;
      geoRegion = vGeo.countryRegion ?? null;
      geoCity = vGeo.city ?? null;
      geoLat = vGeo.latitude ? parseFloat(vGeo.latitude) : null;
      geoLong = vGeo.longitude ? parseFloat(vGeo.longitude) : null;
      geoPostal = vGeo.postalCode ?? null;
    }
  } catch {
    // Fallback to direct headers if geolocation(req) throws outside Vercel
  }

  // Fallback headers if values not set by helper
  if (!geoCountry) geoCountry = headers.get("x-vercel-ip-country");
  if (!geoRegion) geoRegion = headers.get("x-vercel-ip-country-region");
  if (!geoCity) geoCity = headers.get("x-vercel-ip-city");
  if (geoLat === null && headers.get("x-vercel-ip-latitude")) {
    const parsed = parseFloat(headers.get("x-vercel-ip-latitude")!);
    if (!isNaN(parsed)) geoLat = parsed;
  }
  if (geoLong === null && headers.get("x-vercel-ip-longitude")) {
    const parsed = parseFloat(headers.get("x-vercel-ip-longitude")!);
    if (!isNaN(parsed)) geoLong = parsed;
  }
  if (!geoPostal) geoPostal = headers.get("x-vercel-ip-postal-code");

  // 2. IP extraction for transient hashing only (NEVER stored)
  let rawIp = "unknown";
  try {
    const vIp = ipAddress(req);
    if (vIp) rawIp = vIp;
  } catch {
    // fallback
  }
  if (rawIp === "unknown") {
    rawIp = clientIp(headers);
  }

  // 3. User-Agent parsing
  const rawUa = headers.get("user-agent") ?? "";
  const { deviceType, operatingSystem, browser, isBot } = parseUserAgent(rawUa);

  // 4. Privacy hashing
  const { userAgentHash, visitorHash } = generateVisitorHash(rawIp, rawUa);

  // 5. Referrer
  const rawRef = headers.get("referer") || headers.get("referrer");
  const referrer = sanitizeReferrer(rawRef);

  return {
    country: geoCountry,
    region: geoRegion,
    city: geoCity,
    latitude: geoLat,
    longitude: geoLong,
    postal_code: geoPostal,
    device_type: deviceType,
    operating_system: operatingSystem,
    browser,
    referrer,
    user_agent_hash: userAgentHash,
    visitor_hash: visitorHash,
    is_bot: isBot,
  };
}
