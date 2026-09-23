import { createSupabaseAdmin } from "../supabase/admin";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15분

const LOCKOUT_ERROR =
  "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해 주세요.";

export { LOCKOUT_ERROR };

/** 현재 잠금 상태인지 확인 (비밀번호 검증 전에 먼저 호출) */
export function isLockedOut(store: { locked_until: string | null }): boolean {
  if (!store.locked_until) return false;
  return new Date(store.locked_until).getTime() > Date.now();
}

/** 비밀번호 검증 실패 시 시도 횟수 증가, 임계치 도달 시 잠금. 이번 시도로 막 잠겼으면 true 반환 */
export async function recordFailedAttempt(
  storeId: string,
  currentAttempts: number
): Promise<{ justLocked: boolean }> {
  const admin = createSupabaseAdmin();
  const attempts = currentAttempts + 1;
  const justLocked = attempts >= MAX_ATTEMPTS;
  const lockedUntil = justLocked
    ? new Date(Date.now() + LOCK_DURATION_MS).toISOString()
    : null;

  await admin
    .from("stores")
    .update({ failed_login_attempts: attempts, locked_until: lockedUntil })
    .eq("id", storeId);

  return { justLocked };
}

/** 로그인/비밀번호 변경 성공 시 시도 횟수 초기화 */
export async function resetLockout(storeId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin
    .from("stores")
    .update({ failed_login_attempts: 0, locked_until: null })
    .eq("id", storeId);
}
