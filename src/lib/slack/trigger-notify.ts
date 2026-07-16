import type { Expense } from "../supabase/types";

const MAX_ATTEMPTS = 3;

/** 지출 등록 Slack 알림 (클라이언트 백업 — Supabase Webhook이 주 경로) */
export async function sendSlackExpenseNotify(expense: Expense): Promise<boolean> {
  const payload = JSON.stringify({ expense, expenseId: expense.id });
  const url = `${window.location.origin}/api/slack/notify-expense`;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean; skipped?: boolean };
        if (data.ok || data.skipped) return true;
      } else {
        console.error("[slack] notify HTTP", res.status, await res.text());
      }
    } catch (err) {
      console.error("[slack] notify fetch 실패:", err);
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      url,
      new Blob([payload], { type: "application/json" })
    );
  }

  return false;
}
