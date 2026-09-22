-- ============================================================
-- 매장 인증 (매장 ID 4자리 + 비밀번호) + 서버 경유 접근 통제
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. stores 인증 컬럼
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS login_id TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_version INTEGER NOT NULL DEFAULT 1;

-- 초기 비밀번호 '0000' (bcrypt 해시, 최초 로그인 시 변경 강제)
UPDATE public.stores
SET login_id = '6010',
    password_hash = crypt('0000', gen_salt('bf')),
    must_change_password = true,
    password_version = 1
WHERE id = 'gwangmyeong-gidc' AND login_id IS NULL;

UPDATE public.stores
SET login_id = '9167',
    password_hash = crypt('0000', gen_salt('bf')),
    must_change_password = true,
    password_version = 1
WHERE id = 'incheon-gajeong' AND login_id IS NULL;

ALTER TABLE public.stores ALTER COLUMN login_id SET NOT NULL;
ALTER TABLE public.stores ALTER COLUMN password_hash SET NOT NULL;

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_login_id_unique;
ALTER TABLE public.stores ADD CONSTRAINT stores_login_id_unique UNIQUE (login_id);

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_login_id_format;
ALTER TABLE public.stores ADD CONSTRAINT stores_login_id_format CHECK (login_id ~ '^[0-9]{4}$');

-- 2. 매장별 로그인 세션 (간편 로그인용, 서버 전용 테이블)
CREATE TABLE IF NOT EXISTS public.store_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  token_hash        TEXT NOT NULL UNIQUE,
  password_version  INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_sessions_store ON public.store_sessions (store_id);

ALTER TABLE public.store_sessions ENABLE ROW LEVEL SECURITY;
-- 정책을 두지 않음 = anon/authenticated 전체 차단. service_role만 RLS 우회로 접근 (서버 API 전용).

-- 3. 접근 통제를 서버(API Route, service role)로 일원화
--    브라우저(anon key)의 stores/expenses 직접 접근을 차단합니다.
--    (OWASP A01: Broken Access Control 대응 — 클라이언트가 아니라 서버가 접근을 통제)
DROP POLICY IF EXISTS "expenses_select_all" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_all" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_all" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_all" ON public.expenses;

DROP POLICY IF EXISTS "stores_select_all" ON public.stores;
DROP POLICY IF EXISTS "stores_update_all" ON public.stores;
