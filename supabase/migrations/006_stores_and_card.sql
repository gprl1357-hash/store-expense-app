-- ============================================================
-- 다매장(store_id) + 카드 카테고리 + 작성자(신계승) + stores 예산
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- 1. stores 테이블
CREATE TABLE IF NOT EXISTS public.stores (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  monthly_budget  NUMERIC(12, 0) NOT NULL DEFAULT 10000000
                  CHECK (monthly_budget > 0),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.stores (id, name, monthly_budget) VALUES
  ('gwangmyeong-gidc', '광명GIDC점', 10000000),
  ('incheon-gajeong', '인천가정점', 10000000)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_select_all" ON public.stores;
DROP POLICY IF EXISTS "stores_update_all" ON public.stores;

CREATE POLICY "stores_select_all"
  ON public.stores FOR SELECT
  USING (true);

CREATE POLICY "stores_update_all"
  ON public.stores FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 2. expenses.store_id 추가 및 기존 데이터 백필
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS store_id TEXT REFERENCES public.stores(id);

UPDATE public.expenses
SET store_id = 'gwangmyeong-gidc'
WHERE store_id IS NULL;

ALTER TABLE public.expenses
  ALTER COLUMN store_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_store_date
  ON public.expenses (store_id, date DESC);

-- 3. category CHECK — 카드 추가
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_category_check
  CHECK (category IN ('식자재', '공과금', '인건비', '카드', '기타'));

-- 4. created_by CHECK — 신계승 추가
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_created_by_check;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_created_by_check
  CHECK (created_by IN ('홍혜기', '홍성미', '손선애', '신계승'));
