import { NextResponse } from "next/server";
import { isQrAuthorized } from "@/lib/auth/qrAuth";
import { deleteQRCode, updateQRCode } from "@/qr/analytics";
import type { UpdateQRCodeInput } from "@/qr/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function PATCH(req: Request, context: RouteContext) {
  if (!isQrAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await Promise.resolve(context.params);
  if (!id) return NextResponse.json({ ok: false, error: "Missing QR ID" }, { status: 400 });

  try {
    const body = (await req.json()) as UpdateQRCodeInput;
    const { qr, error } = await updateQRCode(id, body);

    if (error || !qr) {
      return NextResponse.json({ ok: false, error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, qr });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  if (!isQrAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await Promise.resolve(context.params);
  if (!id) return NextResponse.json({ ok: false, error: "Missing QR ID" }, { status: 400 });

  const { ok, error } = await deleteQRCode(id);
  if (!ok) return NextResponse.json({ ok: false, error }, { status: 400 });

  return NextResponse.json({ ok: true });
}
