import { NextResponse } from "next/server";
import {
  AURA_QR_COOKIE_NAME,
  createQrSessionToken,
  isQrAuthorized,
  verifyQrPassword,
} from "@/lib/auth/qrAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { password?: string };
    if (!verifyQrPassword(body.password)) {
      return NextResponse.json({ ok: false, error: "Incorrect access key." }, { status: 401 });
    }

    const token = createQrSessionToken();
    const res = NextResponse.json({ ok: true, token });

    res.cookies.set({
      name: AURA_QR_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
  }
}

export function GET(req: Request) {
  const authenticated = isQrAuthorized(req);
  return NextResponse.json({ authenticated });
}

export function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: AURA_QR_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return res;
}
