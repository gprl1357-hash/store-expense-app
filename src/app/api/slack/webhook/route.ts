import { NextRequest, NextResponse } from "next/server";
import {
  notifyExpenseById,
  notifyExpenseData,
  parseExpensePayload,
} from "@/lib/slack/notify-expense";
import { isSlackEnabled } from "@/lib/slack/config";
import { verifySlackWebhookAuth } from "@/lib/slack/webhook-auth";

type SupabaseWebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: unknown;
  old_record?: unknown;
};

function normalizeWebhookPayload(raw: unknown): SupabaseWebhookPayload {
  if (!raw || typeof raw !== "object") return {};
  const body = raw as Record<string, unknown>;

  // Supabase Dashboard / pg_net 공통 형식
  if (body.type && body.table) {
    return body as SupabaseWebhookPayload;
  }

  // 중첩 payload 대비
  if (body.data && typeof body.data === "object") {
    return body.data as SupabaseWebhookPayload;
  }

  return body as SupabaseWebhookPayload;
}

function isExpensesInsert(body: SupabaseWebhookPayload): boolean {
  const type = body.type?.toUpperCase();
  const table = body.table?.toLowerCase() ?? "";
  const isInsert = type === "INSERT";
  const isExpensesTable =
    table === "expenses" ||
    table === "public.expenses" ||
    table.endsWith(".expenses");
  return isInsert && isExpensesTable;
}

function extractRecordId(record: unknown): string | null {
  if (!record || typeof record !== "object") return null;
  const id = (record as Record<string, unknown>).id;
  return typeof id === "string" && id ? id : null;
}

/** Supabase Database Webhook — expenses INSERT 시 Slack 알림 */
export async function POST(request: NextRequest) {
  if (!verifySlackWebhookAuth(request)) {
    console.warn("[slack] webhook 401 — x-cron-secret 확인");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = normalizeWebhookPayload(await request.json());

    if (!isExpensesInsert(body)) {
      console.warn("[slack] webhook skipped:", body.type, body.table);
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

    let expense = parseExpensePayload(body.record);

    if (!expense) {
      const recordId = extractRecordId(body.record);
      if (recordId) {
        const sent = await notifyExpenseById(recordId);
        return NextResponse.json({
          ok: sent,
          expenseId: recordId,
          source: "webhook",
          mode: "expenseId_fallback",
          slackSent: sent,
        });
      }

      console.warn("[slack] webhook invalid record:", JSON.stringify(body.record));
      return NextResponse.json({ error: "invalid expense record" }, { status: 400 });
    }

    if (expense.deleted_at) {
      return NextResponse.json({ ok: true, skipped: true, reason: "soft_deleted" });
    }

    // after()는 Vercel에서 Slack 전송 전 종료될 수 있음 — 반드시 await
    const sent = await notifyExpenseData(expense);

    if (!sent) {
      return NextResponse.json(
        { ok: false, error: "slack_send_failed", expenseId: expense.id },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      expenseId: expense.id,
      source: "webhook",
      slackSent: true,
    });
  } catch (err) {
    console.error("[slack] webhook 실패:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "webhook failed",
        slackSent: false,
      },
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
