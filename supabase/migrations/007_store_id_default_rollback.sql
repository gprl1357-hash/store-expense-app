-- ============================================================
-- store_id 기본값 — 긴급 코드 롤백(v1.3.1) 시 INSERT 호환
-- Supabase SQL Editor에서 실행 (006 적용 후 1회)
-- ============================================================

ALTER TABLE public.expenses
  ALTER COLUMN store_id SET DEFAULT 'gwangmyeong-gidc';
