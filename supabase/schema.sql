-- ============================================================
-- 매장 지출 관리 앱 - Supabase 데이터베이스 스키마
-- Supabase Dashboard > SQL Editor 에서 이 파일 전체를 실행하세요.
-- ============================================================

-- 1. expenses 테이블 생성
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  category    TEXT NOT NULL CHECK (category IN ('식자재', '공과금', '인건비', '기타')),
  amount      NUMERIC(12, 0) NOT NULL CHECK (amount > 0),
  memo        TEXT,
  created_by  TEXT NOT NULL CHECK (created_by IN ('사용자A', '사용자B', '사용자C')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses (created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses (created_at DESC);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 (소규모 매장 내부용 - anon 키로 CRUD 허용)
--    보안 강화가 필요하면 Supabase Auth + 사용자별 정책으로 교체하세요.
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

-- Realtime publication에 테이블 추가
-- (Supabase Dashboard > Database > Replication 에서 expenses 체크해도 됩니다)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
END $$;

-- 6. (선택) 샘플 데이터
-- INSERT INTO public.expenses (category, amount, memo, created_by)
-- VALUES
--   ('식자재', 45000, '채소·육류', '사용자A'),
--   ('공과금', 120000, '2월 전기세', '사용자B'),
--   ('인건비', 2500000, '2월 알바비', '사용자C');
