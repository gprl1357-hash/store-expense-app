import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  hashPassword,
  validatePasswordRules,
  verifyPassword,
} from "@/lib/auth/password";
import {
  createStoreSession,
  deleteAllStoreSessions,
  sessionCookieName,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { STORE_IDS, type StoreId } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const storeId = body?.storeId;
  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;

  if (
    typeof storeId !== "string" ||
    !STORE_IDS.includes(storeId as (typeof STORE_IDS)[number]) ||
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string"
  ) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const validation = validatePasswordRules(newPassword);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: store, error } = await admin
    .from("stores")
    .select("id, password_hash, password_version")
    .eq("id", storeId)
    .maybeSingle();

  if (error || !store) {
    return NextResponse.json({ error: "매장을 찾을 수 없습니다." }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, store.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "현재 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const newHash = await hashPassword(newPassword);
  const nextVersion = store.password_version + 1;

  const { error: updateError } = await admin
    .from("stores")
    .update({
      password_hash: newHash,
      must_change_password: false,
      password_version: nextVersion,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);

  if (updateError) {
    return NextResponse.json({ error: "비밀번호 변경에 실패했습니다." }, { status: 500 });
  }

  // 기존 간편 로그인(다른 기기 포함) 전부 무효화 후 현재 기기 세션 재발급
  await deleteAllStoreSessions(storeId);
  const token = await createStoreSession(storeId as StoreId, nextVersion);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(storeId), token, sessionCookieOptions());
  return res;
}
