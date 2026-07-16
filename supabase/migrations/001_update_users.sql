-- ============================================================
-- 작성자 이름 변경 마이그레이션
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- 1. 기존 CHECK 제약 제거
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_created_by_check;

-- 2. 기존 데이터 마이그레이션 (이전 이름 → 새 이름)
UPDATE public.expenses SET created_by = '홍혜기' WHERE created_by = '사용자A';
UPDATE public.expenses SET created_by = '홍성미' WHERE created_by = '사용자B';
UPDATE public.expenses SET created_by = '손선애' WHERE created_by = '사용자C';

-- 3. 새 CHECK 제약 추가
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_created_by_check
  CHECK (created_by IN ('홍혜기', '홍성미', '손선애'));
