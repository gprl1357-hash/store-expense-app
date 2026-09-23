import {
  APP_TITLE,
  formatAmount,
  formatDateTime24KST,
  getStoreTitle,
} from "../constants";
import type { Expense, Feedback } from "../supabase/types";

export function formatExpenseNotifyMessage(expense: Expense): string {
  const memo = expense.memo?.trim() ? expense.memo.trim() : "(없음)";
  const photo = expense.photo_url ? "📷 사진 첨부" : "";
  const registeredAt = formatDateTime24KST(expense.created_at);
  const expenseDateNote =
    expense.date !== registeredAt.slice(0, 10)
      ? ` | 지출일: ${expense.date}`
      : "";
  const storeTitle = getStoreTitle(expense.store_id);
  const lines = [
    `*[지출 등록]* ${registeredAt} · ${expense.category} · ${formatAmount(expense.amount)}`,
    `매장: ${storeTitle}`,
    `작성자: ${expense.created_by}${expenseDateNote} | 메모: ${memo}`,
  ];
  if (photo) lines.push(photo);
  lines.push(`_${storeTitle}_`);
  return lines.join("\n");
}

export function formatFeedbackNotifyMessage(feedback: Feedback): string {
  const registeredAt = formatDateTime24KST(feedback.created_at);
  const storeTitle = getStoreTitle(feedback.store_id);
  const lines = [
    `*[개선요청]* ${registeredAt}`,
    `매장: ${storeTitle} | 작성자: ${feedback.created_by}`,
    feedback.message,
  ];
  for (const url of feedback.media_urls) {
    lines.push(url);
  }
  return lines.join("\n");
}

export function formatDailyBackupMessage(stats: {
  dateLabel: string;
  activeCount: number;
  deletedCount: number;
  todayCount: number;
  todayTotal: number;
  monthTotal: number;
  monthCount: number;
  storagePath: string;
}): string {
  return [
    `*[일일 백업]* ${stats.dateLabel}`,
    `• 오늘 등록: ${stats.todayCount}건 (${formatAmount(stats.todayTotal)})`,
    `• 이번 달: ${stats.monthCount}건 (${formatAmount(stats.monthTotal)})`,
    `• 전체 활성: ${stats.activeCount}건 | 휴지통: ${stats.deletedCount}건`,
    `• Storage: \`${stats.storagePath}\``,
    `_복원: npm run backup:restore -- <파일경로> [--dry-run]_`,
    `_다매장 데이터 포함 · ${APP_TITLE}_`,
  ].join("\n");
}
