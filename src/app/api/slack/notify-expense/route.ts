import { NextRequest, NextResponse } from "next/server";
import { notifyExpenseById } from "@/lib/slack/notify-expense";
import { isSlackEnabled } from "@/lib/slack/config";

/** 지출 등록 Slack 알림 — Production에서 Server Action 취소 방지용 API */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { expenseId?: string };
    const expenseId = body.expenseId?.trim();

    if (!expenseId) {
      return NextResponse.json({ error: "expenseId required" }, { status: 400 });
    }

    if (!isSlackEnabled()) {
      return NextResponse.json({ ok: true, skipped: true, reason: "slack_disabled" });
    }

    const sent = await notifyExpenseById(expenseId);
    return NextResponse.json({ ok: sent, expenseId });
  } catch (err) {
    console.error("[slack] notify-expense API 실패:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "notify failed" },
      { status: 500 }
    );
  }
}
