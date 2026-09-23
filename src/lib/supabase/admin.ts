import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { isVercelNonProduction } from "../env";

// Vercel 대시보드 이름 중복 제한으로 SUPABASE_SERVICE_ROLE_KEY 대신
// Production=SUPABASE_PUBLIC_SERVICE_ROLE_KEY, Preview=SUPABASE_PREVIEW_SERVICE_ROLE_KEY 로 등록됨.
// Preview/Development(로컬 제외)는 SUPABASE_PREVIEW_SERVICE_ROLE_KEY가 없으면
// 절대 운영 키로 폴백하지 않는다 — 실수로 운영 DB에 쓰기 요청을 보내는 사고 방지.
function resolveServiceKey(): string | undefined {
  if (isVercelNonProduction(process.env.VERCEL_ENV)) {
    return process.env.SUPABASE_PREVIEW_SERVICE_ROLE_KEY;
  }
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_PUBLIC_SERVICE_ROLE_KEY
  );
}

let cachedAdmin: ReturnType<typeof createClient<Database>> | null = null;

/** 서버 전용 Supabase 클라이언트 (API Route, Server Action, 백업) — 프로세스당 1개 재사용 */
export function createSupabaseAdmin() {
  if (cachedAdmin) return cachedAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = resolveServiceKey() ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY(또는 ANON_KEY) 가 필요합니다."
    );
  }

  cachedAdmin = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdmin;
}
