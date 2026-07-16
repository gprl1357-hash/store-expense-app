import { APP_TITLE, currentMonthRange, todayString } from "../constants";
import type { Expense } from "../supabase/types";

export const BACKUP_SCHEMA_VERSION = 1;

export type ExpenseBackup = {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  store: string;
  stats: {
    activeCount: number;
    deletedCount: number;
    todayCount: number;
    todayTotal: number;
    monthCount: number;
    monthTotal: number;
  };
  expenses: Expense[];
};

export function computeBackupStats(expenses: Expense[]) {
  const today = todayString();
  const { start, end } = currentMonthRange();

  const active = expenses.filter((e) => !e.deleted_at);
  const deleted = expenses.filter((e) => e.deleted_at);
  const todayActive = active.filter((e) => e.date === today);
  const monthActive = active.filter((e) => e.date >= start && e.date <= end);

  return {
    activeCount: active.length,
    deletedCount: deleted.length,
    todayCount: todayActive.length,
    todayTotal: todayActive.reduce((s, e) => s + e.amount, 0),
    monthCount: monthActive.length,
    monthTotal: monthActive.reduce((s, e) => s + e.amount, 0),
  };
}

export function buildExpenseBackup(expenses: Expense[]): ExpenseBackup {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    store: APP_TITLE,
    stats: computeBackupStats(expenses),
    expenses,
  };
}

export function serializeBackup(backup: ExpenseBackup): string {
  return JSON.stringify(backup, null, 2);
}

/** KST 기준 YYYY-MM-DD */
export function kstDateString(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}
