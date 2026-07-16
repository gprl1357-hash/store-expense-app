"use server";

import { notifyExpenseById } from "@/lib/slack/notify-expense";

/** @deprecated API Route(/api/slack/notify-expense) 사용 권장 — Production 탭 전환 시 취소 방지 */
export async function notifyExpenseRegistered(expenseId: string): Promise<void> {
  try {
    await notifyExpenseById(expenseId);
  } catch (err) {
    console.error("[slack] 지출 등록 알림 실패:", err);
  }
}
