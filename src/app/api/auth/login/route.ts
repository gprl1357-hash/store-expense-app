import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/auth/password";
import {
  createStoreSession,
  sessionCookieName,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { STORE_IDS, type StoreId } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const storeId = body?.storeId;
  const password = body?.password;

  if (
    typeof storeId !== "string" ||
    !STORE_IDS.includes(storeId as (typeof STORE_IDS)[number]) ||
    typeof password !== "string" ||
    !password
  ) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: store, error } = await admin
    .from("stores")
    .select("id, password_hash, must_change_password, password_version")
    .eq("id", storeId)
    .maybeSingle();

  if (error || !store) {
    console.error("[auth/login] store lookup failed", { storeId, error });
    return NextResponse.json(
      { error: "매장 ID 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, store.password_hash);
  if (!valid) {
    console.error("[auth/login] password mismatch", {
      storeId,
      hashPrefix: store.password_hash?.slice(0, 7),
      hashLength: store.password_hash?.length,
    });
    return NextResponse.json(
      { error: "매장 ID 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  if (store.must_change_password) {
    return NextResponse.json({ requireChange: true });
  }

  const token = await createStoreSession(
    storeId as StoreId,
    store.password_version
  );
  const res = NextResponse.json({ requireChange: false });
  res.cookies.set(sessionCookieName(storeId), token, sessionCookieOptions());
  return res;
}
