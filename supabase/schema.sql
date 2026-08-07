-- ============================================================
-- 매장 지출 관리 앱 - Supabase 데이터베이스 스키마
-- Supabase Dashboard > SQL Editor 에서 이 파일 전체를 실행하세요.
-- ============================================================

-- 0. stores 테이블
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

-- 1. expenses 테이블 생성
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    TEXT NOT NULL DEFAULT 'gwangmyeong-gidc' REFERENCES public.stores(id),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  category    TEXT NOT NULL CHECK (category IN ('식자재', '공과금', '인건비', '카드', '기타')),
  amount      NUMERIC(12, 0) NOT NULL CHECK (amount > 0),
  memo        TEXT,
  created_by  TEXT NOT NULL CHECK (created_by IN ('홍혜기', '홍성미', '손선애', '신계승')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ DEFAULT NULL,
  photo_url   TEXT DEFAULT NULL
);

-- 2. 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses (created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_store_date ON public.expenses (store_id, date DESC);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 (소규모 매장 내부용 - anon 키로 CRUD 허용)
DROP POLICY IF EXISTS "expenses_select_all" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_all" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_all" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_all" ON public.expenses;

CREATE POLICY "expenses_select_all"
  ON public.expenses FOR SELECT
  USING (true);

CREATE POLICY "expenses_insert_all"
  ON public.expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "expenses_update_all"
  ON public.expenses FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "expenses_delete_all"
  ON public.expenses FOR DELETE
  USING (true);

-- 5. Realtime 구독을 위한 설정
ALTER TABLE public.expenses REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
END $$;
