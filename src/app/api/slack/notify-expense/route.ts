import { NextRequest, NextResponse } from "next/server";
import {
  notifyExpenseById,
  notifyExpenseData,
  parseExpensePayload,
} from "@/lib/slack/notify-expense";
import { isSlackEnabled } from "@/lib/slack/config";

/** 지출 등록 Slack 알림 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      expenseId?: string;
      expense?: unknown;
    };

    if (!isSlackEnabled()) {
      return NextResponse.json({ ok: true, skipped: true, reason: "slack_disabled" });
    }

    const expense = parseExpensePayload(body.expense);
    if (expense) {
      const sent = await notifyExpenseData(expense);
      return NextResponse.json({ ok: sent, expenseId: expense.id, mode: "expense" });
    }

    const expenseId = body.expenseId?.trim();
    if (!expenseId) {
      return NextResponse.json({ error: "expense or expenseId required" }, { status: 400 });
    }

    const sent = await notifyExpenseById(expenseId);
    return NextResponse.json({ ok: sent, expenseId, mode: "expenseId" });
  } catch (err) {
    console.error("[slack] notify-expense API 실패:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "notify failed" },
      { status: 500 }
    );
  }
}
