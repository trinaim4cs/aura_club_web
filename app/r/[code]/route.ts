import { NextResponse } from "next/server";
import { clientIp, createLimiter } from "@/lib/utils/rateLimit";
import { extractScanMetadata, isValidDestinationUrl, isValidQRCode } from "@/qr/tracking";
import { getQRCodeByCode, recordQRScan } from "@/qr/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generous per-IP rate limiter to prevent automated flood / abuse
const redirectLimiter = createLimiter({ limit: 120, windowMs: 60_000 });

interface RouteContext {
  params: Promise<{ code: string }> | { code: string };
}

export async function GET(req: Request, context: RouteContext) {
  const ip = clientIp(req.headers);

  // 1. Rate limiting check
  const rateLimit = redirectLimiter.check(ip);
  if (!rateLimit.ok) {
    return new NextResponse("Too many scan requests. Please wait a moment.", {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.retryAfter),
        "Cache-Control": "private, no-store",
      },
    });
  }

  // 2. Resolve and validate route parameter
  const resolvedParams = await Promise.resolve(context.params);
  const rawCode = resolvedParams?.code;
  const code = decodeURIComponent(rawCode || "").trim().toLowerCase().replace(/\/+$/, "");

  if (!code || !isValidQRCode(code)) {
    return new NextResponse("QR code not found.", {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  // 3. Look up QR code record
  let qr;
  try {
    qr = await getQRCodeByCode(code);
  } catch (err) {
    console.error("[qr-redirect] Error querying QR record:", err);
  }

  // Resilient fallback for primary AURA portal if DB connection is cold
  if (!qr && code === "aura") {
    return NextResponse.redirect("https://join-aura.vercel.app/", {
      status: 302,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }

  // 4. Return safe 404 for missing or disabled QR codes
  if (!qr || !qr.active) {
    return new NextResponse("QR code is either inactive or does not exist.", {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  // 5. Verify destination URL protocol & format safety
  const urlCheck = isValidDestinationUrl(qr.destination_url);
  if (!urlCheck.valid) {
    console.error(`[qr-redirect] Invalid destination for code '${code}':`, qr.destination_url);
    return new NextResponse("Invalid destination configured.", {
      status: 502,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  // 6. Extract scan metadata (geo, device, OS, browser, privacy hash)
  const metadata = extractScanMetadata(req);

  // 7. Persist scan event (non-fatal: log failure but redirect anyway)
  try {
    await recordQRScan(qr.id, metadata);
  } catch (err) {
    console.error("[qr-redirect] Scan recording failed:", err);
  }

  // 8. 302 temporary redirect with strict anti-caching headers
  // Prevents browsers and CDNs from caching the redirect, guaranteeing future scans register.
  return NextResponse.redirect(qr.destination_url, {
    status: 302,
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
