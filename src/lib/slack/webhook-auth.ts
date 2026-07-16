import type { NextRequest } from "next/server";

/** Webhook 인증 — Supabase UI 입력 실수를 줄이기 위해 여러 방식 허용 */
export function verifySlackWebhookAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const cronHeader = request.headers.get("x-cron-secret")?.trim();
  if (cronHeader === secret) return true;

  const auth = request.headers.get("authorization")?.trim();
  if (!auth) return false;

  if (auth === `Bearer ${secret}`) return true;
  if (auth === secret) return true;

  return false;
}
