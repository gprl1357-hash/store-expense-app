-- ============================================================
-- 로그인 시도 제한 (무차별 대입 방지)
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;
