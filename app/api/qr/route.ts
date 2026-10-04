import { NextResponse } from "next/server";
import { isQrAuthorized } from "@/lib/auth/qrAuth";
import { createQRCode, listQRCodesWithStats } from "@/qr/analytics";
import type { CreateQRCodeInput } from "@/qr/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isQrAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const qrs = await listQRCodesWithStats();
    return NextResponse.json({ ok: true, qrs });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isQrAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as CreateQRCodeInput;
    if (!body.code || !body.name || !body.destination_url) {
      return NextResponse.json(
        { ok: false, error: "Campaign name, QR slug, and destination URL are required." },
        { status: 400 },
      );
    }

    const { qr, error } = await createQRCode({
      code: body.code,
      name: body.name,
      destination_url: body.destination_url,
      active: body.active ?? true,
    });

    if (error || !qr) {
      return NextResponse.json({ ok: false, error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, qr }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }
}
