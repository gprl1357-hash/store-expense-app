-- ============================================================
-- 개선요청(피드백) 채널 — 1단계 MVP (텍스트 + 사진)
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- 1. feedback 테이블
CREATE TABLE IF NOT EXISTS public.feedback (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     TEXT NOT NULL REFERENCES public.stores(id),
  created_by   TEXT NOT NULL,
  message      TEXT NOT NULL,
  media_urls   TEXT[] NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_store_created
  ON public.feedback (store_id, created_at DESC);

-- 2. 접근 통제 — 매장 인증(요구사항 1번)과 동일하게 서버(service role) 전용
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = anon/authenticated 전체 차단. service_role만 API Route에서 접근.

-- 3. 첨부 사진용 Storage 버킷 (동영상은 2단계에서 서명 업로드 URL 방식으로 추가 예정)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-media',
  'feedback-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "feedback_media_select" ON storage.objects;
DROP POLICY IF EXISTS "feedback_media_insert" ON storage.objects;

CREATE POLICY "feedback_media_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feedback-media');

CREATE POLICY "feedback_media_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'feedback-media');
