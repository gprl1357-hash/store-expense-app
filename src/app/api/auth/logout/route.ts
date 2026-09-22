import { NextRequest, NextResponse } from "next/server";
import { deleteStoreSession, sessionCookieName } from "@/lib/auth/session";
import { STORE_IDS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const storeId = body?.storeId;

  if (
    typeof storeId !== "string" ||
    !STORE_IDS.includes(storeId as (typeof STORE_IDS)[number])
  ) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const token = request.cookies.get(sessionCookieName(storeId))?.value;
  if (token) {
    await deleteStoreSession(storeId, token);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(sessionCookieName(storeId));
  return res;
}
