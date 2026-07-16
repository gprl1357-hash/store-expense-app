import type { Expense } from "../supabase/types";

/** 지출 등록 Slack 알림 — 탭 전환 전 완료 대기 */
export async function sendSlackExpenseNotify(expense: Expense): Promise<boolean> {
  try {
    const res = await fetch("/api/slack/notify-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expense }),
    });

    if (!res.ok) {
      console.error("[slack] notify HTTP", res.status, await res.text());
      return false;
    }

    const data = (await res.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch (err) {
    console.error("[slack] notify fetch 실패:", err);
    return false;
  }
}
