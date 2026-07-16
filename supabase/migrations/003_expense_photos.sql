-- 지출 사진 첨부 (Storage + DB 컬럼)
-- Supabase Dashboard > SQL Editor 에서 실행하세요.

-- 1. expenses 테이블에 사진 URL 컬럼 추가
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT NULL;

-- 2. Storage bucket 생성 (영수증/사진)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-photos',
  'expense-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS 정책 (내부용 anon 허용)
DROP POLICY IF EXISTS "expense_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "expense_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "expense_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "expense_photos_delete" ON storage.objects;

CREATE POLICY "expense_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'expense-photos');

CREATE POLICY "expense_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'expense-photos');

CREATE POLICY "expense_photos_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'expense-photos');

CREATE POLICY "expense_photos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'expense-photos');
