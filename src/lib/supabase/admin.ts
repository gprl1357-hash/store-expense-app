import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/** 서버 전용 Supabase 클라이언트 (API Route, Server Action, 백업) */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Vercel 대시보드 이름 중복 제한으로 SUPABASE_SERVICE_ROLE_KEY 대신
  // Production=SUPABASE_PUBLIC_SERVICE_ROLE_KEY, Preview=SUPABASE_PREVIEW_SERVICE_ROLE_KEY 로 등록됨.
  // VERCEL_ENV로 명시 분기해 Preview/Development가 실수로 운영 키를 집지 않도록 한다.
  const isVercelProduction = process.env.VERCEL_ENV === "production";
  const serviceKey = isVercelProduction
    ? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_PUBLIC_SERVICE_ROLE_KEY
    : process.env.SUPABASE_PREVIEW_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey ?? anonKey;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY(또는 ANON_KEY) 가 필요합니다."
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
