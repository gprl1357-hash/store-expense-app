-- 일일 백업 JSON 저장용 Storage 버킷
-- Supabase Dashboard > SQL Editor 에서 실행하세요.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-backups',
  'expense-backups',
  false,
  10485760,
  ARRAY['application/json']
)
ON CONFLICT (id) DO NOTHING;

-- 서버(service role) 전용 — anon 클라이언트는 접근 불가 (정책 없음)
