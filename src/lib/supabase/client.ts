import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** 브라우저용 Supabase 클라이언트 (Realtime 포함) */
export function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 .env.local 에 설정해 주세요."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
}

/** 싱글톤 클라이언트 (클라이언트 컴포넌트에서 재사용) */
let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabase() {
  if (!browserClient) {
    browserClient = createSupabaseClient();
  }
  return browserClient;
}
