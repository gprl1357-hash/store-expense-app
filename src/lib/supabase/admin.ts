import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/** 서버 전용 Supabase 클라이언트 (API Route, Server Action, 백업) */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
