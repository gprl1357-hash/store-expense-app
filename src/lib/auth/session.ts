import { randomBytes, createHash } from "crypto";
import { createSupabaseAdmin } from "../supabase/admin";
import type { StoreId } from "../constants";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1년 (자동 로그인)

export function sessionCookieName(storeId: string): string {
  return `store_session_${storeId}`;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** 세션 발급: DB에 토큰 해시 저장 + 쿠키에 담을 평문 토큰 반환 */
export async function createStoreSession(
  storeId: StoreId,
  passwordVersion: number
): Promise<string> {
  const token = generateSessionToken();
  const admin = createSupabaseAdmin();

  const { error } = await admin.from("store_sessions").insert({
    store_id: storeId,
    token_hash: hashToken(token),
    password_version: passwordVersion,
  });

  if (error) throw error;
  return token;
}

/** 쿠키에 담긴 토큰이 유효한 세션인지 확인 (매장 password_version과 일치해야 함) */
export async function verifyStoreSession(
  storeId: string,
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;

  const admin = createSupabaseAdmin();
  const { data: store, error: storeError } = await admin
    .from("stores")
    .select("password_version")
    .eq("id", storeId)
    .maybeSingle();

  if (storeError || !store) return false;

  const { data: session, error } = await admin
    .from("store_sessions")
    .select("id, password_version")
    .eq("store_id", storeId)
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error || !session) return false;
  if (session.password_version !== store.password_version) return false;

  await admin
    .from("store_sessions")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", session.id);

  return true;
}

/** 특정 세션(현재 기기) 삭제 — 로그아웃 */
export async function deleteStoreSession(
  storeId: string,
  token: string
): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin
    .from("store_sessions")
    .delete()
    .eq("store_id", storeId)
    .eq("token_hash", hashToken(token));
}

/** 매장의 모든 세션 삭제 — 비밀번호 변경 시 간편 로그인 전체 무효화 */
export async function deleteAllStoreSessions(storeId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin.from("store_sessions").delete().eq("store_id", storeId);
}
