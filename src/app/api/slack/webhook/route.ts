import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { notifyExpenseData, parseExpensePayload } from "@/lib/slack/notify-expense";
import { isSlackEnabled } from "@/lib/slack/config";
import { verifySlackWebhookAuth } from "@/lib/slack/webhook-auth";

type SupabaseWebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: unknown;
  old_record?: unknown;
};

function isExpensesInsert(body: SupabaseWebhookPayload): boolean {
  const type = body.type?.toUpperCase();
  const table = body.table?.toLowerCase();
  return type === "INSERT" && table === "expenses";
}

/** Supabase Database Webhook — expenses INSERT 시 Slack 알림 */
export async function POST(request: NextRequest) {
  if (!verifySlackWebhookAuth(request)) {
    console.warn("[slack] webhook 401 — Authorization 또는 x-cron-secret 확인");
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint: "Header: x-cron-secret: <CRON_SECRET> 또는 Authorization: Bearer <CRON_SECRET>",
      },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as SupabaseWebhookPayload;

    if (!isExpensesInsert(body)) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "not_expenses_insert",
        type: body.type,
        table: body.table,
      });
    }

    if (!isSlackEnabled()) {
      return NextResponse.json({ ok: true, skipped: true, reason: "slack_disabled" });
    }

    const expense = parseExpensePayload(body.record);
    if (!expense) {
      console.warn("[slack] webhook invalid record:", JSON.stringify(body.record));
      return NextResponse.json({ error: "invalid expense record" }, { status: 400 });
    }

    if (expense.deleted_at) {
      return NextResponse.json({ ok: true, skipped: true, reason: "soft_deleted" });
    }

    // Supabase 기본 timeout(1s) 대비 — 먼저 200 응답, Slack은 백그라운드 전송
    after(async () => {
      try {
        await notifyExpenseData(expense);
        console.log("[slack] webhook sent:", expense.id);
      } catch (err) {
        console.error("[slack] webhook after() 실패:", expense.id, err);
      }
    });

    return NextResponse.json({
      ok: true,
      queued: true,
      expenseId: expense.id,
      source: "webhook",
    });
  } catch (err) {
    console.error("[slack] webhook 실패:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "webhook failed" },
      { status: 500 }
    );
  }
}

/** 연결 확인용 (인증 필요) */
export async function GET(request: NextRequest) {
  if (!verifySlackWebhookAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    slackEnabled: isSlackEnabled(),
    message: "Slack webhook endpoint ready",
  });
}
