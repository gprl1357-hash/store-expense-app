-- Supabase Database Webhook (SQL 대안)
-- Dashboard Webhook 설정이 어려울 때 SQL Editor에서 실행
--
-- ⚠️ 실행 전:
-- 1. YOUR_CRON_SECRET → .env.local 의 CRON_SECRET 값으로 교체
-- 2. Dashboard에 동일 이름 Webhook 이 있으면 삭제 (중복 알림 방지)
--
-- Dashboard 경로: Database → Webhooks → expense-slack-notify 삭제

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 기존 trigger 제거 (있을 경우)
DROP TRIGGER IF EXISTS expense_slack_notify ON public.expenses;
DROP TRIGGER IF EXISTS "expense-slack-notify" ON public.expenses;

CREATE TRIGGER expense_slack_notify
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://store-expense-app.vercel.app/api/slack/webhook',
    'POST',
    '{"Content-Type":"application/json","x-cron-secret":"YOUR_CRON_SECRET"}',
    '{}',
    '5000'
  );
