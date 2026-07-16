-- 삭제 복원(소프트 삭제) 기능
-- Supabase SQL Editor에서 실행

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at
  ON public.expenses (deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN public.expenses.deleted_at IS '삭제 시각 (NULL=활성, 값 있음=휴지통)';
