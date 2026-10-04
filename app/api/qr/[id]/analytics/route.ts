import { NextResponse } from "next/server";
import { isQrAuthorized } from "@/lib/auth/qrAuth";
import { getQRAnalyticsSummary } from "@/qr/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(req: Request, context: RouteContext) {
  if (!isQrAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await Promise.resolve(context.params);
  if (!id) return NextResponse.json({ ok: false, error: "Missing QR ID" }, { status: 400 });

  try {
    const summary = await getQRAnalyticsSummary(id);
    if (!summary) {
      return NextResponse.json({ ok: false, error: "QR record not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, summary });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
