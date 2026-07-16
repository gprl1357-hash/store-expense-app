import { APP_TITLE, formatAmount } from "../constants";
import type { Expense } from "../supabase/types";

export function formatExpenseNotifyMessage(expense: Expense): string {
  const memo = expense.memo?.trim() ? expense.memo.trim() : "(없음)";
  const photo = expense.photo_url ? "📷 사진 첨부" : "";
  const lines = [
    `*[지출 등록]* ${expense.date} · ${expense.category} · ${formatAmount(expense.amount)}`,
    `작성자: ${expense.created_by} | 메모: ${memo}`,
  ];
  if (photo) lines.push(photo);
  lines.push(`_${APP_TITLE}_`);
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
    `_${APP_TITLE}_`,
  ].join("\n");
}
