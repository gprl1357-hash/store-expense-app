/** Production에서 탭 전환 시에도 Slack 알림이 전송되도록 keepalive fetch 사용 */
export function triggerSlackExpenseNotify(expenseId: string): void {
  fetch("/api/slack/notify-expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expenseId }),
    keepalive: true,
  }).catch((err) => console.error("[slack] notify fetch 실패:", err));
}
