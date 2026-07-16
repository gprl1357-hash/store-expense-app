import { NextRequest, NextResponse } from "next/server";
import { notifyExpenseData, parseExpensePayload } from "@/lib/slack/notify-expense";
import { isSlackEnabled } from "@/lib/slack/config";

type SupabaseWebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: unknown;
};

function verifyWebhookAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Supabase Database Webhook — expenses INSERT 시 Slack 알림 (클라이언트 무관) */
export async function POST(request: NextRequest) {
  if (!verifyWebhookAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SupabaseWebhookPayload;

    if (body.type !== "INSERT" || body.table !== "expenses") {
      return NextResponse.json({ ok: true, skipped: true, reason: "not_expenses_insert" });
    }

    if (!isSlackEnabled()) {
      return NextResponse.json({ ok: true, skipped: true, reason: "slack_disabled" });
    }

    const expense = parseExpensePayload(body.record);
    if (!expense) {
      return NextResponse.json({ error: "invalid expense record" }, { status: 400 });
    }

    if (expense.deleted_at) {
      return NextResponse.json({ ok: true, skipped: true, reason: "soft_deleted" });
    }

    const sent = await notifyExpenseData(expense);
    return NextResponse.json({ ok: sent, expenseId: expense.id, source: "webhook" });
  } catch (err) {
    console.error("[slack] webhook 실패:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "webhook failed" },
      { status: 500 }
    );
  }
}
